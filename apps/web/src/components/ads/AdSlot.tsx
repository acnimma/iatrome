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

/** A standard leaderboard: 728x90 is the one size that fits the lobby, the fun-fact screen and the podium. */
const AD = { width: 728, height: 90 } as const;

/**
 * One ad, wherever it is mounted. Renders nothing until ads are switched on at build time, the ad network
 * ids are set, and the visitor said yes to cookies. Never mounted during play: the callers decide when.
 *
 * `floating` pins it to the bottom of the screen at real pixel size (outside any scaled layout), so it
 * never shoves anything around. The ad request is made once per mount, never refreshed.
 */
export function AdSlot({ placement, floating = false, onClose }: { placement: AdPlacement; floating?: boolean; onClose?: () => void }) {
  const consent = useConsent();
  const client = adsClient();
  const unit = adUnit(placement);
  const ready = adsEnabled() && consent === 'all' && Boolean(client) && Boolean(unit);
  const requested = useRef(false);
  const box = useRef<HTMLElement>(null);
  const [state, setState] = useState<'waiting' | 'filled' | 'empty'>('waiting');

  useEffect(() => {
    if (!ready || requested.current) return;
    requested.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      setState('empty');
    }
  }, [ready]);

  // The network marks the unit filled or unfilled; a blocked script never marks it, so give up after a few seconds.
  // A floating ad sits outside the layout, so hiding it when empty moves nothing and shows no empty "Ad" card.
  useEffect(() => {
    if (!ready) return;
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
  }, [ready]);

  if (!ready || (floating && state === 'empty')) return null;
  return (
    <aside
      ref={box}
      className={floating ? styles.floating : styles.slot}
      data-placement={placement}
      data-state={state}
      aria-label="Advertisement"
    >
      <span className={styles.adLabel}>Ad</span>
      {onClose && (
        <button type="button" className={styles.adClose} onClick={onClose} aria-label="Hide ads for now">
          ×
        </button>
      )}
      <ins className="adsbygoogle" style={{ display: 'inline-block', width: AD.width, height: AD.height }} data-ad-client={client} data-ad-slot={unit} />
    </aside>
  );
}
