import type { Env, UserRow } from '../types';
import { DAY_MS } from '../types';
import { decryptToken } from '../lib/db';
import { logEvent, setUserStatus, updateUserToken } from '../lib/db';
import { GraphError, refreshLongLivedToken } from '../lib/meta';

export async function runTokenRefresh(env: Env): Promise<{ refreshed: number; failed: number; expired: number }> {
  const currentTime = Date.now();
  const result = { refreshed: 0, failed: 0, expired: 0 };

  const deadAccounts = await env.DB.prepare(
    "SELECT * FROM users WHERE status = 'active' AND token_expires_at <= ?",
  )
    .bind(currentTime)
    .all<UserRow>();

  for (const user of deadAccounts.results) {
    await setUserStatus(env, user.id, 'expired');
    await logEvent(env, { userId: user.id, igAccountId: user.ig_account_id, type: 'token_expired' });
    result.expired++;
  }

  const expiring = await env.DB.prepare(
    `SELECT * FROM users
      WHERE status = 'active'
        AND token_expires_at > ?
        AND token_expires_at < ?
        AND token_issued_at < ?`,
  )
    .bind(currentTime, currentTime + 15 * DAY_MS, currentTime - DAY_MS)
    .all<UserRow>();

  for (const user of expiring.results) {
    try {
      const token = await decryptToken(env, user);
      const refreshed = await refreshLongLivedToken(env, token);
      if (!refreshed.access_token) throw new GraphError('Refresh returned no token', 502);
      const issuedAt = Date.now();
      await updateUserToken(
        env,
        user.id,
        refreshed.access_token,
        issuedAt,
        issuedAt + (refreshed.expires_in || 60 * 24 * 60 * 60) * 1000,
      );
      await logEvent(env, { userId: user.id, igAccountId: user.ig_account_id, type: 'token_refreshed' });
      result.refreshed++;
    } catch (error) {
      await logEvent(env, {
        userId: user.id,
        igAccountId: user.ig_account_id,
        type: 'token_refresh_failed',
        detail: error instanceof Error ? error.message : String(error),
      });
      result.failed++;
    }
  }

  return result;
}
