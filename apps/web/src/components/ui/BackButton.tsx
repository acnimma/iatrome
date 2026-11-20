'use client';

import Link from 'next/link';
import { Icon } from '@/components/icons/Icon';
import styles from './BackButton.module.css';

type Props = { label?: string } & ({ href: string; onClick?: never } | { onClick: () => void; href?: never });

/** A quiet, consistent way back: a round arrow plus a word. */
export function BackButton({ label = 'Back', href, onClick }: Props) {
  const content = (
    <>
      <Icon name="back" size={28} />
      <span>{label}</span>
    </>
  );
  return href ? (
    <Link href={href} className={styles.back}>
      {content}
    </Link>
  ) : (
    <button type="button" className={styles.back} onClick={onClick}>
      {content}
    </button>
  );
}
