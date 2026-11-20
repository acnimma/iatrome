'use client';

import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { ROOM } from '@iatrome/game/client';
import { useRoom } from '@/realtime/use-room';
import type { Snapshot } from '@/realtime/room-client';
import { lastName, rememberName } from '@/realtime/identity';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Field';
import { unlockAudio } from '@/lib/sound';
import styles from './JoinForm.module.css';

const ERRORS: Record<string, string> = {
  'bad-password': 'That password didn’t match. Ask your host.',
  'too-many-attempts': 'Too many wrong passwords. Try again later.',
  banned: 'This device was banned from the room.',
  locked: 'The host locked this room.',
  full: 'This room is full.',
  'in-progress': 'A game is in progress and the audience is off. Hang tight!',
  'name-taken': 'Someone already has that name — try another.',
  'name-invalid': 'Pick a name with at least one letter or number.',
  'name-blocked': 'That name isn’t allowed. Try another.',
};

export function JoinForm({ code, snap }: { code: string; snap: Snapshot }) {
  const room = useRoom();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const joining = snap.status === 'joining';

  useEffect(() => {
    setName(lastName());
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    if (snap.error === 'bad-password') setNeedsPassword(true);
  }, [snap.error]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    unlockAudio();
    if (!name.trim()) return nameRef.current?.focus();
    rememberName(name.trim());
    room.join(name.trim(), password);
  };

  return (
    <motion.form className={styles.form} onSubmit={submit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <img src="/brand/wordmark.svg" alt="iatrome" className={styles.logo} />
      <p className={styles.room}>
        Joining room <strong>{code}</strong>
      </p>
      <TextInput
        ref={nameRef}
        label="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={ROOM.maxNameLength}
        placeholder="Dr. Nickname"
        autoCapitalize="words"
        enterKeyHint="go"
      />
      {needsPassword && (
        <TextInput
          label="Room password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          maxLength={ROOM.maxPasswordLength}
          placeholder="Ask your host"
          autoFocus
          enterKeyHint="go"
        />
      )}
      {snap.error && ERRORS[snap.error] && (
        <p className={styles.error} role="alert">
          {ERRORS[snap.error]}
        </p>
      )}
      <Button tone="rose" size="xl" block type="submit" disabled={joining}>
        {joining ? 'Scrubbing in…' : 'Join game'}
      </Button>
      <p className={styles.fine}>No real patients. No identifiers. Be kind — we’re all tired.</p>
    </motion.form>
  );
}
