'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { setSession } from '@/lib/api';

export default function CallbackPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const session = params.get('session');
    if (!session) {
      setError('No session was returned from Instagram.');
      return;
    }
    setSession(session);
    window.history.replaceState(null, '', '/dashboard');
    router.replace('/dashboard');
  }, [router]);

  return (
    <main className="container narrow">
      <h1>{error || 'Connecting your account…'}</h1>
      {!error && <p>Finishing the Instagram handshake. This only takes a second.</p>}
    </main>
  );
}
