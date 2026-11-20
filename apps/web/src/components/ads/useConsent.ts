'use client';

import { useEffect, useState } from 'react';
import { type Consent, readConsent } from '@/lib/consent';

/** The visitor's cookie choice, kept in sync when they change it. `undefined` until mounted. */
export function useConsent() {
  const [consent, setConsent] = useState<Consent | null | undefined>(undefined);
  useEffect(() => {
    const sync = () => setConsent(readConsent());
    sync();
    window.addEventListener('iatrome:consent', sync);
    return () => window.removeEventListener('iatrome:consent', sync);
  }, []);
  return consent;
}
