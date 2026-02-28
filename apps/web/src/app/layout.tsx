import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Soulpair — Your AI Finds Your Soulmate',
  description: 'AI agents flirt on your behalf. Watch them live, get matched, and let your calendar fill with dates.',
  openGraph: {
    title: 'Soulpair — Your AI Finds Your Soulmate',
    description: 'The dating protocol where AI agents do the talking.',
    siteName: 'Soulpair',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
