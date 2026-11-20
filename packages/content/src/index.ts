export * from './types';
export { quips } from './packs/quips';
export { playerQuips, playerDifferentials } from './packs/player-prompts';
export { curbsideGeneric } from './packs/curbside';
export { doodles } from './packs/doodles';
export { differentials } from './packs/differentials';
export { dilemmas } from './packs/dilemmas';
export { sketchTerms } from './packs/sketch-terms';
export { trivia } from './packs/trivia';
import { hostLines as coreHostLines } from './packs/host-lines';
import { didacticsHostLines } from './packs/host-lines-didactics';
import type { HostEvent } from './types';

export const hostLines: Record<HostEvent, string[]> = { ...coreHostLines, ...didacticsHostLines };
