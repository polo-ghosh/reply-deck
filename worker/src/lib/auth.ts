import type { Env, SessionPayload, UserRow } from '../types';
import { DAY_MS } from '../types';
import { signJson, verifyJson } from './crypto';
import { getUserById } from './db';
import { sessionSecret } from './keys';
import { HttpError } from './http';

export const SESSION_TTL_MS = 30 * DAY_MS;

export async function createSession(env: Env, user: UserRow): Promise<string> {
  const issuedAt = Date.now();
  const payload: SessionPayload = { uid: user.id, iat: issuedAt, exp: issuedAt + SESSION_TTL_MS };
  return signJson(payload, sessionSecret(env));
}

export async function requireUser(request: Request, env: Env): Promise<{ user: UserRow }> {
  const header = request.headers.get('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) throw new HttpError('Not authenticated', 401);

  const payload = await verifyJson<SessionPayload>(token, sessionSecret(env));
  if (!payload || typeof payload.uid !== 'number' || typeof payload.exp !== 'number' || payload.exp < Date.now()) {
    throw new HttpError('Session expired or invalid', 401);
  }

  const user = await getUserById(env, payload.uid);
  if (!user || user.status !== 'active') throw new HttpError('Account is not connected', 401);
  return { user };
}
