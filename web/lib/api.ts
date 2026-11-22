import type { Account, Carousel, CarouselConfig } from './types';

const SESSION_KEY = 'mc_session';

export function getSession(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(SESSION_KEY);
}

export function setSession(token: string): void {
  window.localStorage.setItem(SESSION_KEY, token);
}

export function clearSession(): void {
  window.localStorage.removeItem(SESSION_KEY);
}

export function connectInstagramUrl(): string {
  return '/auth/login';
}

export function disconnectUrl(): string {
  return '/auth/disconnect';
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getSession();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  const response = await fetch(path, { ...init, headers });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    if (response.status === 401) clearSession();
    throw new Error(data.error ?? `Request failed (${response.status})`);
  }
  return data;
}

export function getAccount(): Promise<{ account: Account }> {
  return request('/auth/me');
}

export function listCarousels(): Promise<{ carousels: Carousel[] }> {
  return request('/api/carousels');
}

export function getCarousel(id: string): Promise<{ carousel: Carousel }> {
  return request(`/api/carousels/${encodeURIComponent(id)}`);
}

export function createCarousel(name: string, config: CarouselConfig): Promise<{ carousel: Carousel }> {
  return request('/api/carousels', { method: 'POST', body: JSON.stringify({ name, config }) });
}

export function updateCarousel(id: string, name: string, config: CarouselConfig): Promise<{ carousel: Carousel }> {
  return request(`/api/carousels/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ name, config }) });
}

export function deleteCarousel(id: string): Promise<{ ok: boolean }> {
  return request(`/api/carousels/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function toggleCarousel(id: string, enabled: boolean): Promise<{ ok: boolean }> {
  return request(`/api/carousels/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ enabled }) });
}

export function uploadImage(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.set('file', file);
  return request('/api/upload', { method: 'POST', body: form });
}
