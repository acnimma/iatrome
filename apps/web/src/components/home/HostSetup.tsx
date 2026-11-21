'use client';

import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { type CreateRoomResponse, ROOM, type RoomSettings, defaultSettings } from '@iatrome/game/client';
import { realtimeHttpUrl } from '@/realtime/config';
import { lastName, rememberHost, rememberName, rememberPassword } from '@/realtime/identity';
import { rememberAutoJoin } from '@/realtime/auto-join';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Field';
import { CROWD_LABEL, GamePicker, ModePicker, type ScreenChoice, ScreenPicker, TeamsToggle, TimeToggle } from '@/components/room/GameSettings';
import { unlockAudio } from '@/lib/sound';
import { track } from '@vercel/analytics';
import styles from './HostSetup.module.css';

/** Pick a game, set a password if you like, and open a room. */
export function HostSetup() {
  const router = useRouter();
  const [settings, setSettings] = useState<RoomSettings>(defaultSettings);
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  useEffect(() => setName(lastName()), []);
  const [screen, setScreen] = useState<ScreenChoice>('big');
  // Hosting from a phone almost always means there's no TV involved.
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse) and (max-width: 700px)').matches) setScreen('phones');
  }, []);
  const [busy, setBusy] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    unlockAudio();
    if (screen === 'phones' && !name.trim()) {
      setError('Type your name first. You’re playing too.');
      nameRef.current?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(realtimeHttpUrl('/api/rooms'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ settings, password: password.trim() || undefined }),
      });
      if (res.status === 503) throw new Error('The hospital is full right now. Try again in a few minutes.');
      if (res.status === 429) throw new Error('You’ve opened a lot of rooms. Wait a few minutes and try again.');
      if (!res.ok) throw new Error('Couldn’t open a room. Try again in a moment.');
      const { code, hostToken } = (await res.json()) as CreateRoomResponse;
      rememberHost(code, hostToken);
      track('room_created', { game: settings.game, mode: settings.mode, screen });
      rememberPassword(code, password.trim());
      if (screen === 'phones') {
        rememberName(name.trim());
        rememberAutoJoin(code, name.trim());
      }
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
          <section className={styles.card} aria-labelledby="card-play">
            <h2 id="card-play" className={styles.cardTitle}>
              How you play
            </h2>
            <div className={styles.field}>
              <h3 className={styles.label}>Shared screen</h3>
              <ScreenPicker value={screen} onChange={setScreen} />
            </div>
            {/* Always here, greyed out until it applies, so choosing a game or a screen never moves the page. */}
            <div className={styles.field}>
              <h3 className={styles.label}>Your name</h3>
              <TextInput
                ref={nameRef}
                aria-label="Your name"
                hint={screen === 'phones' ? 'You host from your own device and play too.' : 'Only when the shared screen is off.'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={ROOM.maxNameLength}
                placeholder="Dr. Nickname"
                autoCapitalize="words"
                disabled={screen !== 'phones'}
              />
            </div>
          </section>

          <section className={styles.card} aria-labelledby="card-game">
            <h2 id="card-game" className={styles.cardTitle}>
              The game
            </h2>
            <div className={styles.field}>
              <h3 className={styles.label}>{CROWD_LABEL}</h3>
              <ModePicker value={settings.mode} onChange={(mode) => setSettings((s) => ({ ...s, mode }))} />
            </div>
            <div className={styles.toggles}>
              <TimeToggle settings={settings} onChange={(patch) => setSettings((s) => ({ ...s, ...patch }))} />
              <TeamsToggle settings={settings} onChange={(patch) => setSettings((s) => ({ ...s, ...patch }))} />
            </div>
          </section>

          <section className={`${styles.card} ${styles.roomCard}`} aria-labelledby="card-room">
            <h2 id="card-room" className={styles.cardTitle}>
              The room
            </h2>
            <div className={styles.field}>
              <h3 className={styles.label}>Password</h3>
              <TextInput
                aria-label="Room password (optional)"
                hint="Optional. Strangers with the code still can’t get in."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={ROOM.maxPasswordLength}
                placeholder="e.g. scrubs"
              />
            </div>
            <div className={styles.go}>
              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}
              <div className={styles.createBar}>
                <Button size="xl" className={styles.create} onClick={create} waiting={busy}>
                  {busy ? 'Opening the room' : 'Create room'}
                </Button>
              </div>
            </div>
          </section>
        </div>
      </motion.div>
    </main>
  );
}
