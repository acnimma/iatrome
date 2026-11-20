'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import type { HostLine, Phase } from '@iatrome/game/client';
import { BeepFace, useHostLine } from '@/components/room/Beep';
import { Icon } from '@/components/icons/Icon';
import type { IconName } from '@/components/icons/icons';
import { TimerRing } from '@/components/ui/TimerRing';
import styles from './Phone.module.css';

/** Shared building blocks for every game's phone screens. */

export function PhoneMessage({ icon, title, children }: { icon?: IconName; title: string; children?: React.ReactNode }) {
  return (
    <motion.div className={styles.message} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 22 }}>
      {icon && (
        <motion.span className={styles.icon} animate={{ rotate: [0, -6, 6, 0], y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}>
          <Icon name={icon} size={88} />
        </motion.span>
      )}
      <h2 className={styles.title}>{title}</h2>
      {children && <div className={styles.text}>{children}</div>}
    </motion.div>
  );
}

/** The prompt at the top of a phone screen, with the timer. */
export function PhonePrompt({ label, prompt, phase, pausedAt }: { label?: string; prompt: string; phase?: Phase; pausedAt?: number | null }) {
  return (
    <div className={styles.prompt}>
      <div className={styles.promptText}>
        {label && <span className={styles.label}>{label}</span>}
        <p data-long={prompt.length > 140 || undefined}>{prompt}</p>
      </div>
      {phase && <TimerRing phase={phase} pausedAt={pausedAt ?? null} size={52} />}
    </div>
  );
}

export function PhoneStack({ children }: { children: React.ReactNode }) {
  return <div className={styles.stack}>{children}</div>;
}

/** A big tappable choice (votes, trivia options, would-you-rathers). */
export function Choice({
  children,
  onClick,
  picked,
  dimmed,
  tone = 'card',
  disabled,
  correct,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  picked?: boolean;
  dimmed?: boolean;
  tone?: 'card' | 'rose' | 'sky' | 'gold' | 'blue';
  disabled?: boolean;
  correct?: boolean;
}) {
  return (
    <motion.button
      type="button"
      className={`${styles.choice} ${styles[tone]} ${picked ? styles.picked : ''} ${dimmed ? styles.dimmed : ''} ${correct ? styles.correct : ''}`}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      layout
      data-choice
    >
      {children}
    </motion.button>
  );
}

/** Beep's latest line, for rooms with no big screen. Slides in, says its piece, leaves. */
export function BeepBanner({ line }: { line: HostLine | null }) {
  const shown = useHostLine(line, 6_500);
  return (
    <AnimatePresence initial={false}>
      {shown && (
        <motion.div
          key={shown.at}
          className={styles.beep}
          role="status"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={styles.beepInner}>
            <span className={styles.beepFace}>
              <BeepFace talking />
            </span>
            <p>{shown.text}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** The right answer and its fun fact, for trivia reveals with no big screen. */
export function AnswerCard({ letter, text, fact }: { letter?: string; text?: string; fact?: string | null }) {
  return (
    <motion.div className={styles.answer} initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
      {text && (
        <p className={styles.answerText}>
          {letter && <span className={styles.answerLetter}>{letter}</span>}
          {text}
        </p>
      )}
      {fact && <p className={styles.fact}>{fact}</p>}
    </motion.div>
  );
}
