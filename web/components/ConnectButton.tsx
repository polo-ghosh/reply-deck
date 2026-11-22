'use client';

import { connectInstagramUrl } from '@/lib/api';

export default function ConnectButton({ label = 'Connect Instagram' }: { label?: string }) {
  return (
    <a className="btn btn-primary" href={connectInstagramUrl()}>
      {label}
      <span aria-hidden="true">→</span>
    </a>
  );
}
