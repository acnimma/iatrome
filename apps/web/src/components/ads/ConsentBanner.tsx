'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { adsEnabled, writeConsent } from '@/lib/consent';
import { useConsent } from './useConsent';
import styles from './Ads.module.css';

/** Asks once, only when ads are switched on. Never shown mid-game: it sits in a corner. */
export function ConsentBanner() {
  const consent = useConsent();
  if (!adsEnabled() || consent !== null) return null;
  return (
    <div className={styles.banner} role="dialog" aria-label="Cookies">
      <p>
        The occasional ad keeps iatrome free. Ads use cookies. <Link href="/privacy">Details</Link>
      </p>
      <div className={styles.bannerActions}>
        <Button size="sm" tone="pearl" onClick={() => writeConsent('essential')}>
          No thanks
        </Button>
        <Button size="sm" onClick={() => writeConsent('all')}>
          Fine
        </Button>
      </div>
    </div>
  );
}
