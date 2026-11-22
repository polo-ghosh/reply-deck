import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Reply Deck — Instagram DM carousels',
  description: 'Build Instagram DM carousels for your Business or Creator account.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
