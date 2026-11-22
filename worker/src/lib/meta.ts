import type { CarouselConfig, Env, MetaTokenResponse } from '../types';
import { SCOPES } from '../types';

export class GraphError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'GraphError';
  }
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  let body: Record<string, unknown> = {};
  try {
    body = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    body = { raw: text };
  }
  if (!response.ok) {
    const error = body.error as Record<string, unknown> | undefined;
    const message = (error?.message ?? error?.error_user_msg ?? body.error_message ?? response.statusText) as string;
    throw new GraphError(message || 'Graph API request failed', response.status, error?.code as string | undefined);
  }
  return body;
}

export function graphBase(env: Env): string {
  return `https://graph.instagram.com/${env.IG_API_VERSION || 'v26.0'}`;
}

export function buildAuthorizeUrl(env: Env, redirectUri: string, state: string): string {
  const url = new URL('https://www.instagram.com/oauth/authorize');
  url.searchParams.set('client_id', env.IG_APP_ID);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', SCOPES);
  url.searchParams.set('state', state);
  return url.toString();
}

export async function exchangeCodeForShortToken(env: Env, code: string, redirectUri: string): Promise<MetaTokenResponse> {
  const form = new FormData();
  form.set('client_id', env.IG_APP_ID);
  form.set('client_secret', env.IG_APP_SECRET);
  form.set('grant_type', 'authorization_code');
  form.set('redirect_uri', redirectUri);
  form.set('code', code);
  const response = await fetch('https://api.instagram.com/oauth/access_token', { method: 'POST', body: form });
  return (await readJson(response)) as unknown as MetaTokenResponse;
}

export async function exchangeForLongLivedToken(env: Env, shortLivedToken: string): Promise<MetaTokenResponse> {
  const url = new URL('https://graph.instagram.com/access_token');
  url.searchParams.set('grant_type', 'ig_exchange_token');
  url.searchParams.set('client_secret', env.IG_APP_SECRET);
  url.searchParams.set('access_token', shortLivedToken);
  const response = await fetch(url, { method: 'GET' });
  return (await readJson(response)) as unknown as MetaTokenResponse;
}

export async function refreshLongLivedToken(env: Env, token: string): Promise<MetaTokenResponse> {
  const url = new URL('https://graph.instagram.com/refresh_access_token');
  url.searchParams.set('grant_type', 'ig_refresh_token');
  url.searchParams.set('access_token', token);
  const response = await fetch(url, { method: 'GET' });
  return (await readJson(response)) as unknown as MetaTokenResponse;
}

export async function getIgProfile(env: Env, token: string): Promise<{ id: string; username: string }> {
  const url = new URL('https://graph.instagram.com/me');
  url.searchParams.set('fields', 'id,username');
  url.searchParams.set('access_token', token);
  const body = await readJson(await fetch(url));
  if (typeof body.id !== 'string') throw new GraphError('Could not read Instagram account id', 502);
  return { id: body.id, username: typeof body.username === 'string' ? body.username : '' };
}

export async function subscribeWebhook(env: Env, igAccountId: string, token: string): Promise<void> {
  const url = new URL(`${graphBase(env)}/${igAccountId}/subscribed_apps`);
  url.searchParams.set('subscribed_fields', 'messages,messaging_postbacks,comments');
  url.searchParams.set('access_token', token);
  await readJson(await fetch(url, { method: 'POST' }));
}

export async function sendMessage(env: Env, token: string, igAccountId: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const response = await fetch(`${graphBase(env)}/${igAccountId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return readJson(response);
}

export function carouselElements(config: CarouselConfig): Record<string, unknown>[] {
  return config.cards.map((card) => ({
    title: card.title,
    ...(card.subtitle ? { subtitle: card.subtitle } : {}),
    ...(card.image_url ? { image_url: card.image_url } : {}),
    buttons: card.buttons.map((button) =>
      button.type === 'web_url'
        ? { type: 'web_url', title: button.title, url: button.url }
        : { type: 'postback', title: button.title, payload: button.payload },
    ),
  }));
}

export function genericTemplateBody(recipient: Record<string, string>, config: CarouselConfig): Record<string, unknown> {
  return {
    recipient,
    message: {
      attachment: {
        type: 'template',
        payload: { template_type: 'generic', elements: carouselElements(config) },
      },
    },
  };
}
