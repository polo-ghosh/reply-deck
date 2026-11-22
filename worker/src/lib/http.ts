import type { Env } from '../types';

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function json(data: unknown, _env: Env, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export function errorResponse(error: unknown, env: Env): Response {
  if (error instanceof HttpError) return json({ error: error.message }, env, error.status);
  if (error instanceof Error && error.name === 'ValidationError') return json({ error: error.message }, env, 400);
  console.error('Unhandled worker error', error);
  return json({ error: 'Internal server error' }, env, 500);
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new HttpError('Invalid JSON body', 400);
  }
}

export async function readFormBody(request: Request): Promise<FormData> {
  try {
    return await request.formData();
  } catch {
    throw new HttpError('Invalid multipart body', 400);
  }
}
