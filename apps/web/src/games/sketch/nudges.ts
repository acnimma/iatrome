'use client';

import { useEffect, useRef, useState } from 'react';
import type { SketchView } from '@iatrome/game/client';

type Nudge = SketchView['nudges'][number];

/** Nudges that arrived since this screen mounted, each kept for a moment (yours excluded). */
export function useNewNudges(nudges: Nudge[], exclude?: string, holdMs = 2_600) {
  const seen = useRef<Set<number> | null>(null);
  const [live, setLive] = useState<Nudge[]>([]);
  useEffect(() => {
    if (!seen.current) {
      seen.current = new Set(nudges.map((n) => n.id));
      return;
    }
    const fresh = nudges.filter((n) => !seen.current!.has(n.id));
    fresh.forEach((n) => seen.current!.add(n.id));
    const shown = fresh.filter((n) => n.playerId !== exclude);
    if (!shown.length) return;
    const ids = new Set(shown.map((n) => n.id));
    setLive((all) => [...all, ...shown].slice(-6));
    setTimeout(() => setLive((all) => all.filter((n) => !ids.has(n.id))), holdMs);
  }, [nudges, exclude, holdMs]);
  return live;
}
