import type { Env } from '../types';

export function sessionSecret(env: Env): string {
  return env.SESSION_SECRET || `${env.IG_APP_SECRET}:reply-deck:session`;
}

export function tokenEncryptionKey(env: Env): string {
  return env.TOKEN_ENCRYPTION_KEY || `${env.IG_APP_SECRET}:reply-deck:token`;
}
