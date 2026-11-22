import type { CarouselButton, CarouselCard, CarouselConfig } from '../types';

export class ValidationError extends Error {}

function text(value: unknown, field: string, max: number, required = true): string {
  if (value === undefined || value === null || value === '') {
    if (required) throw new ValidationError(`${field} is required`);
    return '';
  }
  if (typeof value !== 'string') throw new ValidationError(`${field} must be a string`);
  const trimmed = value.trim();
  if (required && !trimmed) throw new ValidationError(`${field} is required`);
  if (trimmed.length > max) throw new ValidationError(`${field} must be ${max} characters or fewer`);
  return trimmed;
}

function httpsUrl(value: unknown, field: string): string {
  const raw = text(value, field, 2000);
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new ValidationError(`${field} must be a valid URL`);
  }
  if (parsed.protocol !== 'https:') throw new ValidationError(`${field} must use https`);
  return parsed.toString();
}

function parseButton(value: unknown, index: number): CarouselButton {
  if (!value || typeof value !== 'object') throw new ValidationError(`Button ${index + 1} is invalid`);
  const input = value as Record<string, unknown>;
  const title = text(input.title, `Button ${index + 1} title`, 20);
  if (input.type === 'web_url') {
    return { type: 'web_url', title, url: httpsUrl(input.url, `Button ${index + 1} URL`) };
  }
  if (input.type === 'postback') {
    return { type: 'postback', title, payload: text(input.payload, `Button ${index + 1} payload`, 250) };
  }
  throw new ValidationError(`Button ${index + 1} type must be web_url or postback`);
}

function parseCard(value: unknown, index: number): CarouselCard {
  if (!value || typeof value !== 'object') throw new ValidationError(`Card ${index + 1} is invalid`);
  const input = value as Record<string, unknown>;
  const buttons = input.buttons ?? [];
  if (!Array.isArray(buttons)) throw new ValidationError(`Card ${index + 1} buttons must be an array`);
  if (buttons.length > 3) throw new ValidationError(`Card ${index + 1} supports at most 3 buttons`);
  return {
    image_url: httpsUrl(input.image_url, `Card ${index + 1} image URL`),
    title: text(input.title, `Card ${index + 1} title`, 80),
    subtitle: text(input.subtitle, `Card ${index + 1} subtitle`, 80, false),
    buttons: buttons.map(parseButton),
  };
}

export function validateCarousel(input: unknown): { name: string; config: CarouselConfig } {
  if (!input || typeof input !== 'object') throw new ValidationError('Request body must be an object');
  const body = input as Record<string, unknown>;
  const name = text(body.name, 'Name', 80);

  const triggerValue = body.trigger;
  if (!triggerValue || typeof triggerValue !== 'object') throw new ValidationError('Trigger is required');
  const trigger = triggerValue as Record<string, unknown>;
  if (!['keyword', 'comment', 'postback'].includes(String(trigger.type))) {
    throw new ValidationError('Trigger type must be keyword, comment, or postback');
  }
  const match = trigger.match === 'contains' ? 'contains' : 'exact';
  const value = text(trigger.value, 'Trigger value', 100);

  if (!Array.isArray(body.cards) || body.cards.length < 1 || body.cards.length > 10) {
    throw new ValidationError('A carousel needs between 1 and 10 cards');
  }

  return {
    name,
    config: {
      trigger: { type: trigger.type as CarouselConfig['trigger']['type'], value, match },
      cards: body.cards.map(parseCard),
      fallback_text: text(body.fallback_text, 'Fallback text', 1000, false),
    },
  };
}
