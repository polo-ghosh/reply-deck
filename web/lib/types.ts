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
  trigger: { type: TriggerType; value: string; match: MatchMode };
  cards: CarouselCard[];
  fallback_text: string;
}

export interface Carousel {
  id: string;
  name: string;
  enabled: boolean;
  config: CarouselConfig;
  createdAt: number;
  updatedAt: number;
}

export interface Account {
  id: string;
  username: string;
  status: string;
  tokenExpiresAt: number;
  connectedAt: number;
}
