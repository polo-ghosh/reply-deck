import type { CarouselConfig, CarouselRow, Env } from '../types';
import { requireUser } from '../lib/auth';
import {
  createCarousel,
  deleteCarousel,
  getCarousel,
  listCarousels,
  parseCarouselConfig,
  setCarouselEnabled,
  updateCarousel,
} from '../lib/db';
import { HttpError, json, readFormBody, readJsonBody } from '../lib/http';
import { validateCarousel } from '../lib/validate';

function serialize(row: CarouselRow) {
  return {
    id: row.id,
    name: row.name,
    enabled: Boolean(row.enabled),
    config: parseCarouselConfig(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function carouselId(pathname: string): string {
  const match = pathname.match(/^\/api\/carousels\/([^/]+)$/);
  if (!match?.[1]) throw new HttpError('Carousel not found', 404);
  return decodeURIComponent(match[1]);
}

export async function handleListCarousels(request: Request, env: Env): Promise<Response> {
  const { user } = await requireUser(request, env);
  const rows = await listCarousels(env, user.id);
  return json({ carousels: rows.map(serialize) }, env);
}

export async function handleCreateCarousel(request: Request, env: Env): Promise<Response> {
  const { user } = await requireUser(request, env);
  const { name, config } = validateCarousel(await readJsonBody(request));
  const row = await createCarousel(env, user.id, name, config);
  return json({ carousel: serialize(row) }, env, 201);
}

export async function handleUpdateCarousel(request: Request, env: Env, pathname: string): Promise<Response> {
  const { user } = await requireUser(request, env);
  const { name, config } = validateCarousel(await readJsonBody(request));
  const row = await updateCarousel(env, user.id, carouselId(pathname), name, config);
  if (!row) throw new HttpError('Carousel not found', 404);
  return json({ carousel: serialize(row) }, env);
}

export async function handleDeleteCarousel(request: Request, env: Env, pathname: string): Promise<Response> {
  const { user } = await requireUser(request, env);
  await deleteCarousel(env, user.id, carouselId(pathname));
  return json({ ok: true }, env);
}

export async function handleToggleCarousel(request: Request, env: Env, pathname: string): Promise<Response> {
  const { user } = await requireUser(request, env);
  const body = (await readJsonBody(request)) as { enabled?: unknown };
  if (typeof body.enabled !== 'boolean') throw new HttpError('enabled must be a boolean', 400);
  const id = carouselId(pathname);
  const existing = await getCarousel(env, user.id, id);
  if (!existing) throw new HttpError('Carousel not found', 404);
  await setCarouselEnabled(env, user.id, id, body.enabled);
  return json({ ok: true }, env);
}

const ALLOWED_IMAGES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export async function handleUpload(request: Request, env: Env): Promise<Response> {
  const { user } = await requireUser(request, env);
  const form = await readFormBody(request);
  const file = form.get('file');
  if (!file || typeof file === 'string') throw new HttpError('A file field is required', 400);

  const type = (file as File).type;
  const extension = ALLOWED_IMAGES[type];
  if (!extension) throw new HttpError('Only JPEG, PNG, and WebP images are supported', 415);
  if ((file as File).size > MAX_UPLOAD_BYTES) throw new HttpError('Images must be 8 MB or smaller', 413);

  const key = `${user.ig_account_id}/${crypto.randomUUID()}.${extension}`;
  await env.IMAGES.put(key, await (file as File).arrayBuffer(), {
    metadata: { contentType: type },
  });

  const url = `${new URL(request.url).origin}/api/assets/${key}`;
  return json({ url }, env, 201);
}

export async function handleGetCarousel(request: Request, env: Env, pathname: string): Promise<Response> {
  const { user } = await requireUser(request, env);
  const row = await getCarousel(env, user.id, carouselId(pathname));
  if (!row) throw new HttpError('Carousel not found', 404);
  return json({ carousel: serialize(row) }, env);
}

export async function handleGetAsset(request: Request, env: Env, pathname: string): Promise<Response> {
  const key = decodeURIComponent(pathname.slice('/api/assets/'.length));
  if (!key || key.includes('..')) throw new HttpError('Asset not found', 404);
  const stored = await env.IMAGES.getWithMetadata<{ contentType?: string }>(key, 'arrayBuffer');
  if (!stored.value) throw new HttpError('Asset not found', 404);
  return new Response(stored.value, {
    headers: {
      'Content-Type': stored.metadata?.contentType ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

export function isCarouselConfig(value: unknown): value is CarouselConfig {
  return Boolean(value && typeof value === 'object' && 'cards' in value);
}
