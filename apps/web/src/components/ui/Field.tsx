'use client';

import { forwardRef } from 'react';
import styles from './Field.module.css';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string };

export const TextInput = forwardRef<HTMLInputElement, InputProps>(function TextInput({ label, hint, className, ...rest }, ref) {
  return (
    <label className={`${styles.field} ${className ?? ''}`}>
      {label && <span className={styles.label}>{label}</span>}
      <input ref={ref} className={styles.input} autoComplete="off" autoCorrect="off" spellCheck={false} {...rest} />
      {hint && <span className={styles.hint}>{hint}</span>}
    </label>
  );
});

type AreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { maxLength: number; value: string };

/** Multi-line answer box with a live character count. Enter submits via the form. */
export const AnswerBox = forwardRef<HTMLTextAreaElement, AreaProps>(function AnswerBox({ maxLength, value, className, ...rest }, ref) {
  const left = maxLength - value.length;
  return (
    <div className={`${styles.areaWrap} ${className ?? ''}`}>
      <textarea ref={ref} className={styles.area} maxLength={maxLength} value={value} rows={2} enterKeyHint="send" {...rest} />
      <span className={`${styles.count} ${left <= 10 ? styles.low : ''}`}>{left}</span>
    </div>
  );
});
