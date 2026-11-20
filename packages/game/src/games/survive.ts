import { type TriviaQuestion, trivia } from '@iatrome/content';
import { SURVIVE as SV } from '../constants';
import type { GameResult, Highlight, Phase } from '../types';
import { type ActionOutcome, type BaseGameState, type GameContext, type GameModule, questionTime, sawtooth, setPhase, standings, statted, tidy } from './context';

/**
 * Survive the Shift: elimination trivia. Everyone starts with two coffees; a wrong or
 * missing answer costs one. Out of coffee = clocked out: keep answering as a ghost for
 * a share of the points, and two right in a row puts you back on shift.
 *
 * Everyone plays every question. Staying on shift pays (shift pay each question), but the
 * best player overall wins: the last questions are Sign-out, a final chase where ghosts
 * play at full value, the multipliers climb and the leader loses their speed bonus.
 */

type PhaseName = 'intro' | 'question' | 'reveal' | 'chase' | 'done';

export interface SurviveState extends BaseGameState {
  game: 'survive';
  phase: Phase<PhaseName>;
  questions: TriviaQuestion[];
  index: number;
  coffees: Record<string, number>;
  /** Question number each player clocked out on. */
  clockedOut: Record<string, number>;
  answers: Record<string, { option: number; at: number }>;
  last: SurviveLast | null;
  /** Right answers in a row while clocked out, and who has been revived (as often as they earn it). */
  ghostStreak: Record<string, number>;
  revived: string[];
  /** Points scored while clocked out (for the Best ghost award). */
  ghostPoints: Record<string, number>;
  /** Leaders at the start of a Sign-out question: no speed bonus for them. */
  handicap: string[];
  chaseAnnounced: boolean;
  lastStandingSaid: boolean;
}

export interface SurviveLast {
  lostCoffee: string[];
  clockedOut: string[];
  revived: string[];
  mercy: boolean;
  /** Points for a right answer. */
  points: Record<string, number>;
  /** Shift pay: everyone still on shift after the question. */
  pay: Record<string, number>;
}

export type SurviveAction = { type: 'pick-option'; option: number };

export interface SurviveView {
  game: 'survive';
  phase: Phase<PhaseName>;
  number: number;
  total: number;
  /** Sign-out: the final chase. Everyone plays at full value. */
  chase: boolean;
  /** Questions in the chase, and which of them this is (1-based, 0 before the chase). */
  chaseLength: number;
  chaseStep: number;
  /** This question's multiplier (1 before the chase). */
  multiplier: number;
  /** The chase's multipliers, in order, for the intro card. */
  chaseFactors: number[];
  /** Leaders playing this question without a speed bonus. */
  handicap: string[];
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
  ghostStreak: Record<string, number>;
  last: SurviveLast | null;
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
      ghostPoints: {},
      handicap: [],
      chaseAnnounced: false,
      lastStandingSaid: false,
      answers: {},
      last: null,
    };
    ctx.say('surviveIntro');
    setPhase(state, ctx, 'intro', SV.intro);
    return state;
  },

  act(state, ctx, playerId, action): ActionOutcome | void {
    if (action.type !== 'pick-option') return;
    if (state.phase.name !== 'question') return { error: 'Too late!' };
    if (!state.playerIds.includes(playerId) || playerId in state.answers) return;
    if (!Number.isInteger(action.option) || action.option < 0 || action.option > 3) return;
    state.answers[playerId] = { option: action.option, at: ctx.now };
    if (ctx.connectedPlayers(state.playerIds).every((id) => id in state.answers)) reveal(state, ctx);
  },

  timeout(state, ctx) {
    switch (state.phase.name) {
      case 'intro':
        goTo(state, ctx, 0);
        return;
      case 'chase':
        ask(state, ctx);
        return;
      case 'question':
        reveal(state, ctx);
        return;
      case 'reveal': {
        // Everyone plays every question; ghosts are still playing. Only an empty room ends it early.
        const over = state.index + 1 >= state.questions.length || ctx.connectedPlayers(state.playerIds).length === 0;
        if (over) setPhase(state, ctx, 'done', null);
        else goTo(state, ctx, state.index + 1);
        return;
      }
    }
  },

  settle(state, ctx) {
    if (state.phase.name === 'question' && ctx.connectedPlayers(state.playerIds).every((id) => id in state.answers)) reveal(state, ctx);
  },

  result(state, ctx): GameResult | null {
    if (state.phase.name !== 'done') return null;
    const total = state.questions.length;
    const note = (id: string) => {
      if (id in state.clockedOut) return `Clocked out on question ${state.clockedOut[id] + 1}`;
      return state.revived.includes(id) ? 'Made sign-out, eventually' : `On shift all ${total}`;
    };
    return {
      game: 'survive',
      standings: standings(ctx, state.scores).map((s) => ({ ...s, note: note(s.playerId) })),
      highlights: highlights(state, ctx),
    };
  },

  view(state, _ctx, viewer) {
    const q = state.questions[state.index];
    const showing = state.phase.name === 'question' || state.phase.name === 'reveal';
    const revealed = state.phase.name === 'reveal';
    const tally = [0, 0, 0, 0];
    if (revealed) for (const a of Object.values(state.answers)) tally[a.option] += 1;
    const start = chaseStart(state);
    const chase = state.index >= start && state.phase.name !== 'intro';
    return {
      game: 'survive',
      phase: state.phase,
      number: state.index + 1,
      total: state.questions.length,
      chase,
      chaseLength: state.questions.length - start,
      chaseStep: chase ? state.index - start + 1 : 0,
      multiplier: multiplier(state),
      chaseFactors: [...SV.chaseFactors].slice(0, state.questions.length - start),
      handicap: chase ? state.handicap : [],
      question: showing ? q.question : null,
      options: showing ? [...q.options] : [],
      answer: revealed ? q.answer : null,
      fact: revealed ? q.fact : null,
      tally,
      answered: Object.keys(state.answers),
      coffees: state.coffees,
      clockedOut: state.clockedOut,
      ghostStreak: state.ghostStreak,
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
};

/** The first question of Sign-out, the final chase. */
const chaseStart = (state: SurviveState) => Math.max(0, state.questions.length - SV.chaseFactors.length);

const multiplier = (state: SurviveState) => {
  const k = state.index - chaseStart(state);
  return k >= 0 ? SV.chaseFactors[k] : 1;
};

function survivors(state: SurviveState, ctx: GameContext) {
  return state.playerIds.filter((id) => ctx.person(id) && !(id in state.clockedOut));
}

/** Move to a question, stopping for the Sign-out card on the way into the chase. */
function goTo(state: SurviveState, ctx: GameContext, index: number) {
  state.index = index;
  if (index === chaseStart(state) && !state.chaseAnnounced) {
    state.chaseAnnounced = true;
    state.answers = {};
    state.last = null;
    ctx.say('surviveChase');
    setPhase(state, ctx, 'chase', SV.chaseIntro);
    return;
  }
  ask(state, ctx);
}

function ask(state: SurviveState, ctx: GameContext) {
  state.answers = {};
  state.last = null;
  if (state.index >= chaseStart(state)) {
    // The leader plays the chase without a speed bonus. Ties at the top share the handicap.
    const ids = state.playerIds.filter((id) => ctx.person(id));
    const top = Math.max(0, ...ids.map((id) => state.scores[id] ?? 0));
    state.handicap = top > 0 ? ids.filter((id) => state.scores[id] === top) : [];
  } else state.handicap = [];
  const q = state.questions[state.index];
  setPhase(state, ctx, 'question', questionTime(SV.question, q.question, q.options), 'input');
}

function reveal(state: SurviveState, ctx: GameContext) {
  const q = state.questions[state.index];
  const duration = (state.phase.endsAt ?? ctx.now) - state.phase.startedAt || 1;
  const alive = survivors(state, ctx);
  const chase = state.index >= chaseStart(state);
  const factor = multiplier(state);
  const correct = (id: string) => state.answers[id]?.option === q.answer;
  // Mercy is for big groups early on: never with two or fewer on shift, never in the chase.
  const mercy = !chase && alive.length >= SV.mercyFrom && alive.every((id) => !correct(id));
  const points: Record<string, number> = {};
  const pay: Record<string, number> = {};
  const lostCoffee: string[] = [];
  const clockedOut: string[] = [];
  const revived: string[] = [];
  // A phone that dropped out is on break: no coffee lost (or shift pay earned) for a question it never saw.
  const here = new Set(state.playerIds.filter((id) => ctx.person(id)?.connected || id in state.answers));

  for (const id of state.playerIds) {
    if (!ctx.person(id)) continue;
    const ghost = id in state.clockedOut;
    if (correct(id)) {
      const speed = state.handicap.includes(id) ? 0 : 1 - Math.min(1, (state.answers[id].at - state.phase.startedAt) / duration);
      // Ghosts score at a reduced rate, except in the chase, where everyone plays for full value.
      const rate = chase ? factor : ghost ? SV.ghostFactor : 1;
      points[id] = statted(state, id, `q${state.index}`, tidy((SV.base + SV.speedBonus * speed) * rate));
      state.scores[id] += points[id];
      if (ghost) {
        state.ghostPoints[id] = (state.ghostPoints[id] ?? 0) + points[id];
        state.ghostStreak[id] = (state.ghostStreak[id] ?? 0) + 1;
        if (state.ghostStreak[id] >= SV.ghostRevive) {
          delete state.clockedOut[id];
          state.coffees[id] = 1;
          state.ghostStreak[id] = 0;
          if (!state.revived.includes(id)) state.revived.push(id);
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

  // Shift pay: made it through the question still on shift.
  for (const id of alive) {
    if (id in state.clockedOut || !here.has(id)) continue;
    pay[id] = SV.shiftPay;
    state.scores[id] += SV.shiftPay;
  }

  state.last = { lostCoffee, clockedOut, revived, mercy, points, pay };
  const left = survivors(state, ctx).length;
  // One clock-out gets named; several at once get the group line (the stage shows them all).
  if (clockedOut.length === 1) ctx.say('surviveOut', { name: ctx.person(clockedOut[0])?.name ?? 'Someone' }, SV.outLineDelay);
  else if (clockedOut.length) ctx.say('surviveClockOut', {}, SV.outLineDelay);
  else if (revived.length) ctx.say('ghostRevive');
  else if (mercy) ctx.say('surviveMercy');
  else if (left === 1 && state.playerIds.length > 2 && !state.lastStandingSaid) {
    state.lastStandingSaid = true;
    ctx.say('surviveLastStanding');
  }
  setPhase(state, ctx, 'reveal', SV.reveal + (clockedOut.length ? SV.outScene : 0));
}

/** End-of-game awards: the best of those who stayed on shift, and the best ghost. */
function highlights(state: SurviveState, ctx: GameContext): Highlight[] {
  const out: Highlight[] = [];
  const present = state.playerIds.filter((id) => ctx.person(id));
  const stayed = present.filter((id) => !(id in state.clockedOut) && !state.revived.includes(id));
  const iron = stayed.sort((a, b) => state.scores[b] - state.scores[a] || state.coffees[b] - state.coffees[a])[0];
  if (iron) out.push({ title: 'Never clocked out', playerId: iron, detail: `${state.coffees[iron]} ${state.coffees[iron] === 1 ? 'coffee' : 'coffees'} left at sign-out` });
  const ghost = present.filter((id) => (state.ghostPoints[id] ?? 0) > 0).sort((a, b) => state.ghostPoints[b] - state.ghostPoints[a])[0];
  if (ghost) out.push({ title: 'Best ghost', playerId: ghost, detail: `${state.ghostPoints[ghost].toLocaleString('en-US')} points while clocked out` });
  if (!out.length) out.push({ title: 'Questions survived', playerId: null, detail: `${state.index + 1} of ${state.questions.length}` });
  return out;
}
