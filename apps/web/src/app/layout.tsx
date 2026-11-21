import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { AdScript } from '@/components/ads/AdScript';
import { SupportButton } from '@/components/ui/SupportButton';
import { adsEnabled } from '@/lib/consent';
import { ConsentBanner } from '@/components/ads/ConsentBanner';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const dogbangy = localFont({ src: '../fonts/Dogbangy.ttf', variable: '--font-dogbangy', display: 'swap' });

export const metadata: Metadata = {
  // Link previews need absolute URLs: the env var, else the Vercel production domain, else local.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000'),
  ),
  // Every tab reads "iatrome | ...": pages only supply their own part.
  title: { default: 'iatrome | medical party game', template: 'iatrome | %s' },
  description:
    'A party game for people who speak fluent medicine. Free, played on your phones or laptops, with or without a shared screen.',
  applicationName: 'iatrome',
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: 'iatrome | medical party game',
    description: 'A party game for people who speak fluent medicine. Free, played on your phones or laptops.',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${dogbangy.variable}`}>
      <body data-ads={adsEnabled() ? 'on' : undefined}>
        {children}
        <SupportButton />
        <ConsentBanner />
        <AdScript />
        {/* Cookieless: counts visits and page speed without identifying anyone. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
