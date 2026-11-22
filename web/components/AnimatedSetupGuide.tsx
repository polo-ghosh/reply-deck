'use client';

import { useEffect, useState } from 'react';
import ConnectButton from '@/components/ConnectButton';
import Header from '@/components/Header';

type CheckKey = 'appId' | 'appSecret' | 'verifyToken' | 'database';

interface StatusResponse {
  origin: string;
  checks: Record<CheckKey, boolean>;
  connectedAccounts: number;
}

const STORAGE_KEY = 'reply-deck-setup-page';

const CHECKS: { key: CheckKey; label: string }[] = [
  { key: 'appId', label: 'App number' },
  { key: 'appSecret', label: 'App secret' },
  { key: 'verifyToken', label: 'Phrase' },
  { key: 'database', label: 'Storage' },
];

const ICONS: Record<string, string> = {
  phone: 'M16 6h16v36H16z M20 10h8 M20 38h8',
  meta: 'M14 26c0-8 5-14 12-14s12 6 12 14-5 14-12 14-12-6-12-14z M20 26a6 6 0 1 0 12 0 6 6 0 1 0-12 0z M8 12v24 M40 12v24',
  key: 'M20 28a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M26 22l12 12 M34 30l4-4 M38 34l4-4',
  cloud: 'M12 32a8 8 0 0 1 8-8 10 10 0 0 1 19 3 7 7 0 0 1-2 14H20a8 8 0 0 1-8-9z M24 28v10 M20 32l4-4 4 4',
  chat: 'M10 12h28v22H24l-8 8v-8h-6z M16 20h16 M16 26h12',
  link: 'M20 28l8-8 M16 22l-4 4a7 7 0 0 0 10 10l4-4 M32 26l4-4a7 7 0 0 0-10-10l-4 4',
  user: 'M24 24a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M10 42c0-8 6-12 14-12s14 4 14 12 M34 14h10 M39 9v10',
  bolt: 'M26 6L14 26h9l-3 16 14-22h-9z',
};

function Icon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[name] ?? ICONS.bolt} />
    </svg>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="wiz-copy">
      <div>
        <div className="wiz-copy-label">{label}</div>
        <code>{value}</code>
      </div>
      <button
        className="wiz-copy-btn"
        onClick={() => {
          void navigator.clipboard.writeText(value).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
          });
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

interface StepDef {
  title: string;
  icon: string;
  skip?: string;
  body: React.ReactNode;
  check: string;
}

export default function AnimatedSetupGuide() {
  const [origin, setOrigin] = useState('https://your-app.example.workers.dev');
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState<'next' | 'back'>('next');

  async function refresh() {
    try {
      const response = await fetch('/setup/status');
      const data = (await response.json()) as StatusResponse;
      setStatus(data);
      setOrigin(data.origin || origin);
      if (window.localStorage.getItem(STORAGE_KEY) === null) {
        const allSet = Object.values(data.checks).every(Boolean);
        setPage(allSet ? 4 : 0);
      }
    } catch {
      setStatus(null);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const callbackUrl = `${origin}/auth/callback`;
  const messageUrl = `${origin}/webhook`;
  const leaveUrl = `${origin}/auth/deauthorize`;
  const deleteUrl = `${origin}/privacy/data-deletion`;
  const privacyUrl = `${origin}/privacy`;
  const termsUrl = `${origin}/terms`;

  const pages: { title: string; intro: string; steps: StepDef[] }[] = [
    {
      title: 'Prepare Instagram',
      intro: 'One short task. Then you can stop thinking about account settings.',
      steps: [{
        title: 'Make Instagram for business',
        icon: 'phone',
        skip: 'Skip if your profile already shows Business or Creator.',
        body: (
          <>
            <p>1. On your phone, open Instagram.</p>
            <p>2. Go to Settings → Account → Switch to professional account.</p>
            <p>3. Select Business or Creator.</p>
            <p>4. Make the account public.</p>
            <p><a href="https://business.instagram.com/getting-started" target="_blank" rel="noreferrer">Instagram help ↗</a></p>
          </>
        ),
        check: 'Your profile shows a category, for example Business or Creator.',
      }],
    },
    {
      title: 'Get two numbers from Meta',
      intro: 'Meta needs an app. It gives you two values. You paste them later.',
      steps: [{
        title: 'Create a Meta app, or use one you have',
        icon: 'meta',
        body: (
          <>
            <p><strong>No Meta app yet?</strong> Open <a href="https://developers.facebook.com/apps/" target="_blank" rel="noreferrer">Meta apps ↗</a>. Select Create app → Other → Business. Type a name and email. Select Create app. Find Instagram. Select Set up. Select the Instagram login setup.</p>
            <p><strong>Already have one?</strong> Open Meta apps. Select your app. Find Instagram → API setup with Instagram login → Business login settings.</p>
            <p className="wiz-callout">Both paths end here: find App ID and App Secret on the page.</p>
          </>
        ),
        check: 'You can see both values on your screen.',
      }],
    },
    {
      title: 'Save the two numbers',
      intro: 'Copy them now. You need them on the next page.',
      steps: [{
        title: 'Copy App ID and App Secret',
        icon: 'key',
        body: (
          <>
            <p>Find App ID. Select the number. Copy it. Paste it into a note on your phone or computer.</p>
            <p>Find App Secret. Select it. Copy it. Paste it into the same note. Keep the secret private.</p>
            <p className="wiz-callout">Do not keep only the first few characters. Copy the whole value.</p>
          </>
        ),
        check: 'Your note has two values. One is short. One is long.',
      }],
    },
    {
      title: 'Make your phrase and your copy',
      intro: 'Two small jobs. Both take a minute.',
      steps: [
        {
          title: 'Create your secret phrase',
          icon: 'key',
          body: (
            <>
              <p>Meta uses it to check that messages come from your app. Only you know it.</p>
              <p>Use 20 or more letters and numbers. No spaces. Not used anywhere else. Example: <code>blueRiver92mangoLamp47</code></p>
              <p>Do not use the example. Type your own. Write it down.</p>
            </>
          ),
          check: 'You wrote your phrase on paper.',
        },
        {
          title: 'Make your own copy of the app',
          icon: 'cloud',
          skip: 'Skip if Cloudflare already gave you a web address. Use it as YOUR_LINK.',
          body: (
            <>
              <p>Open this link on a computer:</p>
              <CopyRow label="Deploy link" value="https://deploy.workers.cloudflare.com/?url=https://github.com/mayankav/reply-deck" />
              <p>Connect GitHub. Allow. Connect Cloudflare. Allow. Make free accounts if asked. Type a name, for example <code>my-reply-deck</code>. Paste App ID, App Secret, and your phrase. Select Deploy. Wait. Copy the web address Cloudflare shows you.</p>
              <p className="wiz-callout">Call that address <strong>YOUR_LINK</strong>. You use it on the next pages.</p>
            </>
          ),
          check: 'YOUR_LINK opens in your browser.',
        },
      ],
    },
    {
      title: 'Tell Meta about your app',
      intro: 'Paste the links from your app. Meta then knows where to send messages.',
      steps: [
        {
          title: 'Set the return and message links',
          icon: 'chat',
          body: (
            <>
              <p>On your Meta page, find the Instagram login settings. Paste the return address:</p>
              <CopyRow label="Return address" value={callbackUrl} />
              <p>In the left menu, select Webhooks. Paste the messages address:</p>
              <CopyRow label="Messages address" value={messageUrl} />
              <p>Paste your phrase in Verify token. Select Verify and save. Select three boxes: messages, messaging_postbacks, comments. Save.</p>
            </>
          ),
          check: 'The three boxes stay selected after you save.',
        },
        {
          title: 'Add four links in Meta',
          icon: 'link',
          body: (
            <>
              <p>In Meta, go to App Settings → Basic. Paste each link and save changes.</p>
              <button className="wiz-copy-all" onClick={() => void copyAllLinks()}>Copy all four links</button>
              <CopyRow label="Privacy link" value={privacyUrl} />
              <CopyRow label="Terms link" value={termsUrl} />
              <CopyRow label="When user leaves" value={leaveUrl} />
              <CopyRow label="When user deletes data" value={deleteUrl} />
            </>
          ),
          check: 'The four links stay saved when you reopen the page.',
        },
      ],
    },
    {
      title: 'Connect and test',
      intro: 'Last page. After this, you only use the editor.',
      steps: [
        {
          title: 'Add yourself as a tester',
          icon: 'user',
          skip: 'Skip if you already accepted a tester invite.',
          body: (
            <>
              <p>In Meta, open App Roles → Roles → Add user. Select Instagram Tester. Do not select Tester. Type your Instagram username without @. Send the invite.</p>
              <p>On your phone, open <a href="https://www.instagram.com/accounts/manage_access/" target="_blank" rel="noreferrer">Instagram invites ↗</a>. Select Tester Invites. Accept.</p>
            </>
          ),
          check: 'The invite disappears from Tester Invites.',
        },
        {
          title: 'Connect your account',
          icon: 'bolt',
          body: (
            <>
              <p>Open YOUR_LINK. Select Setup. Green dots mean the settings are correct.</p>
              <p>Select Connect Instagram. Log in. Select Allow.</p>
              <div className="wiz-connect"><ConnectButton label="Connect Instagram" /></div>
              <p className="wiz-callout">To test: New carousel → name Test → DM keyword → Exact → MENU. Add a title, cover image, and button. Save. Send MENU from another account on your phone.</p>
            </>
          ),
          check: 'The dashboard shows your @username.',
        },
      ],
    },
  ];

  function go(next: number) {
    setDirection(next > page ? 'next' : 'back');
    setPage(next);
    window.localStorage.setItem(STORAGE_KEY, String(next));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function copyAllLinks() {
    const links = [privacyUrl, termsUrl, leaveUrl, deleteUrl].join('\n');
    await navigator.clipboard.writeText(links);
  }

  const current = pages[page];

  return (
    <>
      <Header />
      <main className="wiz">
        <div className="wiz-head">
          <div className="wiz-eyebrow">First use · Reply Deck</div>
          <h1>{current?.title}</h1>
          <p>{current?.intro}</p>
          <div className="wiz-progress">
            {pages.map((_, index) => (
              <span key={index} className={index <= page ? 'on' : ''} />
            ))}
            <small>Page {page + 1} of {pages.length}</small>
          </div>
        </div>

        <div className="wiz-status">
          {CHECKS.map(({ key, label }) => (
            <span key={key}><i className={status?.checks[key] ? 'dot ok' : 'dot'} /> {label}</span>
          ))}
          <span>Accounts: <strong>{status?.connectedAccounts ?? 0}</strong></span>
          <button className="wiz-small-btn" onClick={() => void refresh()}>Check again</button>
        </div>

        <div key={page} className={`wiz-card ${direction}`}>
          {current?.steps.map((step, index) => (
            <section className="wiz-step" key={step.title}>
              <div className="wiz-step-head">
                <span className="wiz-icon"><Icon name={step.icon} /></span>
                <h2>{step.title}</h2>
              </div>
              {step.skip && <p className="wiz-skip">{step.skip}</p>}
              <div className="wiz-body">{step.body}</div>
              <p className="wiz-check"><strong>Check:</strong> {step.check}</p>
              {index < current.steps.length - 1 && <div className="wiz-divider" />}
            </section>
          ))}

          <div className="wiz-nav">
            <button className="wiz-back" disabled={page === 0} onClick={() => go(page - 1)}>← Back</button>
            {page < pages.length - 1 ? (
              <button className="wiz-next" onClick={() => go(page + 1)}>Next →</button>
            ) : (
              <button className="wiz-next" onClick={() => go(0)}>Start again</button>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
