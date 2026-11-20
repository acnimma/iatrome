'use client';

import { motion } from 'motion/react';
import { type ContentMode, type GameId, type RoomSettings, gameInfo } from '@iatrome/game/client';
import { Icon } from '@/components/icons/Icon';
import type { IconName } from '@/components/icons/icons';
import { Toggle } from '@/components/ui/Toggle';
import styles from './GameSettings.module.css';

const GAME_ICONS: Record<GameId, IconName> = {
  didactics: 'game-didactics',
  'grand-rounds': 'game-rounds',
  sketch: 'game-sketch',
  survive: 'game-survive',
  poison: 'game-poison',
};

const GAME_TONES: Record<GameId, string> = {
  didactics: 'var(--royal-gold)',
  'grand-rounds': 'var(--rose-kiss)',
  sketch: 'var(--cool-sky)',
  survive: 'var(--royal-gold)',
  poison: 'var(--sky-blue)',
};

/** The flagship first, then the big-group party game. */
const ORDER: GameId[] = ['grand-rounds', 'didactics', 'sketch', 'survive', 'poison'];

/** Pick a game. */
export function GamePicker({ value, onChange, compact }: { value: GameId; onChange: (g: GameId) => void; compact?: boolean }) {
  return (
    <div className={`${styles.games} ${compact ? styles.compact : ''}`} role="radiogroup" aria-label="Game">
      {ORDER.map((id) => {
        const info = gameInfo[id];
        const picked = id === value;
        return (
          <motion.button
            key={id}
            type="button"
            role="radio"
            aria-checked={picked}
            className={`${styles.game} ${picked ? styles.picked : ''}`}
            style={{ '--tone': GAME_TONES[id] } as React.CSSProperties}
            onClick={() => onChange(id)}
            whileTap={{ scale: 0.97 }}
          >
            <span className={styles.icon}>
              <Icon name={GAME_ICONS[id]} size={compact ? 30 : 38} />
            </span>
            <span className={styles.gameText}>
              <span className={styles.gameHead}>
                <span className={styles.gameTitle}>{info.title}</span>
                <span className={styles.meta}>
                  {info.min}–{info.max}
                </span>
              </span>
              <span className={styles.tagline}>{info.tagline}</span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

const MODES: { id: ContentMode; title: string; blurb: string }[] = [
  { id: 'normal', title: 'Normal', blurb: 'Anyone can play' },
  { id: 'pro', title: 'Pro', blurb: 'For healthcare people' },
];

/** The only options: who it's for, and how much time. */
const SCREENS = [
  { id: 'big', title: 'Big screen', blurb: 'A TV, laptop or video call' },
  { id: 'phones', title: 'Just phones', blurb: 'Everyone plays on their own' },
] as const;

export type ScreenChoice = (typeof SCREENS)[number]['id'];

/** Where everyone will be looking. Phones-only rooms skip the stage entirely. */
export function ScreenPicker({ value, onChange }: { value: ScreenChoice; onChange: (v: ScreenChoice) => void }) {
  return (
    <div className={styles.modes} role="radiogroup" aria-label="Where everyone looks">
      {SCREENS.map((s) => (
        <button
          key={s.id}
          type="button"
          role="radio"
          aria-checked={value === s.id}
          className={`${styles.mode} ${value === s.id ? styles.modePicked : ''}`}
          onClick={() => onChange(s.id)}
        >
          <span className={styles.modeTitle}>{s.title}</span>
          <span className={styles.modeBlurb}>{s.blurb}</span>
        </button>
      ))}
    </div>
  );
}

export function RoomOptions({ settings, onChange }: { settings: RoomSettings; onChange: (patch: Partial<RoomSettings>) => void }) {
  return (
    <div className={styles.options}>
      <div className={styles.modes} role="radiogroup" aria-label="Who’s playing">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={settings.mode === m.id}
            className={`${styles.mode} ${settings.mode === m.id ? styles.modePicked : ''}`}
            onClick={() => onChange({ mode: m.id })}
          >
            <span className={styles.modeTitle}>{m.title}</span>
            <span className={styles.modeBlurb}>{m.blurb}</span>
          </button>
        ))}
      </div>
      <Toggle label="More time" hint="Slower timers. Great on video calls." checked={settings.extendedTimers} onChange={(extendedTimers) => onChange({ extendedTimers })} />
    </div>
  );
}
