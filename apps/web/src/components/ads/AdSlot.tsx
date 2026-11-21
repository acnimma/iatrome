'use client';

import { useEffect, useRef, useState } from 'react';
import { type AdPlacement, adUnit, adsClient, adsEnabled } from '@/lib/consent';
import { useConsent } from './useConsent';
import styles from './Ads.module.css';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * The three standard banner sizes that fit every screen without distorting it. The breakpoints match
 * Ads.module.css, which reserves the same height before the ad ever loads.
 *  - laptops and TVs (1100px and up): 728x90 leaderboard. The 178px of clear space either side keeps it off the corner buttons.
 *  - tablets and small windows (640 to 1099px): 468x60 banner.
 *  - phones: 320x100 large mobile banner.
 */
function pickSize(): { width: number; height: number } {
  if (window.matchMedia('(min-width: 1100px)').matches) return { width: 728, height: 90 };
  if (window.matchMedia('(min-width: 640px)').matches) return { width: 468, height: 60 };
  return { width: 320, height: 100 };
}

/**
 * One ad, wherever it is mounted. Renders nothing until ads are switched on at build time and the ad
 * network ids are set; the ad itself loads only once the visitor said yes to cookies. Never mounted
 * during play: the callers decide when.
 *
 * `floating` pins it to the bottom of the screen at real pixel size (outside any scaled layout), so it
 * never shoves anything around, and it disappears if nothing fills it. Without `floating` it sits in the
 * page and its box is reserved from the first paint, so the page never shifts when the ad arrives.
 * The ad request is made once per mount and never refreshed.
 */
export function AdSlot({ placement, floating = false, onClose }: { placement: AdPlacement; floating?: boolean; onClose?: () => void }) {
  const consent = useConsent();
  const client = adsClient();
  const unit = adUnit(placement);
  const configured = adsEnabled() && Boolean(client) && Boolean(unit);
  const ready = configured && consent === 'all';
  const requested = useRef(false);
  const box = useRef<HTMLElement>(null);
  const [state, setState] = useState<'waiting' | 'filled' | 'empty'>('waiting');
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (ready) setSize(pickSize());
  }, [ready]);

  useEffect(() => {
    if (!ready || !size || requested.current) return;
    requested.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      setState('empty');
    }
  }, [ready, size]);

  // The network marks the unit filled or unfilled; a blocked script never marks it, so give up after a few seconds.
  useEffect(() => {
    if (!ready || !size) return;
    const ins = box.current?.querySelector('ins');
    if (!ins) return;
    const read = () => {
      const status = ins.getAttribute('data-ad-status');
      if (status === 'filled') setState('filled');
      else if (status === 'unfilled') setState('empty');
    };
    read();
    const watch = new MutationObserver(read);
    watch.observe(ins, { attributes: true, attributeFilter: ['data-ad-status'] });
    const giveUp = setTimeout(() => setState((s) => (s === 'waiting' ? 'empty' : s)), 4_000);
    return () => {
      watch.disconnect();
      clearTimeout(giveUp);
    };
  }, [ready, size]);

  if (!configured) return null;
  // A floating ad sits outside the layout, so hiding it moves nothing. An in-page one keeps its reserved box.
  if (floating && (!ready || state === 'empty')) return null;
  return (
    <aside
      ref={box}
      className={`${styles.frame} ${floating ? styles.floating : styles.slot}`}
      data-placement={placement}
      data-state={ready ? state : 'idle'}
      aria-label="Advertisement"
    >
      <span className={styles.adLabel}>Ad</span>
      {onClose && (
        <button type="button" className={styles.adClose} onClick={onClose} aria-label="Hide ads for now">
          ×
        </button>
      )}
      {ready && size && (
        <ins className="adsbygoogle" style={{ display: 'inline-block', width: size.width, height: size.height }} data-ad-client={client} data-ad-slot={unit} />
      )}
    </aside>
  );
}
