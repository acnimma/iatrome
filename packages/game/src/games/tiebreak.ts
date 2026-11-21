import { type TriviaQuestion, trivia } from '@iatrome/content';
import { TIEBREAK as TB } from '../constants';
import type { GameResult, Phase } from '../types';
import { type ActionOutcome, type BaseGameState, type GameContext, type GameModule, sawtooth, setPhase } from './context';

/**
 * The secret tie-breaker. It isn't a game anyone picks: when any game ends with players level
 * for first, the room hands the tied players a sudden-death trivia question instead of the
 * podium. The fastest right answer wins; if nobody is right, another question follows (up to
 * TB.maxQuestions, then the tie stands). Everyone else watches. The original result comes back
 * with the winner on top.
 */

type PhaseName = 'intro' | 'question' | 'reveal' | 'done';

export interface TiebreakState extends BaseGameState {
  game: 'tiebreak';
  phase: Phase<PhaseName>;
  /** The finished game's result, held until the tie is broken. */
  pending: GameResult;
  questions: TriviaQuestion[];
  index: number;
  answers: Record<string, { option: number; at: number }>;
  /** Who got the last question right, fastest first. */
  right: string[];
  winner: string | null;
}

export type TiebreakAction = { type: 'pick-option'; option: number };

export interface TiebreakView {
  game: 'tiebreak';
  phase: Phase<PhaseName>;
  number: number;
  total: number;
  /** Everyone in the tie-breaker. */
  contenders: string[];
  /** You are one of them. */
  inIt: boolean;
  question: string | null;
  options: string[];
  answer: number | null;
  fact: string | null;
  answered: string[];
  myAnswer: number | null;
  canPick: boolean;
  /** At the reveal: who was right, fastest first. */
  right: string[];
  /** Set once the tie is broken. */
  winner: string | null;
}

/** Starts a tie-breaker between `contenders`, holding `pending` until it is settled. */
export function startTiebreak(ctx: GameContext, pending: GameResult, contenders: string[]): TiebreakState {
  const state: TiebreakState = {
    game: 'tiebreak',
    playerIds: contenders,
    scores: Object.fromEntries(contenders.map((id) => [id, 0])),
    phase: { name: 'intro', startedAt: ctx.now, endsAt: null },
    pending,
    questions: sawtooth(ctx.draw(trivia, TB.maxQuestions)),
    index: 0,
    answers: {},
    right: [],
    winner: null,
  };
  setPhase(state, ctx, 'intro', TB.intro);
  return state;
}

/** The finished game's result with the tie-breaker's winner moved to first and the other leaders to second. */
export function applyTiebreak(result: GameResult, winner: string | null): GameResult {
  if (!winner) return result;
  const standings = result.standings.map((s) => ({ ...s }));
  let teams = result.teams?.map((t) => ({ ...t }));
  if (teams) {
    for (const t of teams) if (t.rank === 1) t.rank = t.members.includes(winner) ? 1 : 2;
    teams = teams.sort((a, b) => a.rank - b.rank || b.score - a.score);
    for (const s of standings) {
      const team = teams.find((t) => t.members.includes(s.playerId));
      if (team) s.rank = team.rank;
    }
  } else {
    for (const s of standings) if (s.rank === 1 && s.playerId !== winner) s.rank = 2;
  }
  standings.sort((a, b) => a.rank - b.rank || b.score - a.score);
  return {
    ...result,
    standings,
    teams,
    highlights: [{ title: 'Sudden Death', playerId: winner, detail: 'Won the tie-breaker' }, ...result.highlights].slice(0, 5),
  };
}

function ask(state: TiebreakState, ctx: GameContext) {
  state.answers = {};
  state.right = [];
  setPhase(state, ctx, 'question', TB.question, 'input');
}

function reveal(state: TiebreakState, ctx: GameContext) {
  const q = state.questions[state.index];
  state.right = state.playerIds
    .filter((id) => state.answers[id]?.option === q.answer)
    .sort((a, b) => state.answers[a].at - state.answers[b].at);
  state.winner = state.right[0] ?? null;
  setPhase(state, ctx, 'reveal', TB.reveal);
}

export const tiebreak: GameModule<TiebreakState, TiebreakAction, TiebreakView> = {
  id: 'tiebreak',
  minPlayers: 2,
  maxPlayers: 40,

  start() {
    throw new Error('A tie-breaker starts from a finished game.');
  },

  act(state, ctx, playerId, action): ActionOutcome | void {
    if (action.type !== 'pick-option') return;
    if (state.phase.name !== 'question') return { error: 'Too late!' };
    if (!state.playerIds.includes(playerId) || playerId in state.answers) return;
    if (!Number.isInteger(action.option) || action.option < 0 || action.option > 3) return;
    state.answers[playerId] = { option: action.option, at: ctx.now };
    tiebreak.settle(state, ctx);
  },

  settle(state, ctx) {
    if (state.phase.name === 'done') return;
    const here = ctx.connectedPlayers(state.playerIds);
    // Everyone else left: the last one standing takes it, or the tie stands.
    if (here.length <= 1) {
      state.winner = here[0] ?? null;
      setPhase(state, ctx, 'done', null);
      return;
    }
    if (state.phase.name === 'question' && here.every((id) => id in state.answers)) reveal(state, ctx);
  },

  timeout(state, ctx) {
    switch (state.phase.name) {
      case 'intro':
        ask(state, ctx);
        return;
      case 'question':
        reveal(state, ctx);
        return;
      case 'reveal':
        if (state.winner || state.index + 1 >= state.questions.length) {
          setPhase(state, ctx, 'done', null);
        } else {
          state.index += 1;
          ask(state, ctx);
        }
        return;
    }
  },

  result(state): GameResult | null {
    return state.phase.name === 'done' ? applyTiebreak(state.pending, state.winner) : null;
  },

  view(state, _ctx, viewer): TiebreakView {
    const q = state.questions[state.index];
    const phase = state.phase.name;
    const showing = phase === 'question' || phase === 'reveal';
    const revealed = phase === 'reveal';
    const me = viewer.kind === 'stage' ? null : viewer.id;
    const mine = me ? state.answers[me] : undefined;
    const inIt = Boolean(me && state.playerIds.includes(me));
    return {
      game: 'tiebreak',
      phase: state.phase,
      number: state.index + 1,
      total: state.questions.length,
      contenders: state.playerIds,
      inIt,
      question: showing ? q.question : null,
      options: showing ? [...q.options] : [],
      answer: revealed ? q.answer : null,
      fact: revealed ? q.fact : null,
      answered: Object.keys(state.answers),
      myAnswer: mine?.option ?? null,
      canPick: inIt && phase === 'question' && !mine,
      right: revealed ? state.right : [],
      winner: revealed ? state.winner : null,
    };
  },

  statKey: () => ({ error: 'No Stats in a tie-breaker.' }),
  statRound: () => ({ key: null, revealed: false }),
};
