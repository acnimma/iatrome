'use client';

import Script from 'next/script';
import { adsClient, adsEnabled } from '@/lib/consent';
import { useConsent } from './useConsent';

/** Loads the ad network's script after the page is idle, and only with ads on and cookies accepted. */
export function AdScript() {
  const consent = useConsent();
  const client = adsClient();
  if (!adsEnabled() || consent !== 'all' || !client) return null;
  return <Script src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`} strategy="lazyOnload" crossOrigin="anonymous" />;
}
