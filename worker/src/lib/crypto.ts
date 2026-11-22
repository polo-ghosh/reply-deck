const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function signData(data: string, secret: string): Promise<string> {
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(data));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function verifyData(data: string, signature: string, secret: string): Promise<boolean> {
  return crypto.subtle.verify('HMAC', await hmacKey(secret), base64UrlToBytes(signature), encoder.encode(data));
}

export async function signJson<T>(value: T, secret: string): Promise<string> {
  const body = bytesToBase64Url(encoder.encode(JSON.stringify(value)));
  return `${body}.${await signData(body, secret)}`;
}

export async function verifyJson<T>(token: string, secret: string): Promise<T | null> {
  const separator = token.indexOf('.');
  if (separator < 1) return null;
  const body = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!signature || !(await verifyData(body, signature, secret))) return null;
  try {
    return JSON.parse(decoder.decode(base64UrlToBytes(body))) as T;
  } catch {
    return null;
  }
}

export async function metaSignatureValid(rawBody: string, header: string | null, appSecret: string): Promise<boolean> {
  if (!header || !header.startsWith('sha256=')) return false;
  const expected = header.slice(7);
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(appSecret), encoder.encode(rawBody));
  const actual = Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return constantTimeEqual(actual, expected.toLowerCase());
}

export async function parseSignedRequest(signedRequest: string, appSecret: string): Promise<Record<string, unknown> | null> {
  const separator = signedRequest.indexOf('.');
  if (separator < 1) return null;
  const encodedSignature = signedRequest.slice(0, separator);
  const encodedPayload = signedRequest.slice(separator + 1);
  if (!(await verifyData(encodedPayload, encodedSignature, appSecret))) return null;
  try {
    return JSON.parse(decoder.decode(base64UrlToBytes(encodedPayload))) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function aesKey(secret: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(secret));
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptString(plain: string, secret: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(secret), encoder.encode(plain));
  return `v1:${bytesToBase64Url(iv)}:${bytesToBase64Url(new Uint8Array(ciphertext))}`;
}

export async function decryptString(payload: string, secret: string): Promise<string> {
  const [version, iv, ciphertext] = payload.split(':');
  if (version !== 'v1' || !iv || !ciphertext) throw new Error('Invalid encrypted token');
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64UrlToBytes(iv) }, await aesKey(secret), base64UrlToBytes(ciphertext));
  return decoder.decode(plain);
}
