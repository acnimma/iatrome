'use client';

import { useEffect, useRef, useState } from 'react';
import { REVEAL, type RoomView } from '@iatrome/game/client';
import { AdSlot } from '@/components/ads/AdSlot';
import type { AdPlacement } from '@/lib/consent';

/**
 * The only places an ad may appear on the big screen, all of them calm moments:
 *  - lobby: while the room fills, after a beat
 *  - fun-fact: once the explanation has settled, on every third question (never every one)
 *  - game-over: after the podium animations have finished
 * Never during a timer or while anyone is answering, never on phones, and one tap on × silences it for the visit.
 */
const LOBBY_DELAY = 1_500;
const FACT_DELAY = 3_000;
const FACT_EVERY = 3;
const PODIUM_DONE = REVEAL.podium + 4_500;
const DISMISSED = 'iatrome:ads-dismissed';

export function StageAds({ view }: { view: RoomView }) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISSED) === '1';
    } catch {
      return false;
    }
  });
  const [showing, setShowing] = useState<AdPlacement | null>(null);
  const facts = useRef(new Set<string>());

  const game = view.game;
  const fact = game && 'fact' in game ? (game as { fact?: string | null }).fact : null;
  const number = game && 'number' in game ? (game as { number?: number }).number : 0;

  let placement: AdPlacement | null = null;
  let key = '';
  let delay = 0;
  if (view.paused) placement = null;
  else if (view.stage === 'lobby') [placement, key, delay] = ['lobby', 'lobby', LOBBY_DELAY];
  else if (view.stage === 'over') [placement, key, delay] = ['game-over', 'over', PODIUM_DONE];
  else if (view.stage === 'playing' && game?.phase.name === 'reveal' && fact) [placement, key, delay] = ['fun-fact', `fact:${game.game}:${number}`, FACT_DELAY];

  // Every third fun fact only: count each one the first time it appears.
  let allowed = true;
  if (placement === 'fun-fact') {
    facts.current.add(key);
    allowed = facts.current.size % FACT_EVERY === 0;
  }

  useEffect(() => {
    setShowing(null);
    if (!placement || !allowed || dismissed) return;
    const t = setTimeout(() => setShowing(placement), delay);
    return () => clearTimeout(t);
    // The key changes when the moment does: a new fact, the lobby, the podium.
  }, [key, allowed, dismissed, view.paused]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!showing || dismissed) return null;
  return (
    <AdSlot
      key={key}
      placement={showing}
      floating
      onClose={() => {
        try {
          sessionStorage.setItem(DISMISSED, '1');
        } catch {}
        setDismissed(true);
      }}
    />
  );
}
