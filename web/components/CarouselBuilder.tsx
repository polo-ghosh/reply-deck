'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { createCarousel, getCarousel, getSession, updateCarousel, uploadImage } from '@/lib/api';
import type { CarouselButton, CarouselCard, CarouselConfig, TriggerType } from '@/lib/types';

function emptyButton(): CarouselButton {
  return { type: 'web_url', title: '', url: '' };
}

function emptyCard(): CarouselCard {
  return { image_url: '', title: '', subtitle: '', buttons: [] };
}

function emptyConfig(): CarouselConfig {
  return {
    trigger: { type: 'keyword', value: '', match: 'exact' },
    cards: [emptyCard()],
    fallback_text: '',
  };
}

export default function CarouselBuilder() {
  const [id, setId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [config, setConfig] = useState<CarouselConfig>(emptyConfig());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const existingId = new URLSearchParams(window.location.search).get('id');
    if (!existingId) {
      setLoading(false);
      return;
    }
    if (!getSession()) {
      setError('Your session has expired. Please reconnect your Instagram account.');
      setLoading(false);
      return;
    }
    setId(existingId);
    getCarousel(existingId)
      .then(({ carousel }) => {
        setName(carousel.name);
        setConfig(carousel.config);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Could not load carousel'))
      .finally(() => setLoading(false));
  }, []);

  function setTrigger(patch: Partial<CarouselConfig['trigger']>) {
    setConfig((current) => ({ ...current, trigger: { ...current.trigger, ...patch } }));
  }

  function setCard(index: number, patch: Partial<CarouselCard>) {
    setConfig((current) => ({
      ...current,
      cards: current.cards.map((card, i) => (i === index ? { ...card, ...patch } : card)),
    }));
  }

  function setButton(cardIndex: number, buttonIndex: number, patch: Partial<CarouselButton>) {
    setConfig((current) => ({
      ...current,
      cards: current.cards.map((card, i) =>
        i === cardIndex
          ? { ...card, buttons: card.buttons.map((button, j) => (j === buttonIndex ? { ...button, ...patch } : button)) }
          : card,
      ),
    }));
  }

  async function onUpload(index: number, file: File | undefined) {
    if (!file) return;
    setUploading(index);
    setError('');
    try {
      const { url } = await uploadImage(file);
      setCard(index, { image_url: url });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Upload failed');
    } finally {
      setUploading(null);
    }
  }

  async function save() {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const result = id
        ? await updateCarousel(id, name, config)
        : await createCarousel(name, config);
      setId(result.carousel.id);
      setSaved(true);
      if (!id) window.history.replaceState(null, '', `/builder?id=${encodeURIComponent(result.carousel.id)}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save carousel');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Header />
      <main className="container">
        <div className="list-item" style={{ alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <div className="eyebrow">{id ? 'Edit carousel' : 'New carousel'}</div>
            <h1 style={{ fontSize: 34, marginBottom: 0 }}>Carousel builder</h1>
          </div>
          <Link className="btn btn-ghost" href="/dashboard">← Back to dashboard</Link>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {saved && <div className="alert alert-ok">Saved. It is live as soon as the trigger fires.</div>}
        {loading ? <p>Loading…</p> : (
          <div className="builder-grid">
            <div>
              <div className="panel sticky-save" style={{ top: 12 }}>
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="name">Name (only you see this)</label>
                    <input id="name" value={name} maxLength={80} onChange={(event) => setName(event.target.value)} placeholder="Welcome carousel" />
                  </div>

                  <div className="field">
                    <label>Trigger</label>
                    <div className="field-row">
                      <select
                        aria-label="Trigger type"
                        value={config.trigger.type}
                        onChange={(event) => setTrigger({ type: event.target.value as TriggerType })}
                      >
                        <option value="keyword">DM keyword</option>
                        <option value="comment">Reel/post comment</option>
                        <option value="postback">Button postback</option>
                      </select>
                      <input
                        aria-label="Trigger value"
                        value={config.trigger.value}
                        maxLength={100}
                        placeholder={config.trigger.type === 'comment' ? 'INFO' : config.trigger.type === 'postback' ? 'SHOW_MORE' : 'MENU'}
                        onChange={(event) => setTrigger({ value: event.target.value })}
                      />
                    </div>
                    <div className="field-row" style={{ marginTop: 10 }}>
                      <select
                        aria-label="Match mode"
                        value={config.trigger.match}
                        onChange={(event) => setTrigger({ match: event.target.value as CarouselConfig['trigger']['match'] })}
                      >
                        <option value="exact">Exact match</option>
                        <option value="contains">Contains keyword</option>
                      </select>
                      <input
                        aria-label="Fallback text"
                        value={config.fallback_text}
                        maxLength={1000}
                        placeholder="Fallback text (optional)"
                        onChange={(event) => setConfig((current) => ({ ...current, fallback_text: event.target.value }))}
                      />
                    </div>
                    <div className="hint">
                      Keywords are case-insensitive. Comment triggers use a one-time private reply, so the first card
                      should invite a reply to continue the conversation.
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 20 }}>
                <div className="list-item" style={{ marginBottom: 12 }}>
                  <h2 style={{ margin: 0 }}>Cards ({config.cards.length}/10)</h2>
                  <button
                    className="btn btn-sm"
                    disabled={config.cards.length >= 10}
                    onClick={() => setConfig((current) => ({ ...current, cards: [...current.cards, emptyCard()] }))}
                  >
                    + Add card
                  </button>
                </div>

                {config.cards.map((card, index) => (
                  <div className="card-editor" key={index}>
                    <div className="card-head">
                      <strong>Card {index + 1}</strong>
                      <button
                        className="btn btn-sm btn-danger"
                        disabled={config.cards.length === 1}
                        onClick={() => setConfig((current) => ({ ...current, cards: current.cards.filter((_, i) => i !== index) }))}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="form-grid">
                      <div className="field">
                        <span className="label">Cover image</span>
                        <label className="upload">
                          {uploading === index ? (
                            <span>Uploading…</span>
                          ) : card.image_url ? (
                            <img src={card.image_url} alt={`Card ${index + 1} cover`} />
                          ) : (
                            <span>+ Choose a JPG, PNG or WebP (max 8 MB)</span>
                          )}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            hidden
                            onChange={(event) => void onUpload(index, event.target.files?.[0])}
                          />
                        </label>
                      </div>

                      <div className="field">
                        <label htmlFor={`title-${index}`}>Title</label>
                        <input
                          id={`title-${index}`}
                          value={card.title}
                          maxLength={80}
                          placeholder="Our most popular dishes"
                          onChange={(event) => setCard(index, { title: event.target.value })}
                        />
                        <div className="counter">{card.title.length}/80</div>
                      </div>

                      <div className="field">
                        <label htmlFor={`subtitle-${index}`}>Subtitle</label>
                        <input
                          id={`subtitle-${index}`}
                          value={card.subtitle}
                          maxLength={80}
                          placeholder="Tap below to explore"
                          onChange={(event) => setCard(index, { subtitle: event.target.value })}
                        />
                        <div className="counter">{card.subtitle.length}/80</div>
                      </div>

                      <div className="field">
                        <div className="list-item">
                          <span className="label">Buttons ({card.buttons.length}/3)</span>
                          <button
                            className="btn btn-sm"
                            disabled={card.buttons.length >= 3}
                            onClick={() => setCard(index, { buttons: [...card.buttons, emptyButton()] })}
                          >
                            + Add button
                          </button>
                        </div>
                        {card.buttons.map((button, buttonIndex) => (
                          <div className="button-editor" key={buttonIndex}>
                            <div className="field-row">
                              <select
                                aria-label={`Button ${buttonIndex + 1} type`}
                                value={button.type}
                                onChange={(event) => {
                                  const type = event.target.value as CarouselButton['type'];
                                  setButton(index, buttonIndex, type === 'web_url'
                                    ? { type, url: '', payload: undefined }
                                    : { type, payload: '', url: undefined });
                                }}
                              >
                                <option value="web_url">Open website</option>
                                <option value="postback">Send postback</option>
                              </select>
                              <input
                                aria-label={`Button ${buttonIndex + 1} title`}
                                value={button.title}
                                maxLength={20}
                                placeholder="Button label"
                                onChange={(event) => setButton(index, buttonIndex, { title: event.target.value })}
                              />
                            </div>
                            <div className="field-row" style={{ marginTop: 8 }}>
                              <input
                                aria-label={`Button ${buttonIndex + 1} value`}
                                value={button.type === 'web_url' ? button.url ?? '' : button.payload ?? ''}
                                placeholder={button.type === 'web_url' ? 'https://example.com' : 'SHOW_MORE'}
                                onChange={(event) => setButton(
                                  index,
                                  buttonIndex,
                                  button.type === 'web_url' ? { url: event.target.value } : { payload: event.target.value },
                                )}
                              />
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => setCard(index, { buttons: card.buttons.filter((_, i) => i !== buttonIndex) })}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <aside>
              <div className="sticky-save">
                <h3>Preview</h3>
                <div className="phone">
                  <div className="phone-screen">
                    {config.cards.map((card, index) => (
                      <div className="phone-card" key={index}>
                        {card.image_url && <img src={card.image_url} alt="" />}
                        <div className="body">
                          <div className="title">{card.title || 'Card title'}</div>
                          {card.subtitle && <div className="subtitle">{card.subtitle}</div>}
                          {card.buttons.map((button, buttonIndex) => (
                            <div className="pb" key={buttonIndex}>{button.title || 'Button'}</div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} disabled={saving} onClick={() => void save()}>
                  {saving ? 'Saving…' : id ? 'Save changes' : 'Create carousel'}
                </button>
              </div>
            </aside>
          </div>
        )}
      </main>
    </>
  );
}
