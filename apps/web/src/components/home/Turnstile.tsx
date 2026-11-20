'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';
import { turnstileSiteKey } from '@/realtime/config';

interface TurnstileApi {
  render(el: HTMLElement, opts: Record<string, unknown>): string;
  reset(id: string): void;
  remove(id: string): void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/**
 * Cloudflare Turnstile on room creation: invisible for almost everyone, a checkbox only when
 * Cloudflare is suspicious. Does nothing when no site key is configured (local dev).
 * Returns the widget element and a function that resolves to a fresh single-use token.
 */
export function useTurnstile() {
  const siteKey = turnstileSiteKey();
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const token = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!siteKey || !ready || !box.current || !window.turnstile || widget.current) return;
    widget.current = window.turnstile.render(box.current, {
      sitekey: siteKey,
      appearance: 'interaction-only',
      action: 'create-room',
      callback: (t: string) => (token.current = t),
      'expired-callback': () => (token.current = null),
      'error-callback': () => (token.current = null),
    });
    return () => {
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, [siteKey, ready]);

  const getToken = useCallback(async (): Promise<string | undefined> => {
    if (!siteKey) return undefined;
    for (let i = 0; i < 50 && !token.current; i++) await new Promise((r) => setTimeout(r, 100));
    const t = token.current ?? undefined;
    // Tokens are single use: get a fresh one ready for the next try.
    token.current = null;
    if (widget.current) window.turnstile?.reset(widget.current);
    return t;
  }, [siteKey]);

  const element = siteKey ? (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={() => setReady(true)} />
      <div ref={box} />
    </>
  ) : null;

  return { element, getToken };
}
