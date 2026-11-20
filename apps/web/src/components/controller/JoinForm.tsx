'use client';

import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { ROOM } from '@iatrome/game/client';
import { useRoom } from '@/realtime/use-room';
import type { Snapshot } from '@/realtime/room-client';
import { lastName, rememberName, roomPassword } from '@/realtime/identity';
import { BackButton } from '@/components/ui/BackButton';
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
  'name-taken': 'Someone already has that name. Try another.',
  'name-invalid': 'Pick a name with at least one letter or number.',
};

export function JoinForm({ code, snap }: { code: string; snap: Snapshot }) {
  const room = useRoom();
  const [name, setName] = useState('');
  // The host's own phone already knows the password it set.
  const [password, setPassword] = useState(() => (typeof window === 'undefined' ? '' : (roomPassword(code) ?? '')));
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
      <BackButton href="/" label="Home" />
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
        {joining ? 'Joining…' : 'Join game'}
      </Button>
      <p className={styles.fine}>No real patients or identifiers, please.</p>
    </motion.form>
  );
}
