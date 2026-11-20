'use client';

import { adsEnabled } from '@/lib/consent';
import { useConsent } from './useConsent';
import styles from './Ads.module.css';

/**
 * A place an ad may go, here and there, never during play: the home page and the end of a game.
 * Renders nothing until ads are switched on and the visitor said yes to cookies. Wire the ad
 * network's tag in here when the time comes (e.g. a Google AdSense <ins> unit per placement).
 */
export function AdSlot({ placement }: { placement: 'home' | 'game-over' }) {
  const consent = useConsent();
  if (!adsEnabled() || consent !== 'all') return null;
  return <aside className={styles.slot} data-placement={placement} aria-label="Advertisement" />;
}
