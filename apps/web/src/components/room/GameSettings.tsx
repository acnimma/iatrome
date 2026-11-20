'use client';

import { motion } from 'motion/react';
import { type GameId, type RoomSettings, gameInfo } from '@iatrome/game/client';
import { Toggle } from '@/components/ui/Toggle';
import styles from './GameSettings.module.css';

const GAME_ICONS: Record<GameId, string> = { 'grand-rounds': '🎤', sketchy: '✏️', survive: '☕', poison: '🧪' };
const GAME_TONES: Record<GameId, string> = {
  'grand-rounds': 'var(--rose-kiss)',
  sketchy: 'var(--cool-sky)',
  survive: 'var(--royal-gold)',
  poison: 'var(--sky-blue)',
};

/** Pick a game. */
export function GamePicker({ value, onChange, compact }: { value: GameId; onChange: (g: GameId) => void; compact?: boolean }) {
  return (
    <div className={`${styles.games} ${compact ? styles.compact : ''}`} role="radiogroup" aria-label="Game">
      {(Object.keys(gameInfo) as GameId[]).map((id) => {
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
            whileTap={{ scale: 0.96 }}
            animate={{ y: picked ? -4 : 0 }}
          >
            <span className={styles.icon}>{GAME_ICONS[id]}</span>
            <span className={styles.gameText}>
              <span className={styles.gameTitle}>{info.title}</span>
              {!compact && <span className={styles.tagline}>{info.tagline}</span>}
              <span className={styles.meta}>
                {info.min}–{info.max} players · ~{info.minutes} min
              </span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

/** Room options. Only shows what matters for the chosen game. */
export function RoomOptions({ settings, onChange }: { settings: RoomSettings; onChange: (patch: Partial<RoomSettings>) => void }) {
  return (
    <div className={styles.options}>
      {settings.game === 'grand-rounds' && (
        <Toggle label="Doodle prompts" hint="Round 2 mixes in drawing duels." checked={settings.doodles} onChange={(doodles) => onChange({ doodles })} />
      )}
      {settings.game === 'sketchy' && (
        <Toggle
          label="Everyone draws twice"
          hint="Longer game, more chaos."
          checked={settings.sketchTurns === 2}
          onChange={(on) => onChange({ sketchTurns: on ? 2 : 1 })}
        />
      )}
      <Toggle
        label="Extended timers"
        hint="×1.5 time to write and vote. Use this on Zoom."
        checked={settings.extendedTimers}
        onChange={(extendedTimers) => onChange({ extendedTimers })}
      />
      <Toggle
        label="Clinical-life prompts"
        hint="Adds jokes that land best with ward or clinic time."
        checked={settings.breadth === 'all'}
        onChange={(on) => onChange({ breadth: on ? 'all' : 'universal' })}
      />
      <Toggle
        label="Clean mode"
        hint="Also blocks swearing (slurs are always blocked)."
        checked={settings.filter === 'clean'}
        onChange={(on) => onChange({ filter: on ? 'clean' : 'standard' })}
      />
      <Toggle
        label="Audience"
        hint="Late joiners can watch and vote."
        checked={settings.audience}
        onChange={(audience) => onChange({ audience })}
      />
      <Toggle
        label="First player can start"
        hint="Handy when the stage is a TV."
        checked={settings.playersCanStart}
        onChange={(playersCanStart) => onChange({ playersCanStart })}
      />
    </div>
  );
}
