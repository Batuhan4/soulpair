import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

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
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
