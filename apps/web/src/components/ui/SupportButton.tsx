'use client';

import { usePathname } from 'next/navigation';
import { Icon } from '@/components/icons/Icon';
import { jelly } from '@/components/ui/jelly';
import styles from './SupportButton.module.css';

/** Where support and feedback go. */
const SUPPORT_EMAIL = 'anirudh@iatrome.com';

/**
 * A small round "email us" button in the corner of the public pages (home, host setup, join, privacy).
 * Hidden on the live game screens (the big screen and the phones in play), where nothing should compete.
 */
export function SupportButton() {
  const path = usePathname() ?? '/';
  if (path.startsWith('/host/') || path.startsWith('/play/')) return null;
  return (
    <a
      href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('iatrome feedback')}`}
      className={`${styles.support} ${jelly('pearl')}`}
      data-lift={path === '/host' || undefined}
      aria-label="Email support or feedback"
      title="Support and feedback"
    >
      <Icon name="feedback" size={30} />
    </a>
  );
}
