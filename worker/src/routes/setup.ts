import type { Env } from '../types';
import { json } from '../lib/http';

function configured(value: string | undefined): boolean {
  if (!value) return false;
  return !/^(REPLACE|demo|test|your)/i.test(value);
}

export async function handleSetupStatus(request: Request, env: Env): Promise<Response> {
  let tablesReady = false;
  let connectedAccounts = 0;
  try {
    const table = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'").first();
    tablesReady = Boolean(table);
    if (tablesReady) {
      const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM users WHERE status = 'active'").first<{ n: number }>();
      connectedAccounts = count?.n ?? 0;
    }
  } catch {
    tablesReady = false;
  }

  return json(
    {
      origin: new URL(request.url).origin,
      checks: {
        appId: configured(env.IG_APP_ID),
        appSecret: configured(env.IG_APP_SECRET),
        verifyToken: configured(env.META_VERIFY_TOKEN),
        database: tablesReady,
      },
      connectedAccounts,
    },
    env,
  );
}
