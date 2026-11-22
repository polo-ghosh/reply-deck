import type { Env } from './types';
import { errorResponse, json } from './lib/http';
import {
  handleCallback,
  handleDeauthorize,
  handleDisconnect,
  handleLogin,
  handleMe,
} from './routes/auth';
import {
  handleCreateCarousel,
  handleDeleteCarousel,
  handleGetCarousel,
  handleListCarousels,
  handleToggleCarousel,
  handleUpdateCarousel,
  handleUpload,
} from './routes/api';
import { handleDataDeletion, handleWebhook, handleWebhookVerification } from './routes/webhook';
import { handleSetupStatus } from './routes/setup';
import { handleGetAsset } from './routes/api';
import { runTokenRefresh } from './routes/cron';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/health') return await json({ ok: true, service: 'reply-deck' }, env);
      if (path === '/setup/status' && request.method === 'GET') return await handleSetupStatus(request, env);
      if (path.startsWith('/api/assets/') && request.method === 'GET') return await handleGetAsset(request, env, path);

      if (path === '/auth/login' && request.method === 'GET') return await handleLogin(request, env);
      if (path === '/auth/callback' && request.method === 'GET') return await handleCallback(request, env);
      if (path === '/auth/deauthorize' && request.method === 'POST') return await handleDeauthorize(request, env);
      if (path === '/auth/me' && request.method === 'GET') return await handleMe(request, env);
      if (path === '/auth/disconnect' && request.method === 'POST') return await handleDisconnect(request, env);

      if (path === '/api/carousels' && request.method === 'GET') return await handleListCarousels(request, env);
      if (path === '/api/carousels' && request.method === 'POST') return await handleCreateCarousel(request, env);
      if (path.startsWith('/api/carousels/') && request.method === 'GET') return await handleGetCarousel(request, env, path);
      if (path.startsWith('/api/carousels/') && request.method === 'PUT') return await handleUpdateCarousel(request, env, path);
      if (path.startsWith('/api/carousels/') && request.method === 'PATCH') return await handleToggleCarousel(request, env, path);
      if (path.startsWith('/api/carousels/') && request.method === 'DELETE') return await handleDeleteCarousel(request, env, path);
      if (path === '/api/upload' && request.method === 'POST') return await handleUpload(request, env);

      if (path === '/webhook' && request.method === 'GET') return await handleWebhookVerification(request, env);
      if (path === '/webhook' && request.method === 'POST') return await handleWebhook(request, env);
      if (path === '/privacy/data-deletion' && request.method === 'POST') return await handleDataDeletion(request, env);

      return await json({ error: 'Not found' }, env, 404);
    } catch (error) {
      return errorResponse(error, env);
    }
  },

  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      runTokenRefresh(env)
        .then((summary) => console.log('Token refresh complete', summary))
        .catch((error) => console.error('Token refresh failed', error)),
    );
  },
} satisfies ExportedHandler<Env>;
