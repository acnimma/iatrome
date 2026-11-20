'use client';

import { motion } from 'motion/react';
import styles from './Toggle.module.css';

interface Props {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Toggle({ label, hint, checked, onChange }: Props) {
  return (
    <button type="button" role="switch" aria-checked={checked} className={styles.row} onClick={() => onChange(!checked)}>
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
