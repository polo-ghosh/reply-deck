import type { CarouselConfig, Env, WebhookEntry, WebhookPayload } from '../types';
import { claimEvent, clearConversationState, listEnabledCarousels, logEvent, parseCarouselConfig, purgeUserData, setConversationState } from '../lib/db';
import { metaSignatureValid, parseSignedRequest } from '../lib/crypto';
import { HttpError, json } from '../lib/http';
import { genericTemplateBody, sendMessage } from '../lib/meta';
import { decryptToken } from '../lib/db';
import { getUserByIgId } from '../lib/db';

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function textMatches(trigger: CarouselConfig['trigger'], text: string): boolean {
  const expected = normalize(trigger.value);
  const actual = normalize(text);
  if (!expected || !actual) return false;
  return trigger.match === 'exact' ? expected === actual : actual.includes(expected);
}

function pickCarousel(carousels: { id: string; config: CarouselConfig }[], kind: 'keyword' | 'comment' | 'postback', input: string) {
  return carousels.find(({ config }) => {
    if (config.trigger.type !== kind) return false;
    if (kind === 'postback') return normalize(config.trigger.value) === normalize(input);
    return textMatches(config.trigger, input);
  });
}

export async function handleWebhookVerification(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge') ?? '';
  if (mode === 'subscribe' && token && token === env.META_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
  return new Response('Forbidden', { status: 403 });
}

export async function handleWebhook(request: Request, env: Env): Promise<Response> {
  const rawBody = await request.text();
  if (!(await metaSignatureValid(rawBody, request.headers.get('X-Hub-Signature-256'), env.IG_APP_SECRET))) {
    return json({ error: 'Invalid signature' }, env, 403);
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return json({ error: 'Invalid payload' }, env, 400);
  }

  if (payload.object !== 'instagram' || !Array.isArray(payload.entry)) {
    return json({ ok: true, ignored: true }, env);
  }

  for (const entry of payload.entry) {
    try {
      await processEntry(env, entry);
    } catch (error) {
      await logEvent(env, {
        igAccountId: entry.id,
        type: 'webhook_entry_error',
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return json({ ok: true }, env);
}

async function processEntry(env: Env, entry: WebhookEntry): Promise<void> {
  const user = await getUserByIgId(env, entry.id);
  if (!user || user.status !== 'active') return;

  const token = await decryptToken(env, user);
  const rows = await listEnabledCarousels(env, user.id);
  const carousels = rows.map((row) => ({ id: row.id, config: parseCarouselConfig(row) }));

  for (const event of entry.messaging ?? []) {
    const senderId = event.sender?.id;
    if (!senderId) continue;
    const messageId = event.message?.mid ?? event.postback?.mid;
    if (messageId && !(await claimEvent(env, `dm:${messageId}`))) continue;

    if (event.message?.is_deleted) {
      await clearConversationState(env, user.id, senderId);
      await logEvent(env, { userId: user.id, igAccountId: entry.id, type: 'message_unsent', detail: messageId ?? '' });
      continue;
    }

    const text = event.message?.text ?? '';
    const postbackPayload = event.postback?.payload ?? '';
    const selected = text
      ? pickCarousel(carousels, 'keyword', text)
      : postbackPayload
        ? pickCarousel(carousels, 'postback', postbackPayload)
        : undefined;
    if (!selected) continue;

    try {
      await sendMessage(env, token, entry.id, genericTemplateBody({ id: senderId }, selected.config));
      await setConversationState(env, user.id, senderId, selected.id);
      await logEvent(env, {
        userId: user.id,
        igAccountId: entry.id,
        type: 'carousel_sent',
        detail: `${selected.id} | ${messageId ?? postbackPayload}`,
      });
    } catch (error) {
      await logEvent(env, {
        userId: user.id,
        igAccountId: entry.id,
        type: 'send_failed',
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }

  for (const change of entry.changes ?? []) {
    if (change.field !== 'comments') continue;
    const commentId = change.value.id;
    const commentText = change.value.text ?? '';
    if (!commentId || !commentText) continue;
    if (!(await claimEvent(env, `comment:${commentId}`))) continue;

    const selected = pickCarousel(carousels, 'comment', commentText);
    if (!selected) continue;

    try {
      await sendMessage(env, token, entry.id, genericTemplateBody({ comment_id: commentId }, selected.config));
      await logEvent(env, {
        userId: user.id,
        igAccountId: entry.id,
        type: 'comment_trigger_sent',
        detail: `${selected.id} | ${commentId}`,
      });
    } catch {
      try {
        await sendMessage(env, token, entry.id, {
          recipient: { comment_id: commentId },
          message: { text: selected.config.fallback_text || 'Check your DMs for the details.' },
        });
        await logEvent(env, {
          userId: user.id,
          igAccountId: entry.id,
          type: 'comment_trigger_fallback',
          detail: commentId,
        });
      } catch (fallbackError) {
        await logEvent(env, {
          userId: user.id,
          igAccountId: entry.id,
          type: 'comment_trigger_failed',
          detail: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
        });
      }
    }
  }
}

export async function handleDataDeletion(request: Request, env: Env): Promise<Response> {
  const contentType = request.headers.get('Content-Type') ?? '';
  let signedRequest: string | undefined;
  if (contentType.includes('application/json')) {
    const body = (await request.json()) as { signed_request?: unknown };
    signedRequest = typeof body.signed_request === 'string' ? body.signed_request : undefined;
  } else {
    const form = await request.formData();
    const value = form.get('signed_request');
    signedRequest = typeof value === 'string' ? value : undefined;
  }
  if (!signedRequest) throw new HttpError('Missing signed_request', 400);

  const payload = await parseSignedRequest(signedRequest, env.IG_APP_SECRET);
  const igAccountId = typeof payload?.user_id === 'string' ? payload.user_id : '';
  if (!igAccountId) throw new HttpError('Invalid signed_request', 400);
  await purgeUserData(env, igAccountId);

  return json(
    {
      url: `${new URL(request.url).origin}/privacy?status=deleted`,
      confirmation_code: crypto.randomUUID(),
    },
    env,
  );
}
