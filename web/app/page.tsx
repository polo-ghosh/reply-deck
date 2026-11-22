'use client';

import { useEffect, useState } from 'react';
import ConnectButton from '@/components/ConnectButton';
import Header from '@/components/Header';

export default function Home() {
  const [error, setError] = useState('');

  useEffect(() => {
    const message = new URLSearchParams(window.location.search).get('error');
    if (message) setError(message);
  }, []);

  return (
    <>
      <Header />
      <main className="container">
        {error && <div className="alert alert-error">Could not connect Instagram: {error}</div>}

        <div className="hero-grid">
          <div>
            <div className="eyebrow">For Business &amp; Creator accounts</div>
            <h1>Turn a DM into a conversation that sells.</h1>
            <p className="lede">
              Build swipeable Instagram carousels in a visual editor and send them automatically when someone
              messages you a keyword or comments on a Reel. No code, no monthly platform fee.
            </p>
            <div className="hero-actions">
              <ConnectButton />
              <a className="btn" href="/setup">Setup guide</a>
              <a className="btn" href="https://deploy.workers.cloudflare.com/?url=https://github.com/mayankav/reply-deck" target="_blank" rel="noreferrer">Deploy your own</a>
              <a className="btn btn-ghost" href="#how">How it works</a>
            </div>
            <p className="hint" style={{ marginTop: 18 }}>
              The app is yours. You set it up with your own Instagram account. No one else sees your data.
              Personal accounts do not work. Use a free Business or Creator account.
            </p>
          </div>

          <div className="panel" id="how">
            <h2>Three steps to live</h2>
            <div className="steps">
              <div className="step"><b>1</b><span>Connect your Instagram professional account with the button above.</span></div>
              <div className="step"><b>2</b><span>Upload cover images, add titles and buttons, and pick a trigger keyword.</span></div>
              <div className="step"><b>3</b><span>DM your account the keyword. Your carousel lands in the chat instantly.</span></div>
            </div>
            <div className="alert alert-ok" style={{ marginTop: 20, marginBottom: 0 }}>
              During Phase 1, only accounts added as testers in the Meta app can connect.
            </div>
          </div>
        </div>

        <div className="feature-grid">
          <div className="panel feature"><div className="num">01</div><h3>Visual builder</h3><p>Up to 10 cards, each with an image, title, subtitle, and three buttons. Preview on a phone before saving.</p></div>
          <div className="panel feature"><div className="num">02</div><h3>Keyword &amp; comment triggers</h3><p>Reply to a DM like “MENU” with a carousel, or privately reply to a Reel comment like “INFO”.</p></div>
          <div className="panel feature"><div className="num">03</div><h3>Stays connected</h3><p>The app renews your Instagram login every day. You do not need to connect again.</p></div>
        </div>
      </main>
      <footer className="footer">
        <a href="/privacy">Privacy</a><a href="/terms">Terms</a><span>© {new Date().getFullYear()} Carousel Studio</span>
      </footer>
    </>
  );
}
