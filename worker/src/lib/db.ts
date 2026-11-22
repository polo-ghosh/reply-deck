import type { CarouselConfig, CarouselRow, Env, UserRow } from '../types';
import { decryptString, encryptString } from './crypto';
import { tokenEncryptionKey } from './keys';

export function now(): number {
  return Date.now();
}

export async function getUserByIgId(env: Env, igAccountId: string): Promise<UserRow | null> {
  return env.DB.prepare('SELECT * FROM users WHERE ig_account_id = ?').bind(igAccountId).first<UserRow>();
}

export async function getUserById(env: Env, id: number): Promise<UserRow | null> {
  return env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>();
}

export async function upsertUser(
  env: Env,
  input: { igAccountId: string; username: string; token: string; issuedAt: number; expiresAt: number; scopes: string },
): Promise<UserRow> {
  const timestamp = now();
  const encrypted = await encryptString(input.token, tokenEncryptionKey(env));
  const existing = await getUserByIgId(env, input.igAccountId);

  if (existing) {
    await env.DB.prepare(
      `UPDATE users
         SET username = ?, access_token_enc = ?, token_issued_at = ?, token_expires_at = ?,
             scopes = ?, status = 'active', updated_at = ?
       WHERE id = ?`,
    )
      .bind(input.username, encrypted, input.issuedAt, input.expiresAt, input.scopes, timestamp, existing.id)
      .run();
  } else {
    await env.DB.prepare(
      `INSERT INTO users
         (ig_account_id, username, access_token_enc, token_issued_at, token_expires_at, scopes, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
    )
      .bind(input.igAccountId, input.username, encrypted, input.issuedAt, input.expiresAt, input.scopes, timestamp, timestamp)
      .run();
  }

  const user = await getUserByIgId(env, input.igAccountId);
  if (!user) throw new Error('Failed to persist user');
  return user;
}

export async function updateUserToken(
  env: Env,
  userId: number,
  token: string,
  issuedAt: number,
  expiresAt: number,
): Promise<void> {
  const encrypted = await encryptString(token, tokenEncryptionKey(env));
  await env.DB.prepare(
    `UPDATE users SET access_token_enc = ?, token_issued_at = ?, token_expires_at = ?,
       status = 'active', updated_at = ? WHERE id = ?`,
  )
    .bind(encrypted, issuedAt, expiresAt, now(), userId)
    .run();
}

export async function setUserStatus(env: Env, userId: number, status: UserRow['status']): Promise<void> {
  await env.DB.prepare('UPDATE users SET status = ?, updated_at = ? WHERE id = ?').bind(status, now(), userId).run();
}

export async function decryptToken(env: Env, user: UserRow): Promise<string> {
  return decryptString(user.access_token_enc, tokenEncryptionKey(env));
}

export async function listCarousels(env: Env, userId: number): Promise<CarouselRow[]> {
  const result = await env.DB.prepare('SELECT * FROM carousels WHERE user_id = ? ORDER BY updated_at DESC')
    .bind(userId)
    .all<CarouselRow>();
  return result.results;
}

export async function getCarousel(env: Env, userId: number, id: string): Promise<CarouselRow | null> {
  return env.DB.prepare('SELECT * FROM carousels WHERE id = ? AND user_id = ?').bind(id, userId).first<CarouselRow>();
}

export function parseCarouselConfig(row: CarouselRow): CarouselConfig {
  return JSON.parse(row.config) as CarouselConfig;
}

export async function createCarousel(env: Env, userId: number, name: string, config: CarouselConfig): Promise<CarouselRow> {
  const id = crypto.randomUUID();
  const timestamp = now();
  await env.DB.prepare(
    `INSERT INTO carousels (id, user_id, name, enabled, config, created_at, updated_at)
     VALUES (?, ?, ?, 1, ?, ?, ?)`,
  )
    .bind(id, userId, name, JSON.stringify(config), timestamp, timestamp)
    .run();
  const row = await getCarousel(env, userId, id);
  if (!row) throw new Error('Failed to persist carousel');
  return row;
}

export async function updateCarousel(env: Env, userId: number, id: string, name: string, config: CarouselConfig): Promise<CarouselRow | null> {
  await env.DB.prepare('UPDATE carousels SET name = ?, config = ?, updated_at = ? WHERE id = ? AND user_id = ?')
    .bind(name, JSON.stringify(config), now(), id, userId)
    .run();
  return getCarousel(env, userId, id);
}

export async function deleteCarousel(env: Env, userId: number, id: string): Promise<void> {
  await env.DB.prepare('DELETE FROM carousels WHERE id = ? AND user_id = ?').bind(id, userId).run();
}

export async function setCarouselEnabled(env: Env, userId: number, id: string, enabled: boolean): Promise<void> {
  await env.DB.prepare('UPDATE carousels SET enabled = ?, updated_at = ? WHERE id = ? AND user_id = ?')
    .bind(enabled ? 1 : 0, now(), id, userId)
    .run();
}

export async function listEnabledCarousels(env: Env, userId: number): Promise<CarouselRow[]> {
  const result = await env.DB.prepare('SELECT * FROM carousels WHERE user_id = ? AND enabled = 1 ORDER BY created_at ASC')
    .bind(userId)
    .all<CarouselRow>();
  return result.results;
}

export async function logEvent(
  env: Env,
  input: { userId?: number | null; igAccountId?: string | null; type: string; detail?: string },
): Promise<void> {
  await env.DB.prepare(
    'INSERT INTO events (user_id, ig_account_id, type, detail, created_at) VALUES (?, ?, ?, ?, ?)',
  )
    .bind(input.userId ?? null, input.igAccountId ?? null, input.type, input.detail ?? null, now())
    .run();
}

export async function claimEvent(env: Env, id: string): Promise<boolean> {
  const result = await env.DB.prepare('INSERT OR IGNORE INTO processed_events (id, created_at) VALUES (?, ?)')
    .bind(id, now())
    .run();
  return (result.meta?.changes ?? 0) > 0;
}

export async function setConversationState(env: Env, userId: number, senderIgsid: string, carouselId: string): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO conversation_state (user_id, sender_igsid, carousel_id, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, sender_igsid) DO UPDATE SET carousel_id = excluded.carousel_id, updated_at = excluded.updated_at`,
  )
    .bind(userId, senderIgsid, carouselId, now())
    .run();
}

export async function clearConversationState(env: Env, userId: number, senderIgsid: string): Promise<void> {
  await env.DB.prepare('DELETE FROM conversation_state WHERE user_id = ? AND sender_igsid = ?')
    .bind(userId, senderIgsid)
    .run();
}

export async function purgeUserData(env: Env, igAccountId: string): Promise<boolean> {
  const user = await getUserByIgId(env, igAccountId);
  if (!user) return false;
  await env.DB.prepare('DELETE FROM carousels WHERE user_id = ?').bind(user.id).run();
  await env.DB.prepare('DELETE FROM conversation_state WHERE user_id = ?').bind(user.id).run();
  await env.DB.prepare('UPDATE users SET status = ?, updated_at = ? WHERE id = ?')
    .bind('disconnected', now(), user.id)
    .run();
  await env.DB.prepare('UPDATE users SET access_token_enc = ? WHERE id = ?').bind('', user.id).run();
  await logEvent(env, { userId: user.id, igAccountId, type: 'user_data_purged' });
  return true;
}
