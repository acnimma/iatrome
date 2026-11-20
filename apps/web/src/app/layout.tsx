import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'iatrome! — the party game that speaks fluent medicine',
  description:
    'A free, phone-friendly party game for med, nursing, PA and dental students and clinicians. Quips, doodles and diagnoses. Coming soon.',
  applicationName: 'iatrome',
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: 'iatrome!',
    description: 'The party game that speaks fluent medicine. Coming soon.',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  themeColor: '#5aa9e6',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
