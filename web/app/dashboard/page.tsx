'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import ConnectButton from '@/components/ConnectButton';
import Header from '@/components/Header';
import { clearSession, deleteCarousel, getAccount, getSession, listCarousels, toggleCarousel } from '@/lib/api';
import type { Account, Carousel } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [carousels, setCarousels] = useState<Carousel[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!getSession()) {
      setLoading(false);
      return;
    }
    try {
      const [accountResult, carouselResult] = await Promise.all([getAccount(), listCarousels()]);
      setAccount(accountResult.account);
      setCarousels(carouselResult.carousels);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load your account');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function onToggle(carousel: Carousel) {
    try {
      await toggleCarousel(carousel.id, !carousel.enabled);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update carousel');
    }
  }

  async function onDelete(carousel: Carousel) {
    if (!window.confirm(`Delete “${carousel.name}”?`)) return;
    try {
      await deleteCarousel(carousel.id);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not delete carousel');
    }
  }

  function signOut() {
    clearSession();
    router.push('/');
  }

  if (!loading && !account) {
    return (
      <>
        <Header />
        <main className="container narrow">
          <h1>Connect your Instagram account</h1>
          <p>You need to link a Business or Creator account before you can build carousels.</p>
          <div className="hero-actions">
            <ConnectButton />
            <button className="btn btn-ghost" onClick={signOut}>Back home</button>
          </div>
          {message && <div className="alert alert-error" style={{ marginTop: 20 }}>{message}</div>}
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container">
        <div className="list-item" style={{ alignItems: 'flex-end', marginBottom: 28 }}>
          <div>
            <div className="eyebrow">Dashboard</div>
            <h1 style={{ fontSize: 34, marginBottom: 6 }}>{account ? `@${account.username || account.id}` : 'Loading…'}</h1>
            <p className="meta" style={{ margin: 0 }}>
              {account ? `Connected · token valid until ${new Date(account.tokenExpiresAt).toLocaleDateString()}` : 'Fetching account…'}
            </p>
          </div>
          <Link className="btn btn-primary" href="/builder">+ New carousel</Link>
        </div>

        {message && <div className="alert alert-error">{message}</div>}

        <div className="panel">
          <h2>Your carousels</h2>
          {loading ? (
            <p>Loading…</p>
          ) : carousels.length === 0 ? (
            <div>
              <p>Nothing here yet. Create your first carousel to get started.</p>
              <Link className="btn btn-primary" href="/builder">Create a carousel</Link>
            </div>
          ) : (
            <div className="list">
              {carousels.map((carousel) => (
                <div className="list-item" key={carousel.id}>
                  <div>
                    <div className="btn-row" style={{ gap: 8 }}>
                      <strong>{carousel.name}</strong>
                      <span className={`badge ${carousel.enabled ? '' : 'off'}`}>{carousel.enabled ? 'Active' : 'Paused'}</span>
                      <span className="badge">{carousel.config.trigger.type}: {carousel.config.trigger.value}</span>
                    </div>
                    <div className="meta">
                      {carousel.config.cards.length} card{carousel.config.cards.length === 1 ? '' : 's'} · updated {new Date(carousel.updatedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="btn-row">
                    <button className="btn btn-sm" onClick={() => onToggle(carousel)}>
                      {carousel.enabled ? 'Pause' : 'Activate'}
                    </button>
                    <Link className="btn btn-sm" href={`/builder?id=${encodeURIComponent(carousel.id)}`}>Edit</Link>
                    <button className="btn btn-sm btn-danger" onClick={() => onDelete(carousel)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <h2>Test it</h2>
          <p style={{ margin: 0 }}>
            Send your account a DM with a trigger keyword, or comment it on a Reel. The matching carousel is
            delivered as a swipeable message. Only replies inside Instagram&apos;s messaging window are sent.
          </p>
        </div>
      </main>
    </>
  );
}
