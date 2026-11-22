import type { Env } from '../types';
import { signJson, parseSignedRequest, verifyJson } from '../lib/crypto';
import { getUserByIgId, logEvent, purgeUserData, upsertUser } from '../lib/db';
import { createSession, requireUser } from '../lib/auth';
import { sessionSecret } from '../lib/keys';
import { HttpError, json } from '../lib/http';
import {
  buildAuthorizeUrl,
  exchangeCodeForShortToken,
  exchangeForLongLivedToken,
  getIgProfile,
  subscribeWebhook,
} from '../lib/meta';

interface StatePayload {
  nonce: string;
  iat: number;
  exp: number;
}

const STATE_TTL_MS = 10 * 60 * 1000;

function redirectUri(request: Request): string {
  return `${new URL(request.url).origin}/auth/callback`;
}

function webUrl(request: Request, path: string): string {
  return `${new URL(request.url).origin}${path}`;
}

function redirectWithError(request: Request, env: Env, message: string): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: webUrl(request, `/?error=${encodeURIComponent(message)}`) },
  });
}

export async function handleLogin(request: Request, env: Env): Promise<Response> {
  const state: StatePayload = {
    nonce: crypto.randomUUID(),
    iat: Date.now(),
    exp: Date.now() + STATE_TTL_MS,
  };
  const signedState = await signJson(state, sessionSecret(env));
  return new Response(null, {
    status: 302,
    headers: {
      Location: buildAuthorizeUrl(env, redirectUri(request), signedState),
      'Cache-Control': 'no-store',
    },
  });
}

export async function handleCallback(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const rawCode = url.searchParams.get('code') ?? '';
  const code = rawCode.replace(/#_$/, '');
  const state = url.searchParams.get('state') ?? '';
  const error = url.searchParams.get('error');

  if (error) return redirectWithError(request, env, error);
  if (!code) return redirectWithError(request, env, 'Instagram did not return an authorization code');
  if (!state) return redirectWithError(request, env, 'Missing OAuth state');

  const statePayload = await verifyJson<StatePayload>(state, sessionSecret(env));
  if (!statePayload || statePayload.exp < Date.now()) return redirectWithError(request, env, 'OAuth state expired. Please try again.');

  try {
    const shortToken = await exchangeCodeForShortToken(env, code, redirectUri(request));
    if (!shortToken.access_token) throw new Error('No short-lived token returned');
    const longToken = await exchangeForLongLivedToken(env, shortToken.access_token);
    if (!longToken.access_token) throw new Error('No long-lived token returned');

    const profile = await getIgProfile(env, longToken.access_token);
    const issuedAt = Date.now();
    const expiresAt = issuedAt + (longToken.expires_in || 60 * 24 * 60 * 60) * 1000;
    const user = await upsertUser(env, {
      igAccountId: profile.id,
      username: profile.username,
      token: longToken.access_token,
      issuedAt,
      expiresAt,
      scopes: shortToken.permissions ?? '',
    });

    try {
      await subscribeWebhook(env, profile.id, longToken.access_token);
    } catch (subscriptionError) {
      await logEvent(env, {
        userId: user.id,
        igAccountId: profile.id,
        type: 'webhook_subscribe_failed',
        detail: subscriptionError instanceof Error ? subscriptionError.message : String(subscriptionError),
      });
    }

    const session = await createSession(env, user);
    return new Response(null, {
      status: 302,
      headers: {
        Location: webUrl(request, `/callback?session=${encodeURIComponent(session)}`),
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
      },
    });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'OAuth exchange failed';
    await logEvent(env, { igAccountId: null, type: 'oauth_failed', detail: message });
    return redirectWithError(request, env, message);
  }
}

export async function handleDeauthorize(request: Request, env: Env): Promise<Response> {
  const form = await request.formData();
  const signedRequest = form.get('signed_request');
  if (typeof signedRequest !== 'string') throw new HttpError('Missing signed_request', 400);
  const payload = await parseSignedRequest(signedRequest, env.IG_APP_SECRET);
  const igAccountId = typeof payload?.user_id === 'string' ? payload.user_id : '';
  if (!igAccountId) throw new HttpError('Invalid signed_request', 400);
  await purgeUserData(env, igAccountId);
  return json({ ok: true }, env);
}

export async function handleMe(request: Request, env: Env): Promise<Response> {
  const { user } = await requireUser(request, env);
  return json(
    {
      id: user.ig_account_id,
      username: user.username,
      status: user.status,
      tokenExpiresAt: user.token_expires_at,
      connectedAt: user.created_at,
    },
    env,
  );
}

export async function handleDisconnect(request: Request, env: Env): Promise<Response> {
  const { user } = await requireUser(request, env);
  const connected = await getUserByIgId(env, user.ig_account_id);
  if (connected) await purgeUserData(env, user.ig_account_id);
  return json({ ok: true }, env);
}
