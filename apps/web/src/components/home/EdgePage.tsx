'use client';

import Link from 'next/link';
import { BeepFace } from '@/components/room/Beep';
import { jelly } from '@/components/ui/jelly';
import buttons from '@/components/ui/Button.module.css';
import { JoinCodeForm } from './JoinCodeForm';
import styles from './EdgePage.module.css';

/**
 * The screens nobody means to visit (no such page, something broke): Beep reads the chart,
 * says it straight, and there's always a way home.
 */
export function EdgePage({
  eyebrow,
  title,
  line,
  bpm = 72,
  joinForm,
  action,
}: {
  eyebrow: string;
  title: string;
  /** What Beep says. */
  line: React.ReactNode;
  bpm?: number;
  /** Offer the room-code boxes too (a mistyped short link is usually a room code). */
  joinForm?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <main className={styles.page}>
      <Link href="/" className={styles.logo} aria-label="iatrome home">
        <img src="/brand/wordmark.svg" alt="iatrome" />
      </Link>
      <div className={styles.card}>
        <div className={styles.beep}>
          <BeepFace talking bpm={bpm} />
        </div>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.line}>{line}</p>
      </div>
      {joinForm && <JoinCodeForm />}
      <div className={styles.actions}>
        {action}
        <Link href="/" className={`${buttons.button} ${buttons.lg} ${buttons.block} ${jelly('pearl')} ${styles.home}`}>
          Back home
        </Link>
      </div>
    </main>
  );
}
