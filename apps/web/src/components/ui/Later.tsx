'use client';

import { useEffect, useState } from 'react';

/** True once `ms` have passed since mount (or since `key` changed). */
export function useAfter(ms: number, key?: unknown) {
  const [done, setDone] = useState(ms <= 0);
  useEffect(() => {
    setDone(ms <= 0);
    if (ms <= 0) return;
    const t = setTimeout(() => setDone(true), ms);
    return () => clearTimeout(t);
  }, [ms, key]);
  return done;
}

/** Renders its children after `ms`: for reveals that shouldn't land before their moment. */
export function Later({ ms, children }: { ms: number; children: React.ReactNode }) {
  const [ready, setReady] = useState(ms <= 0);
  useEffect(() => {
    if (ms <= 0) return setReady(true);
    const t = setTimeout(() => setReady(true), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return ready ? <>{children}</> : null;
}
