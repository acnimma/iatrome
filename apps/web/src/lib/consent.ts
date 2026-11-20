/**
 * Cookie consent, for the day iatrome shows ads. Analytics (Vercel Web Analytics) are
 * cookieless and need no consent; ad cookies do, so ads only load after "all".
 */
export type Consent = 'all' | 'essential';

const COOKIE = 'iatrome_consent';
const YEAR = 60 * 60 * 24 * 365;

/** Ads are off until this is set at build time. */
export const adsEnabled = () => process.env.NEXT_PUBLIC_ADS_ENABLED === 'true';

export function readConsent(): Consent | null {
  if (typeof document === 'undefined') return null;
  const value = document.cookie.split('; ').find((c) => c.startsWith(`${COOKIE}=`))?.split('=')[1];
  return value === 'all' || value === 'essential' ? value : null;
}

export function writeConsent(value: Consent) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COOKIE}=${value}; Max-Age=${YEAR}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new Event('iatrome:consent'));
}
