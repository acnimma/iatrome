'use client';

import { motion } from 'motion/react';
import { type ContentMode, type GameId, type RoomSettings, gameInfo } from '@iatrome/game/client';
import { Icon } from '@/components/icons/Icon';
import type { IconName } from '@/components/icons/icons';
import { Segmented } from '@/components/ui/Segmented';
import { Toggle } from '@/components/ui/Toggle';
import { jelly } from '@/components/ui/jelly';
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

/** Pick a game: a list on phones and in dialogs, a row of tiles when `tiles` and there's room. */
export function GamePicker({ value, onChange, compact, tiles }: { value: GameId; onChange: (g: GameId) => void; compact?: boolean; tiles?: boolean }) {
  return (
    <div className={`${styles.games} ${compact ? styles.compact : ''} ${tiles ? styles.tiles : ''}`} role="radiogroup" aria-label="Game">
      {ORDER.map((id) => {
        const info = gameInfo[id];
        const picked = id === value;
        return (
          <motion.button
            key={id}
            type="button"
            role="radio"
            aria-checked={picked}
            className={`${styles.game} ${jelly(picked ? 'black' : 'pearl')}`}
            style={{ '--tone': GAME_TONES[id] } as React.CSSProperties}
            onClick={() => onChange(id)}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 600, damping: 18 }}
          >
            <span className={styles.icon}>
              <Icon name={GAME_ICONS[id]} size={compact ? 30 : 38} />
            </span>
            <span className={styles.gameText}>
              <span className={styles.gameTitle}>{info.title}</span>
              <span className={styles.tagline}>{info.tagline}</span>
            </span>
            <span className={styles.meta} aria-label={`${info.min} to ${info.max} players`}>
              {info.min}–{info.max}
              <span className={styles.metaWord}> players</span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

const MODES = [
  { id: 'normal', title: 'Normal', blurb: 'Anyone can play. No medical degree required.' },
  { id: 'pro', title: 'Pro', blurb: 'Jargon, board-style questions and inside jokes. For people in healthcare.' },
] as const satisfies readonly { id: ContentMode; title: string; blurb: string }[];

const SCREENS = [
  { id: 'big', title: 'Big screen', blurb: 'Open this page on the TV, laptop or video call everyone can see.' },
  { id: 'phones', title: 'Just phones', blurb: 'No TV needed. Everyone plays on their own phone.' },
] as const;

export type ScreenChoice = (typeof SCREENS)[number]['id'];

/** Where everyone will be looking. Phones-only rooms skip the stage entirely. */
export function ScreenPicker({ value, onChange }: { value: ScreenChoice; onChange: (v: ScreenChoice) => void }) {
  return (
    <div className={styles.choice}>
      <Segmented label="Where everyone looks" options={SCREENS} value={value} onChange={onChange} />
      <p className={styles.blurb}>{SCREENS.find((s) => s.id === value)?.blurb}</p>
    </div>
  );
}

/** Who it's for. */
export function ModePicker({ value, onChange }: { value: ContentMode; onChange: (v: ContentMode) => void }) {
  return (
    <div className={styles.choice}>
      <Segmented label="Who’s playing" options={MODES} value={value} onChange={onChange} />
      <p className={styles.blurb}>{MODES.find((m) => m.id === value)?.blurb}</p>
    </div>
  );
}

export function TimeToggle({ settings, onChange }: { settings: RoomSettings; onChange: (patch: Partial<RoomSettings>) => void }) {
  return <Toggle label="More time" hint="Slower timers. Good for video calls." checked={settings.extendedTimers} onChange={(extendedTimers) => onChange({ extendedTimers })} />;
}

/** Who it's for and how much time: the lobby's settings dialog. */
export function RoomOptions({ settings, onChange }: { settings: RoomSettings; onChange: (patch: Partial<RoomSettings>) => void }) {
  return (
    <div className={styles.options}>
      <ModePicker value={settings.mode} onChange={(mode) => onChange({ mode })} />
      <TimeToggle settings={settings} onChange={onChange} />
    </div>
  );
}
