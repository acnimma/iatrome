/** Team colours, by `Team.color`: cool sky, rose, gold, sky blue. */
export const TEAM_TONES = ['var(--cool-sky)', 'var(--rose-kiss)', 'var(--royal-gold)', 'var(--sky-blue)'] as const;

export const teamTone = (color: number) => TEAM_TONES[color % TEAM_TONES.length];

export const LETTERS = ['A', 'B', 'C', 'D'] as const;
