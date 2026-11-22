'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clearSession, disconnectUrl, getSession } from '@/lib/api';

export default function Header() {
  const router = useRouter();
  const [connected, setConnected] = useState(false);

  useEffect(() => setConnected(Boolean(getSession())), []);

  async function disconnect() {
    await fetch(disconnectUrl(), { method: 'POST', headers: { Authorization: `Bearer ${getSession() ?? ''}` } }).catch(() => undefined);
    clearSession();
    router.push('/');
    router.refresh();
  }

  return (
    <nav className="nav">
      <Link href="/" className="brand">reply<span>deck</span></Link>
      <div className="nav-links">
        <Link href="/setup">Setup</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/builder">New carousel</Link>
        <Link href="/privacy">Privacy</Link>
        {connected && <button className="btn btn-sm btn-ghost" onClick={disconnect}>Disconnect</button>}
      </div>
    </nav>
  );
}
