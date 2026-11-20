import { hostLines as coreHostLines } from './packs/host-lines';
import { didacticsHostLines } from './packs/host-lines-didactics';
import { momentHostLines } from './packs/host-lines-moments';
import { quips as quipsNormal } from './packs/quips';
import { quipsPro } from './packs/quips-pro';
import { playerDifferentials as playerDifferentialsNormal, playerQuips as playerQuipsNormal } from './packs/player-prompts';
import { playerDifferentialsPro, playerQuipsPro } from './packs/player-prompts-pro';
import { doodles as doodlesNormal } from './packs/doodles';
import { doodlesPro } from './packs/doodles-pro';
import { differentials as differentialsNormal } from './packs/differentials';
import { differentialsPro } from './packs/differentials-pro';
import { dilemmas as dilemmasNormal } from './packs/dilemmas';
import { dilemmasPro } from './packs/dilemmas-pro';
import { sketchTerms as sketchTermsNormal } from './packs/sketch-terms';
import { sketchTermsPro } from './packs/sketch-terms-pro';
import { trivia as triviaNormal } from './packs/trivia';
import { triviaPro } from './packs/trivia-pro';
import type { HostEvent } from './types';

export * from './types';
export { curbsideGeneric } from './packs/curbside';

// Each pool holds both modes: `breadth` decides what Normal and Pro draw from.
export const quips = [...quipsNormal, ...quipsPro];
export const playerQuips = [...playerQuipsNormal, ...playerQuipsPro];
export const playerDifferentials = [...playerDifferentialsNormal, ...playerDifferentialsPro];
export const doodles = [...doodlesNormal, ...doodlesPro];
export const differentials = [...differentialsNormal, ...differentialsPro];
export const dilemmas = [...dilemmasNormal, ...dilemmasPro];
export const sketchTerms = [...sketchTermsNormal, ...sketchTermsPro];
export const trivia = [...triviaNormal, ...triviaPro];

export const hostLines: Record<HostEvent, string[]> = { ...coreHostLines, ...didacticsHostLines, ...momentHostLines };
