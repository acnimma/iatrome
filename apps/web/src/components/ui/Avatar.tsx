import { AVATARS } from '@iatrome/game/client';
import styles from './Avatar.module.css';

/** Avatar badge colours cycle through the palette. */
const TONES = ['var(--cool-sky)', 'var(--rose-kiss)', 'var(--royal-gold)', 'var(--sky-blue)', '#e4ddd2'];

export const avatarTone = (avatar: number) => TONES[avatar % TONES.length];

interface Props {
  avatar: number;
  size?: number;
  name?: string;
  dim?: boolean;
  badge?: React.ReactNode;
  className?: string;
}

/** An emoji on a glossy coloured badge. */
export function Avatar({ avatar, size = 48, name, dim, badge, className }: Props) {
  return (
    <span className={`${styles.wrap} ${dim ? styles.dim : ''} ${className ?? ''}`} style={{ '--size': `${size}px` } as React.CSSProperties}>
      <span className={styles.badge} style={{ background: avatarTone(avatar) }} aria-hidden>
        <span className={styles.emoji}>{AVATARS[avatar % AVATARS.length]}</span>
        {badge && <span className={styles.corner}>{badge}</span>}
      </span>
      {name && <span className={styles.name}>{name}</span>}
    </span>
  );
}
