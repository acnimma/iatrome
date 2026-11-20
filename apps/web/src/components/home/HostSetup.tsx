'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { type CreateRoomResponse, ROOM, type RoomSettings, defaultSettings } from '@iatrome/game/client';
import { realtimeHttpUrl } from '@/realtime/config';
import { rememberHost, rememberPassword } from '@/realtime/identity';
import { Backdrop } from '@/components/ui/Backdrop';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Field';
import { GamePicker, RoomOptions } from '@/components/room/GameSettings';
import { unlockAudio } from '@/lib/sound';
import styles from './HostSetup.module.css';

/** Pick a game, set a password if you like, and open a room. */
export function HostSetup() {
  const router = useRouter();
  const [settings, setSettings] = useState<RoomSettings>(defaultSettings);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    unlockAudio();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(realtimeHttpUrl('/api/rooms'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ settings, password: password.trim() || undefined }),
      });
      if (res.status === 429) throw new Error('You’ve opened a lot of rooms — wait a few minutes and try again.');
      if (!res.ok) throw new Error('Couldn’t open a room. Try again in a moment.');
      const { code, hostToken } = (await res.json()) as CreateRoomResponse;
      rememberHost(code, hostToken);
      rememberPassword(code, password.trim());
      router.push(`/host/${code}`);
    } catch (e) {
      setError(e instanceof TypeError ? 'Can’t reach the game server. Check your connection and try again.' : (e as Error).message);
      setBusy(false);
    }
  };

  return (
    <main className={styles.page}>
      <Backdrop />
      <motion.div className={styles.card} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
        <Link href="/" className={styles.logoLink} aria-label="iatrome home">
          <img src="/brand/wordmark.svg" alt="iatrome" className={styles.logo} />
        </Link>
        <div>
          <h1 className={styles.title}>Host a game</h1>
          <p className={styles.sub}>Open this on the screen everyone can see — a TV, a laptop, or a Zoom screen share. Everyone plays on their phones.</p>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Pick a game</h2>
          <GamePicker value={settings.game} onChange={(game) => setSettings((s) => ({ ...s, game }))} />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Keep it private</h2>
          <TextInput
            label="Room password (optional)"
            hint="Share it with your group. Strangers with the code still can’t get in."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            maxLength={ROOM.maxPasswordLength}
            placeholder="e.g. scrubs"
          />
        </section>

        <details className={styles.more}>
          <summary>More options</summary>
          <RoomOptions settings={settings} onChange={(patch) => setSettings((s) => ({ ...s, ...patch }))} />
        </details>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <Button tone="rose" size="xl" block onClick={create} disabled={busy}>
          {busy ? 'Opening the room…' : 'Create room'}
        </Button>
      </motion.div>
    </main>
  );
}
