'use client';

import { motion } from 'motion/react';
import styles from './Toggle.module.css';

interface Props {
  label: string;
  hint?: string;
  checked: boolean;
  /** Shown but greyed out and inert: the option exists, it just doesn't apply right now. */
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

export function Toggle({ label, hint, checked, disabled, onChange }: Props) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-disabled={disabled || undefined} disabled={disabled} className={styles.row} onClick={() => onChange(!checked)}>
      <span className={styles.text}>
        <span className={styles.label}>{label}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </span>
      <span className={`${styles.track} ${checked ? styles.on : ''}`}>
        <motion.span className={styles.knob} layout transition={{ type: 'spring', stiffness: 600, damping: 30 }} />
      </span>
    </button>
  );
}
