'use client';

import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { ROOM } from '@iatrome/game/client';
import { useRoom } from '@/realtime/use-room';
import type { Snapshot } from '@/realtime/room-client';
import { lastName, rememberName, roomPassword } from '@/realtime/identity';
import { takeAutoJoin } from '@/realtime/auto-join';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Field';
import { Icon } from '@/components/icons/Icon';
import type { IconName } from '@/components/icons/icons';
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

/** Doors that are shut before you type anything: said up front, with no form to fill in. */
const SHUT: Record<string, { icon: IconName; title: string; text: string; retry: boolean }> = {
  locked: { icon: 'lock', title: 'This room is locked', text: 'The host locked the door. Ask them to unlock it, then check again.', retry: true },
  full: { icon: 'crowd', title: 'This room is full', text: 'Every seat is taken, including the folding chairs.', retry: true },
  banned: { icon: 'lock', title: 'You can’t join this room', text: 'This device was banned from the room.', retry: false },
  'too-many-attempts': { icon: 'hourglass', title: 'Too many wrong passwords', text: 'This device is locked out of the room for now.', retry: false },
};

export function JoinForm({ code, snap }: { code: string; snap: Snapshot }) {
  const room = useRoom();
  const [name, setName] = useState('');
  // The host's own phone already knows the password it set.
  const [password, setPassword] = useState(() => (typeof window === 'undefined' ? '' : (roomPassword(code) ?? '')));
  const [needsPassword, setNeedsPassword] = useState(false);
  const [checking, setChecking] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const joining = snap.status === 'joining';
  // A failed join reports the door too (someone locked it while you typed).
  const shut = SHUT[snap.gate ?? ''] ?? SHUT[snap.error ?? ''];

  useEffect(() => {
    // The host typed their name while setting up the room: walk straight in.
    const auto = takeAutoJoin(code);
    if (auto) {
      setName(auto);
      room.join(auto, roomPassword(code) ?? undefined);
      return;
    }
    setName(lastName());
    nameRef.current?.focus();
  }, [code, room]);

  useEffect(() => {
    if (snap.error === 'bad-password' || snap.gate === 'bad-password') setNeedsPassword(true);
  }, [snap.error, snap.gate]);

  useEffect(() => setChecking(false), [snap.gate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    unlockAudio();
    if (!name.trim()) return nameRef.current?.focus();
    rememberName(name.trim());
    room.join(name.trim(), password);
  };

  if (shut) {
    return (
      <motion.div className={styles.form} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <BackButton href="/" label="Home" />
        <div className={styles.shut} role="alert">
          <Icon name={shut.icon} size={72} />
          <h1 className={styles.shutTitle}>{shut.title}</h1>
          <p className={styles.shutText}>{shut.text}</p>
          <p className={styles.room}>
            Room <strong>{code}</strong>
          </p>
        </div>
        {shut.retry && (
          <Button
            size="xl"
            block
            tone="pearl"
            waiting={checking}
            onClick={() => {
              setChecking(true);
              room.probe();
              setTimeout(() => setChecking(false), 1500);
            }}
          >
            {checking ? 'Checking' : 'Check again'}
          </Button>
        )}
      </motion.div>
    );
  }

  const left = ROOM.maxNameLength - name.length;
  return (
    <motion.form className={styles.form} onSubmit={submit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <BackButton href="/" label="Home" />
      <img src="/brand/wordmark.svg" alt="iatrome" className={styles.logo} />
      <p className={styles.room}>
        Joining room <strong>{code}</strong>
      </p>
      <div className={styles.name}>
        <TextInput
          ref={nameRef}
          label="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={ROOM.maxNameLength}
          placeholder="Dr. Nickname"
          autoCapitalize="words"
          enterKeyHint="go"
          aria-describedby="name-count"
        />
        <span id="name-count" className={`${styles.count} ${left <= 3 ? styles.low : ''}`} aria-live="polite">
          {name.length}/{ROOM.maxNameLength}
        </span>
      </div>
      {needsPassword && (
        <TextInput
          label="Room password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          maxLength={ROOM.maxPasswordLength}
          placeholder="Ask your host"
          hint={snap.gate === 'bad-password' && !snap.error ? 'This room has a password.' : undefined}
          enterKeyHint="go"
        />
      )}
      {snap.stalled && !snap.error && (
        <p className={styles.error} role="alert">
          The room didn’t answer. Check your signal and tap Join again.
        </p>
      )}
      {snap.error && ERRORS[snap.error] && (
        <p className={styles.error} role="alert">
          {ERRORS[snap.error]}
        </p>
      )}
      <Button size="xl" block type="submit" waiting={joining}>
        {joining ? 'Joining' : 'Join game'}
      </Button>
      <p className={styles.fine}>Leave real patients out of it. Nobody here signed a consent form.</p>
    </motion.form>
  );
}
