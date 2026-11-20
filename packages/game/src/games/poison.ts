import { type Dilemma, dilemmas } from '@iatrome/content';
import { LIMITS, POISON as PO } from '../constants';
import { cleanText } from '../text';
import type { GameResult, Phase } from '../types';
import { type ActionOutcome, type BaseGameState, type GameContext, type GameModule, setPhase, standings } from './context';

/**
 * Pick Your Poison: would you rather. Pick a side AND predict the majority.
 * Correct predictions score; one of the minority defends their choice on stage.
 */

type PhaseName = 'intro' | 'choose' | 'reveal' | 'defend' | 'defence' | 'done';
type Side = 'a' | 'b';

export interface PoisonState extends BaseGameState {
  game: 'poison';
  phase: Phase<PhaseName>;
  dilemmas: Dilemma[];
  index: number;
  picks: Record<string, { side: Side | null; predict: Side | null }>;
  majority: Side | 'tie' | null;
  defender: string | null;
  defence: string | null;
  defenceHidden: boolean;
  earned: Record<string, number>;
}

export type PoisonAction =
  | { type: 'pick'; side: Side }
  | { type: 'predict'; side: Side }
  | { type: 'defend'; text: string };

export interface PoisonView {
  game: 'poison';
  phase: Phase<PhaseName>;
  number: number;
  total: number;
  a: string | null;
  b: string | null;
  /** Revealed counts. */
  counts: { a: number; b: number } | null;
  sides: Record<string, Side> | null;
  majority: Side | 'tie' | null;
  done: string[];
  defender: string | null;
  defence: string | null;
  earned: Record<string, number>;
  mine: { side: Side | null; predict: Side | null } | null;
  scores: Record<string, number>;
}

export const poison: GameModule<PoisonState, PoisonAction, PoisonView> = {
  id: 'poison',
  minPlayers: PO.minPlayers,
  maxPlayers: PO.maxPlayers,

  start(ctx, playerIds) {
    const state: PoisonState = {
      game: 'poison',
      playerIds,
      scores: Object.fromEntries(playerIds.map((id) => [id, 0])),
      phase: { name: 'intro', startedAt: ctx.now, endsAt: null },
      dilemmas: ctx.draw(dilemmas, PO.rounds),
      index: 0,
      picks: {},
      majority: null,
      defender: null,
      defence: null,
      defenceHidden: false,
      earned: {},
    };
    ctx.say('poisonIntro');
    setPhase(state, ctx, 'intro', PO.intro);
    return state;
  },

  act(state, ctx, playerId, action): ActionOutcome | void {
    if (!state.playerIds.includes(playerId)) return { error: 'Only players can pick.' };
    if (action.type === 'defend') {
      if (state.phase.name !== 'defend' || playerId !== state.defender) return;
      const text = cleanText(action.text, LIMITS.defence);
      if (!text) return { error: 'Say something in your defence!' };
      state.defence = text;
      showDefence(state, ctx);
      return;
    }
    if (state.phase.name !== 'choose') return { error: 'Too late!' };
    if (action.side !== 'a' && action.side !== 'b') return;
    const pick = (state.picks[playerId] ??= { side: null, predict: null });
    if (action.type === 'pick') pick.side = action.side;
    else pick.predict = action.side;
    const everyone = ctx.connectedPlayers(state.playerIds);
    if (everyone.every((id) => state.picks[id]?.side && state.picks[id]?.predict)) reveal(state, ctx);
  },

  timeout(state, ctx) {
    switch (state.phase.name) {
      case 'intro':
        ask(state, ctx);
        return;
      case 'choose':
        reveal(state, ctx);
        return;
      case 'reveal':
        if (state.majority === 'a' || state.majority === 'b') {
          const minority = ctx.connectedPlayers(state.playerIds).filter((id) => state.picks[id]?.side && state.picks[id]!.side !== state.majority);
          if (minority.length) {
            state.defender = ctx.rng.pick(minority);
            ctx.say('poisonMinority');
            setPhase(state, ctx, 'defend', PO.defend, 'input');
            return;
          }
        }
        next(state, ctx);
        return;
      case 'defend':
        showDefence(state, ctx);
        return;
      case 'defence':
        next(state, ctx);
        return;
    }
  },

  settle(state, ctx) {
    if (state.phase.name === 'choose') {
      const everyone = ctx.connectedPlayers(state.playerIds);
      if (everyone.every((id) => state.picks[id]?.side && state.picks[id]?.predict)) reveal(state, ctx);
    } else if (state.phase.name === 'defend' && state.defender && !ctx.connectedPlayers([state.defender]).length) next(state, ctx);
  },

  hide(state) {
    state.defenceHidden = true;
  },

  result(state, ctx): GameResult | null {
    if (state.phase.name !== 'done') return null;
    return { game: 'poison', standings: standings(ctx, state.scores), highlights: [] };
  },

  view(state, _ctx, viewer) {
    const d = state.dilemmas[state.index];
    const asking = state.phase.name !== 'intro' && state.phase.name !== 'done';
    const revealed = ['reveal', 'defend', 'defence'].includes(state.phase.name);
    const sides: Record<string, Side> = {};
    for (const [id, p] of Object.entries(state.picks)) if (p.side) sides[id] = p.side;
    return {
      game: 'poison',
      phase: state.phase,
      number: state.index + 1,
      total: state.dilemmas.length,
      a: asking ? d.a : null,
      b: asking ? d.b : null,
      counts: revealed ? { a: Object.values(sides).filter((s) => s === 'a').length, b: Object.values(sides).filter((s) => s === 'b').length } : null,
      sides: revealed ? sides : null,
      majority: revealed ? state.majority : null,
      done: Object.entries(state.picks).filter(([, p]) => p.side && p.predict).map(([id]) => id),
      defender: state.defender,
      defence: state.phase.name === 'defence' && !state.defenceHidden ? state.defence : null,
      earned: revealed ? state.earned : {},
      mine: viewer.kind === 'stage' ? null : (state.picks[viewer.id] ?? null),
      scores: state.scores,
    };
  },

  bot(state, ctx, botId) {
    if (state.phase.name === 'choose') {
      const p = state.picks[botId];
      if (p?.side && p?.predict) return false;
      const side = (): Side => (ctx.rng.next() < 0.5 ? 'a' : 'b');
      poison.act(state, ctx, botId, { type: 'pick', side: side() });
      poison.act(state, ctx, botId, { type: 'predict', side: side() });
      return true;
    }
    if (state.phase.name === 'defend' && state.defender === botId) {
      poison.act(state, ctx, botId, { type: 'defend', text: 'I regret nothing. Ask my attending.' });
      return true;
    }
    return false;
  },
};

function ask(state: PoisonState, ctx: GameContext) {
  state.picks = {};
  state.majority = null;
  state.defender = null;
  state.defence = null;
  state.defenceHidden = false;
  state.earned = {};
  setPhase(state, ctx, 'choose', PO.choose, 'input');
}

function reveal(state: PoisonState, ctx: GameContext) {
  const sides = Object.values(state.picks).map((p) => p.side).filter(Boolean);
  const a = sides.filter((s) => s === 'a').length;
  const b = sides.filter((s) => s === 'b').length;
  state.majority = a === b ? 'tie' : a > b ? 'a' : 'b';
  for (const [id, p] of Object.entries(state.picks)) {
    if (!p.predict) continue;
    const points = state.majority === 'tie' ? PO.predictPoints / 2 : p.predict === state.majority ? PO.predictPoints : 0;
    if (points) {
      state.scores[id] += points;
      state.earned[id] = points;
    }
  }
  if (sides.length > 1 && (a === 0 || b === 0)) ctx.say('poisonUnanimous');
  setPhase(state, ctx, 'reveal', PO.reveal);
}

function showDefence(state: PoisonState, ctx: GameContext) {
  if (state.defender && state.defence) {
    state.scores[state.defender] += PO.defendPoints;
    state.earned[state.defender] = (state.earned[state.defender] ?? 0) + PO.defendPoints;
    setPhase(state, ctx, 'defence', PO.defence);
  } else next(state, ctx);
}

function next(state: PoisonState, ctx: GameContext) {
  if (state.index + 1 < state.dilemmas.length) {
    state.index += 1;
    ask(state, ctx);
  } else setPhase(state, ctx, 'done', null);
}
