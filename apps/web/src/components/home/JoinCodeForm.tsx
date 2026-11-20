'use client';

import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { ROOM } from '@iatrome/game/client';
import { Button } from '@/components/ui/Button';
import styles from './JoinCodeForm.module.css';

const VALID = new RegExp(`[^${ROOM.codeAlphabet}]`, 'g');

/** Six squishy letter boxes. Type or paste a room code; it jumps to the join screen. */
export function JoinCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const complete = code.length === ROOM.codeLength;

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    if (complete) router.push(`/play/${code}`);
  };

  return (
    <motion.form className={styles.form} onSubmit={go} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
      <label className={styles.label} htmlFor="room-code">
        Enter a room code
      </label>
      <div className={styles.boxes} onClick={() => input.current?.focus()}>
        {Array.from({ length: ROOM.codeLength }, (_, i) => (
          <motion.span
            key={i}
            className={`${styles.box} ${i === code.length ? styles.cursor : ''}`}
            animate={code[i] ? { scale: [1.25, 1], y: [-4, 0] } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 600, damping: 16 }}
          >
            {code[i] ?? ''}
          </motion.span>
        ))}
        <input
          ref={input}
          id="room-code"
          className={styles.input}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(VALID, '').slice(0, ROOM.codeLength))}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          aria-label="Room code"
        />
      </div>
      <Button size="xl" type="submit" disabled={!complete} block>
        Join game
      </Button>
    </motion.form>
  );
}
