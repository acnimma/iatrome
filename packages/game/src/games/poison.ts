import { type Dilemma, dilemmas } from '@iatrome/content';
import { LIMITS, POISON as PO } from '../constants';
import { cleanText } from '../text';
import type { GameResult, Highlight, Phase } from '../types';
import { type ActionOutcome, type BaseGameState, type GameContext, type GameModule, setPhase, standings, statted, tidy } from './context';

/**
 * Pick Your Poison: would you rather. Pick a side AND predict the majority.
 * Correct predictions score; one of the minority defends their choice on stage.
 */

type PhaseName = 'intro' | 'choose' | 'reveal' | 'volunteer' | 'defend' | 'defence' | 'done';
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
  /** Majority players the defence won over. */
  converts: string[];
  /** For the end-of-game awards: times in the minority, and times reading the room right. */
  minorityCount: Record<string, number>;
  readCount: Record<string, number>;
}

export type PoisonAction =
  | { type: 'pick'; side: Side }
  | { type: 'predict'; side: Side }
  | { type: 'defend'; text: string }
  | { type: 'volunteer' }
  | { type: 'convinced' };

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
  /** Majority players the defence won over (during the defence). */
  converts: string[];
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
      converts: [],
      minorityCount: {},
      readCount: {},
    };
    ctx.say('poisonIntro');
    setPhase(state, ctx, 'intro', PO.intro);
    return state;
  },

  act(state, ctx, playerId, action): ActionOutcome | void {
    if (!state.playerIds.includes(playerId)) return { error: 'Only players can pick.' };
    if (action.type === 'volunteer') {
      if (state.phase.name !== 'volunteer' || !inMinority(state, playerId)) return;
      state.defender = playerId;
      setPhase(state, ctx, 'defend', PO.defend, 'input');
      return;
    }
    if (action.type === 'convinced') {
      if (state.phase.name !== 'defence' || !state.defender || state.converts.includes(playerId)) return;
      if (state.picks[playerId]?.side !== state.majority) return { error: 'You already agree with them.' };
      state.converts.push(playerId);
      const points = statted(state, state.defender, `d${state.index}`, PO.convertPoints);
      state.scores[state.defender] += points;
      state.earned[state.defender] = (state.earned[state.defender] ?? 0) + points;
      return;
    }
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
        // The minority may volunteer a defence. Nobody gets cold-called.
        if (ctx.connectedPlayers(state.playerIds).some((id) => inMinority(state, id))) {
          ctx.say('poisonMinority');
          setPhase(state, ctx, 'volunteer', PO.volunteer, 'input');
          return;
        }
        next(state, ctx);
        return;
      case 'volunteer':
        ctx.say('noDefender');
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
    return { game: 'poison', standings: standings(ctx, state.scores), highlights: highlights(state, ctx) };
  },

  view(state, _ctx, viewer) {
    const d = state.dilemmas[state.index];
    const asking = state.phase.name !== 'intro' && state.phase.name !== 'done';
    const revealed = ['reveal', 'volunteer', 'defend', 'defence'].includes(state.phase.name);
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
      converts: state.phase.name === 'defence' ? state.converts : [],
      defence: state.phase.name === 'defence' && !state.defenceHidden ? state.defence : null,
      earned: revealed ? state.earned : {},
      mine: viewer.kind === 'stage' ? null : (state.picks[viewer.id] ?? null),
      scores: state.scores,
    };
  },

  statKey(state, _ctx, playerId) {
    if (state.phase.name !== 'choose' || !state.playerIds.includes(playerId)) return { error: 'Call it while you’re picking.' };
    return `d${state.index}`;
  },

  statRound(state) {
    const live = ['choose', 'reveal', 'volunteer', 'defend', 'defence'].includes(state.phase.name);
    return { key: live ? `d${state.index}` : null, revealed: state.phase.name !== 'choose' };
  },

};

function ask(state: PoisonState, ctx: GameContext) {
  state.picks = {};
  state.majority = null;
  state.defender = null;
  state.defence = null;
  state.defenceHidden = false;
  state.earned = {};
  state.converts = [];
  setPhase(state, ctx, 'choose', PO.choose, 'input');
}

function reveal(state: PoisonState, ctx: GameContext) {
  const sides = Object.values(state.picks).map((p) => p.side).filter(Boolean);
  const a = sides.filter((s) => s === 'a').length;
  const b = sides.filter((s) => s === 'b').length;
  state.majority = a === b ? 'tie' : a > b ? 'a' : 'b';
  // Reading a 51/49 room is harder than a 90/10 one: closeness 0 (unanimous) to 1 (dead even).
  const closeness = a + b ? 1 - Math.abs(a - b) / (a + b) : 0;
  for (const [id, p] of Object.entries(state.picks)) {
    if (!p.predict) continue;
    const base = state.majority === 'tie' ? PO.predictPoints / 2 : p.predict === state.majority ? tidy(PO.predictPoints * (1 + closeness)) : 0;
    const points = statted(state, id, `d${state.index}`, base);
    if (points) {
      state.scores[id] += points;
      state.earned[id] = points;
    }
    if (p.predict === state.majority) state.readCount[id] = (state.readCount[id] ?? 0) + 1;
    if (inMinority(state, id)) state.minorityCount[id] = (state.minorityCount[id] ?? 0) + 1;
  }
  if (sides.length > 1 && (a === 0 || b === 0)) ctx.say('poisonUnanimous');
  setPhase(state, ctx, 'reveal', PO.reveal);
}

function showDefence(state: PoisonState, ctx: GameContext) {
  if (state.defender && state.defence) {
    const points = statted(state, state.defender, `d${state.index}`, PO.defendPoints);
    state.scores[state.defender] += points;
    state.earned[state.defender] = (state.earned[state.defender] ?? 0) + points;
    setPhase(state, ctx, 'defence', PO.defence);
  } else next(state, ctx);
}

function next(state: PoisonState, ctx: GameContext) {
  if (state.index + 1 < state.dilemmas.length) {
    state.index += 1;
    ask(state, ctx);
  } else setPhase(state, ctx, 'done', null);
}

function inMinority(state: PoisonState, id: string) {
  const side = state.picks[id]?.side;
  return Boolean(side && (state.majority === 'a' || state.majority === 'b') && side !== state.majority);
}

/** End-of-game awards: who kept ending up alone, and who could read the room. */
function highlights(state: PoisonState, ctx: GameContext): Highlight[] {
  const top = (counts: Record<string, number>) =>
    Object.entries(counts)
      .filter(([id]) => ctx.person(id))
      .sort((a, b) => b[1] - a[1])[0];
  const out: Highlight[] = [];
  const contrarian = top(state.minorityCount);
  if (contrarian) out.push({ title: 'Contrarian', playerId: contrarian[0], detail: `In the minority ${contrarian[1]} of ${state.index + 1}` });
  const reader = top(state.readCount);
  if (reader) out.push({ title: 'Mind reader', playerId: reader[0], detail: `Called the room ${reader[1]} of ${state.index + 1}` });
  return out;
}
