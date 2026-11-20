import { type TriviaQuestion, trivia } from '@iatrome/content';
import { SURVIVE as SV } from '../constants';
import type { GameResult, Phase } from '../types';
import { type ActionOutcome, type BaseGameState, type GameContext, type GameModule, questionTime, sawtooth, setPhase, standings, statted, tidy } from './context';

/**
 * Survive the Shift: elimination trivia. Everyone starts with two coffees; a wrong or
 * missing answer costs one. Out of coffee = clocked out (keep answering for ghost points).
 * If every survivor misses the same question, nobody loses a coffee.
 */

type PhaseName = 'intro' | 'question' | 'reveal' | 'done';

export interface SurviveState extends BaseGameState {
  game: 'survive';
  phase: Phase<PhaseName>;
  questions: TriviaQuestion[];
  index: number;
  coffees: Record<string, number>;
  /** Question number each player clocked out on. */
  clockedOut: Record<string, number>;
  answers: Record<string, { option: number; at: number }>;
  last: { lostCoffee: string[]; clockedOut: string[]; revived: string[]; mercy: boolean; points: Record<string, number> } | null;
  /** Right answers in a row while clocked out, and who has already been revived (once a game). */
  ghostStreak: Record<string, number>;
  revived: string[];
}

export type SurviveAction = { type: 'pick-option'; option: number };

export interface SurviveView {
  game: 'survive';
  phase: Phase<PhaseName>;
  number: number;
  total: number;
  question: string | null;
  options: string[];
  /** Revealed at the reveal. */
  answer: number | null;
  fact: string | null;
  /** How many picked each option (reveal only). */
  tally: number[];
  answered: string[];
  coffees: Record<string, number>;
  clockedOut: Record<string, number>;
  last: SurviveState['last'];
  myAnswer: number | null;
  scores: Record<string, number>;
}

export const survive: GameModule<SurviveState, SurviveAction, SurviveView> = {
  id: 'survive',
  minPlayers: SV.minPlayers,
  maxPlayers: SV.maxPlayers,

  start(ctx, playerIds) {
    const picked = sawtooth(ctx.draw(trivia, SV.maxQuestions));
    const state: SurviveState = {
      game: 'survive',
      playerIds,
      scores: Object.fromEntries(playerIds.map((id) => [id, 0])),
      phase: { name: 'intro', startedAt: ctx.now, endsAt: null },
      questions: picked,
      index: 0,
      coffees: Object.fromEntries(playerIds.map((id) => [id, SV.coffees])),
      clockedOut: {},
      ghostStreak: {},
      revived: [],
      answers: {},
      last: null,
    };
    ctx.say('surviveIntro');
    setPhase(state, ctx, 'intro', SV.intro);
    return state;
  },

  act(state, ctx, playerId, action): ActionOutcome | void {
    if (state.phase.name !== 'question') return { error: 'Too late!' };
    if (!state.playerIds.includes(playerId) || playerId in state.answers) return;
    if (!Number.isInteger(action.option) || action.option < 0 || action.option > 3) return;
    state.answers[playerId] = { option: action.option, at: ctx.now };
    if (ctx.connectedPlayers(state.playerIds).every((id) => id in state.answers)) reveal(state, ctx);
  },

  timeout(state, ctx) {
    switch (state.phase.name) {
      case 'intro':
        ask(state, ctx);
        return;
      case 'question':
        reveal(state, ctx);
        return;
      case 'reveal': {
        const alive = survivors(state, ctx);
        const over = (state.playerIds.length > 1 && alive.length <= 1) || state.index + 1 >= state.questions.length;
        if (over) {
          if (alive.length === 1) ctx.say('surviveLastStanding');
          setPhase(state, ctx, 'done', null);
        } else {
          state.index += 1;
          ask(state, ctx);
        }
        return;
      }
    }
  },

  settle(state, ctx) {
    if (state.phase.name === 'question' && ctx.connectedPlayers(state.playerIds).every((id) => id in state.answers)) reveal(state, ctx);
  },

  result(state, ctx): GameResult | null {
    if (state.phase.name !== 'done') return null;
    // Survivors rank first (by score), then by how long they lasted, then score.
    const order = state.playerIds
      .filter((id) => ctx.person(id))
      .sort((a, b) => {
        const outA = state.clockedOut[a] ?? Infinity;
        const outB = state.clockedOut[b] ?? Infinity;
        return outB - outA || state.scores[b] - state.scores[a];
      });
    const total = state.questions.length;
    const lasted = (id: string) => (id in state.clockedOut ? `Clocked out on question ${state.clockedOut[id] + 1}` : `Survived all ${state.index + 1} of ${total}`);
    return {
      game: 'survive',
      standings: standings(ctx, state.scores, order).map((s) => ({ ...s, note: lasted(s.playerId) })),
      highlights: [
        {
          title: 'Questions survived',
          playerId: order[0] ?? null,
          detail: `${state.index + 1} of ${state.questions.length}`,
        },
      ],
    };
  },

  view(state, _ctx, viewer) {
    const q = state.questions[state.index];
    const showing = state.phase.name === 'question' || state.phase.name === 'reveal';
    const revealed = state.phase.name === 'reveal';
    const tally = [0, 0, 0, 0];
    if (revealed) for (const a of Object.values(state.answers)) tally[a.option] += 1;
    return {
      game: 'survive',
      phase: state.phase,
      number: state.index + 1,
      total: state.questions.length,
      question: showing ? q.question : null,
      options: showing ? [...q.options] : [],
      answer: revealed ? q.answer : null,
      fact: revealed ? q.fact : null,
      tally,
      answered: Object.keys(state.answers),
      coffees: state.coffees,
      clockedOut: state.clockedOut,
      last: revealed ? state.last : null,
      myAnswer: viewer.kind === 'stage' ? null : (state.answers[viewer.id]?.option ?? null),
      scores: state.scores,
    };
  },

  statKey(state, _ctx, playerId) {
    if (state.phase.name !== 'question' || !state.playerIds.includes(playerId)) return { error: 'Call it while a question is up.' };
    return `q${state.index}`;
  },

  statRound(state) {
    return { key: `q${state.index}`, revealed: state.phase.name === 'reveal' };
  },

  bot(state, ctx, botId) {
    if (state.phase.name !== 'question' || botId in state.answers || !state.playerIds.includes(botId)) return false;
    const q = state.questions[state.index];
    survive.act(state, ctx, botId, { type: 'pick-option', option: ctx.rng.next() < 0.6 ? q.answer : ctx.rng.int(4) });
    return true;
  },
};

function survivors(state: SurviveState, ctx: GameContext) {
  return state.playerIds.filter((id) => ctx.person(id) && !(id in state.clockedOut));
}

function ask(state: SurviveState, ctx: GameContext) {
  state.answers = {};
  state.last = null;
  const q = state.questions[state.index];
  setPhase(state, ctx, 'question', questionTime(SV.question, q.question, q.options), 'input');
}

function reveal(state: SurviveState, ctx: GameContext) {
  const q = state.questions[state.index];
  const duration = (state.phase.endsAt ?? ctx.now) - state.phase.startedAt || 1;
  const alive = survivors(state, ctx);
  const correct = (id: string) => state.answers[id]?.option === q.answer;
  const mercy = alive.length > 1 && alive.every((id) => !correct(id));
  const points: Record<string, number> = {};
  const lostCoffee: string[] = [];
  const clockedOut: string[] = [];
  const revived: string[] = [];
  // A phone that dropped out is on break: no coffee lost for a question it never saw.
  const here = new Set(state.playerIds.filter((id) => ctx.person(id)?.connected || id in state.answers));

  for (const id of state.playerIds) {
    if (!ctx.person(id)) continue;
    const ghost = id in state.clockedOut;
    if (correct(id)) {
      const speed = 1 - Math.min(1, (state.answers[id].at - state.phase.startedAt) / duration);
      points[id] = statted(state, id, `q${state.index}`, tidy((SV.base + SV.speedBonus * speed) * (ghost ? SV.ghostFactor : 1)));
      state.scores[id] += points[id];
      if (ghost) {
        state.ghostStreak[id] = (state.ghostStreak[id] ?? 0) + 1;
        if (state.ghostStreak[id] >= SV.ghostRevive && !state.revived.includes(id)) {
          delete state.clockedOut[id];
          state.coffees[id] = 1;
          state.revived.push(id);
          revived.push(id);
        }
      }
    } else if (ghost) {
      state.ghostStreak[id] = 0;
    } else if (!mercy && here.has(id)) {
      state.coffees[id] -= 1;
      lostCoffee.push(id);
      if (state.coffees[id] <= 0) {
        state.clockedOut[id] = state.index;
        clockedOut.push(id);
      }
    }
  }

  state.last = { lostCoffee, clockedOut, revived, mercy, points };
  if (revived.length) ctx.say('ghostRevive');
  else if (mercy) ctx.say('surviveMercy');
  else if (clockedOut.length) ctx.say('surviveClockOut');
  setPhase(state, ctx, 'reveal', SV.reveal);
}
