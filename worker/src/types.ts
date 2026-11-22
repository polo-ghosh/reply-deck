export interface Env {
  DB: D1Database;
  IMAGES: KVNamespace;
  IG_APP_ID: string;
  IG_APP_SECRET: string;
  SESSION_SECRET?: string;
  TOKEN_ENCRYPTION_KEY?: string;
  META_VERIFY_TOKEN: string;
  IG_API_VERSION: string;
}

export interface UserRow {
  id: number;
  ig_account_id: string;
  username: string;
  access_token_enc: string;
  token_issued_at: number;
  token_expires_at: number;
  scopes: string;
  status: 'active' | 'expired' | 'disconnected';
  created_at: number;
  updated_at: number;
}

export interface CarouselRow {
  id: string;
  user_id: number;
  name: string;
  enabled: number;
  config: string;
  created_at: number;
  updated_at: number;
}

export type TriggerType = 'keyword' | 'comment' | 'postback';
export type MatchMode = 'exact' | 'contains';
export type ButtonType = 'web_url' | 'postback';

export interface CarouselButton {
  type: ButtonType;
  title: string;
  url?: string;
  payload?: string;
}

export interface CarouselCard {
  image_url: string;
  title: string;
  subtitle: string;
  buttons: CarouselButton[];
}

export interface CarouselConfig {
  trigger: {
    type: TriggerType;
    value: string;
    match: MatchMode;
  };
  cards: CarouselCard[];
  fallback_text: string;
}

export interface SessionPayload {
  uid: number;
  iat: number;
  exp: number;
}

export interface MetaTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in: number;
  user_id?: string;
  permissions?: string;
}

export interface WebhookMessagingEvent {
  sender?: { id: string };
  recipient?: { id: string };
  timestamp?: number;
  message?: {
    mid?: string;
    text?: string;
    is_deleted?: boolean;
    attachments?: unknown[];
  };
  postback?: {
    mid?: string;
    payload?: string;
    title?: string;
  };
  optin?: { ref?: string };
}

export interface WebhookChange {
  field: string;
  value: {
    id?: string;
    text?: string;
    from?: { id?: string; username?: string };
    media?: { id?: string; media_product_type?: string };
    timestamp?: number;
    verb?: string;
  };
}

export interface WebhookEntry {
  id: string;
  time?: number;
  messaging?: WebhookMessagingEvent[];
  changes?: WebhookChange[];
}

export interface WebhookPayload {
  object: string;
  entry: WebhookEntry[];
}

export const SCOPES = [
  'instagram_business_basic',
  'instagram_business_manage_messages',
  'instagram_business_manage_comments',
].join(',');

export const DAY_MS = 24 * 60 * 60 * 1000;
export const TOKEN_LIFETIME_MS = 60 * DAY_MS;
export const REFRESH_WINDOW_MS = 45 * DAY_MS;
