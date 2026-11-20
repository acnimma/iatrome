/** Team colours, by `Team.color`: the four palette colours first, then four more for big rooms (up to eight teams). */
export const TEAM_TONES = [
  'var(--cool-sky)',
  'var(--rose-kiss)',
  'var(--royal-gold)',
  'var(--sky-blue)',
  '#3f9d6e',
  '#b07aa1',
  '#d98b4f',
  '#8a9bb0',
] as const;

export const teamTone = (color: number) => TEAM_TONES[color % TEAM_TONES.length];
