import { type TriviaQuestion, trivia } from '@iatrome/content';
import { SURVIVE as SV } from '../constants';
import type { GameResult, Phase } from '../types';
import { type ActionOutcome, type BaseGameState, type GameContext, type GameModule, setPhase, standings, tidy } from './context';

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
  last: { lostCoffee: string[]; clockedOut: string[]; mercy: boolean; points: Record<string, number> } | null;
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
    // Easier questions first, then ramp up.
    const picked = ctx.draw(trivia, SV.maxQuestions).sort((a, b) => a.difficulty - b.difficulty);
    const state: SurviveState = {
      game: 'survive',
      playerIds,
      scores: Object.fromEntries(playerIds.map((id) => [id, 0])),
      phase: { name: 'intro', startedAt: ctx.now, endsAt: null },
      questions: picked,
      index: 0,
      coffees: Object.fromEntries(playerIds.map((id) => [id, SV.coffees])),
      clockedOut: {},
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
    return {
      game: 'survive',
      standings: standings(ctx, state.scores, order),
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
  setPhase(state, ctx, 'question', SV.question, 'input');
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

  for (const id of state.playerIds) {
    if (!ctx.person(id)) continue;
    const ghost = id in state.clockedOut;
    if (correct(id)) {
      const speed = 1 - Math.min(1, (state.answers[id].at - state.phase.startedAt) / duration);
      points[id] = tidy((SV.base + SV.speedBonus * speed) * (ghost ? SV.ghostFactor : 1));
      state.scores[id] += points[id];
    } else if (!ghost && !mercy) {
      state.coffees[id] -= 1;
      lostCoffee.push(id);
      if (state.coffees[id] <= 0) {
        state.clockedOut[id] = state.index;
        clockedOut.push(id);
      }
    }
  }

  state.last = { lostCoffee, clockedOut, mercy, points };
  if (mercy) ctx.say('surviveMercy');
  else if (clockedOut.length) ctx.say('surviveClockOut');
  setPhase(state, ctx, 'reveal', SV.reveal);
}
