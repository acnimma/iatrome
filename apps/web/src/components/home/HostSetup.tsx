'use client';

import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { type CreateRoomResponse, ROOM, type RoomSettings, defaultSettings } from '@iatrome/game/client';
import { realtimeHttpUrl } from '@/realtime/config';
import { rememberHost, rememberPassword } from '@/realtime/identity';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Field';
import { GamePicker, ModePicker, type ScreenChoice, ScreenPicker, TimeToggle } from '@/components/room/GameSettings';
import { unlockAudio } from '@/lib/sound';
import { useTurnstile } from './Turnstile';
import styles from './HostSetup.module.css';

/** Pick a game, set a password if you like, and open a room. */
export function HostSetup() {
  const router = useRouter();
  const [settings, setSettings] = useState<RoomSettings>(defaultSettings);
  const [password, setPassword] = useState('');
  const [screen, setScreen] = useState<ScreenChoice>('big');
  // Hosting from a phone almost always means there's no TV involved.
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse) and (max-width: 700px)').matches) setScreen('phones');
  }, []);
  const [busy, setBusy] = useState(false);
  const human = useTurnstile();
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    unlockAudio();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(realtimeHttpUrl('/api/rooms'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ settings, password: password.trim() || undefined, turnstile: await human.getToken() }),
      });
      if (res.status === 403) throw new Error('Couldn’t confirm you’re a person. Refresh the page and try again.');
      if (res.status === 429) throw new Error('You’ve opened a lot of rooms. Wait a few minutes and try again.');
      if (!res.ok) throw new Error('Couldn’t open a room. Try again in a moment.');
      const { code, hostToken } = (await res.json()) as CreateRoomResponse;
      rememberHost(code, hostToken);
      rememberPassword(code, password.trim());
      router.push(screen === 'phones' ? `/play/${code}` : `/host/${code}`);
    } catch (e) {
      setError(e instanceof TypeError ? 'Can’t reach the game server. Check your connection and try again.' : (e as Error).message);
      setBusy(false);
    }
  };

  return (
    <main className={styles.page}>
      <motion.div className={styles.shell} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
        <header className={styles.top}>
          <BackButton href="/" />
          <img src="/brand/wordmark.svg" alt="iatrome" className={styles.logo} />
        </header>

        <div className={styles.intro}>
          <h1 className={styles.title}>Host a game</h1>
          <p className={styles.sub}>You pick. Everyone else plays on their phone, which they were going to look at anyway.</p>
        </div>

        <GamePicker tiles value={settings.game} onChange={(game) => setSettings((s) => ({ ...s, game }))} />

        <div className={styles.settings}>
          <section className={styles.setting}>
            <h2 className={styles.label}>Screen</h2>
            <ScreenPicker value={screen} onChange={setScreen} />
          </section>
          <section className={styles.setting}>
            <h2 className={styles.label}>Crowd</h2>
            <ModePicker value={settings.mode} onChange={(mode) => setSettings((s) => ({ ...s, mode }))} />
          </section>
          <section className={styles.setting}>
            <h2 className={styles.label}>Password</h2>
            <TextInput
              aria-label="Room password (optional)"
              hint="Optional. Strangers with the code still can’t get in."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={ROOM.maxPasswordLength}
              placeholder="e.g. scrubs"
            />
          </section>
        </div>

        <div className={styles.go}>
          <div className={styles.time}>
            <TimeToggle settings={settings} onChange={(patch) => setSettings((s) => ({ ...s, ...patch }))} />
          </div>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          {human.element}
          <Button size="xl" className={styles.create} onClick={create} disabled={busy}>
            {busy ? 'Opening the room…' : 'Create room'}
          </Button>
        </div>
      </motion.div>
    </main>
  );
}
