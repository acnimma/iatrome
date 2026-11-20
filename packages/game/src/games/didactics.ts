import { type TriviaQuestion, trivia } from '@iatrome/content';
import { DIDACTICS as DC } from '../constants';
import type { GameResult, Phase } from '../types';
import { type ActionOutcome, type BaseGameState, type GameContext, type GameModule, questionTime, sawtooth, setPhase, statted, tidy } from './context';

/**
 * Didactics Mode: team trivia for big groups (up to 40). Random teams; everyone
 * answers on their phone; a team scores by the share of its members who got it right,
 * so team sizes stay fair. The last questions are a double-points lightning round.
 * Late arrivals join the smallest team.
 */

type PhaseName = 'intro' | 'teams' | 'question' | 'reveal' | 'standings' | 'done';

export interface Team {
  id: string;
  name: string;
  /** Index into the team colours (cool sky, rose, gold, sky blue). */
  color: number;
  members: string[];
}

export interface DidacticsState extends BaseGameState {
  game: 'didactics';
  phase: Phase<PhaseName>;
  teams: Team[];
  teamScores: Record<string, number>;
  questions: TriviaQuestion[];
  index: number;
  /** `switched`: they changed their answer after seeing their team's split (once per question). */
  answers: Record<string, { option: number; at: number; switched?: boolean }>;
  /** Right answers per player, for the MVP. */
  correct: Record<string, number>;
  last: { perTeam: Record<string, { right: number; of: number; points: number }> } | null;
}

export type DidacticsAction = { type: 'pick-option'; option: number };

export interface DidacticsView {
  game: 'didactics';
  phase: Phase<PhaseName>;
  number: number;
  total: number;
  lightning: boolean;
  question: string | null;
  options: string[];
  answer: number | null;
  fact: string | null;
  tally: number[];
  answered: string[];
  teams: (Team & { score: number })[];
  last: DidacticsState['last'];
  myTeam: string | null;
  myAnswer: number | null;
  mySwitched: boolean;
  /** Your team's answers so far, per option (after you lock in). */
  teamPicks: number[] | null;
}

const TEAM_NAMES = ['The Band-Aids', 'The Lollipops', 'The Stethoscopes', 'The Thermometers'];

export const didactics: GameModule<DidacticsState, DidacticsAction, DidacticsView> = {
  id: 'didactics',
  minPlayers: DC.minPlayers,
  maxPlayers: DC.maxPlayers,

  start(ctx, playerIds) {
    const count = playerIds.length <= 7 ? 2 : playerIds.length <= 15 ? 3 : 4;
    const teams: Team[] = TEAM_NAMES.slice(0, count).map((name, i) => ({ id: `t${i}`, name, color: i, members: [] }));
    ctx.rng.shuffle(playerIds).forEach((id, i) => teams[i % count].members.push(id));
    const state: DidacticsState = {
      game: 'didactics',
      playerIds,
      scores: Object.fromEntries(playerIds.map((id) => [id, 0])),
      phase: { name: 'intro', startedAt: ctx.now, endsAt: null },
      teams,
      teamScores: Object.fromEntries(teams.map((t) => [t.id, 0])),
      questions: sawtooth(ctx.draw(trivia, DC.questions)),
      index: 0,
      answers: {},
      correct: {},
      last: null,
    };
    ctx.say('didacticsIntro');
    setPhase(state, ctx, 'intro', DC.intro);
    return state;
  },

  addPlayer(state, _ctx, playerId) {
    if (state.playerIds.includes(playerId)) return;
    const smallest = state.teams.reduce((a, b) => (b.members.length < a.members.length ? b : a));
    smallest.members.push(playerId);
    state.playerIds.push(playerId);
    state.scores[playerId] = 0;
  },

  act(state, ctx, playerId, action): ActionOutcome | void {
    if (state.phase.name !== 'question') return { error: 'Too late!' };
    if (!state.playerIds.includes(playerId)) return;
    if (!Number.isInteger(action.option) || action.option < 0 || action.option > 3) return;
    const before = state.answers[playerId];
    if (before) {
      // One change of heart per question, after seeing how the team split. Speed resets.
      if (before.switched || before.option === action.option) return;
      state.answers[playerId] = { option: action.option, at: ctx.now, switched: true };
      return;
    }
    state.answers[playerId] = { option: action.option, at: ctx.now };
    didactics.settle(state, ctx);
  },

  settle(state, ctx) {
    if (state.phase.name === 'question' && ctx.connectedPlayers(state.playerIds).every((id) => id in state.answers)) reveal(state, ctx);
  },

  timeout(state, ctx) {
    switch (state.phase.name) {
      case 'intro':
        setPhase(state, ctx, 'teams', DC.teams);
        return;
      case 'teams':
        ask(state, ctx);
        return;
      case 'question':
        reveal(state, ctx);
        return;
      case 'reveal': {
        const next = state.index + 1;
        if (next >= state.questions.length) setPhase(state, ctx, 'done', null);
        else if (next % DC.standingsEvery === 0) {
          ctx.say(next === state.questions.length - DC.lightning ? 'didacticsLightning' : 'scoreboard');
          setPhase(state, ctx, 'standings', DC.standings);
        } else {
          state.index = next;
          ask(state, ctx);
        }
        return;
      }
      case 'standings':
        state.index += 1;
        ask(state, ctx);
        return;
    }
  },

  result(state, ctx): GameResult | null {
    if (state.phase.name !== 'done') return null;
    const ranked = state.teams.slice().sort((a, b) => state.teamScores[b.id] - state.teamScores[a.id]);
    const rankOf = new Map(ranked.map((t, i) => [t.id, i + 1 - (i > 0 && state.teamScores[t.id] === state.teamScores[ranked[i - 1].id] ? 1 : 0)]));
    const teamOf = (id: string) => state.teams.find((t) => t.members.includes(id))!;
    const players = state.playerIds
      .filter((id) => ctx.person(id))
      .sort((a, b) => state.teamScores[teamOf(b).id] - state.teamScores[teamOf(a).id] || state.scores[b] - state.scores[a]);
    const mvp = players.slice().sort((a, b) => (state.correct[b] ?? 0) - (state.correct[a] ?? 0) || state.scores[b] - state.scores[a])[0];
    return {
      game: 'didactics',
      standings: players.map((id) => {
        const p = ctx.person(id)!;
        return { playerId: id, name: p.name, avatar: p.avatar, score: state.scores[id], rank: rankOf.get(teamOf(id).id)! };
      }),
      teams: ranked.map((t) => ({ name: t.name, color: t.color, score: state.teamScores[t.id], rank: rankOf.get(t.id)!, members: t.members.filter((id) => ctx.person(id)) })),
      highlights: mvp
        ? [{ title: 'MVP', playerId: mvp, detail: `${state.correct[mvp] ?? 0} of ${state.questions.length} right` }]
        : [],
    };
  },

  view(state, _ctx, viewer) {
    const q = state.questions[state.index];
    const showing = state.phase.name === 'question' || state.phase.name === 'reveal';
    const revealed = state.phase.name === 'reveal';
    const tally = [0, 0, 0, 0];
    if (revealed) for (const a of Object.values(state.answers)) tally[a.option] += 1;
    const me = viewer.kind === 'stage' ? null : viewer.id;
    return {
      game: 'didactics',
      phase: state.phase,
      number: state.index + 1,
      total: state.questions.length,
      lightning: isLightning(state),
      question: showing ? q.question : null,
      options: showing ? [...q.options] : [],
      answer: revealed ? q.answer : null,
      fact: revealed ? q.fact : null,
      tally,
      answered: Object.keys(state.answers),
      teams: state.teams.map((t) => ({ ...t, score: state.teamScores[t.id] })),
      last: revealed ? state.last : null,
      myTeam: me ? (state.teams.find((t) => t.members.includes(me))?.id ?? null) : null,
      myAnswer: me ? (state.answers[me]?.option ?? null) : null,
      mySwitched: me ? Boolean(state.answers[me]?.switched) : false,
      teamPicks: me && state.phase.name === 'question' && state.answers[me] ? teamPicks(state, me) : null,
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

const isLightning = (state: DidacticsState) => state.index >= state.questions.length - DC.lightning;

function ask(state: DidacticsState, ctx: GameContext) {
  state.answers = {};
  state.last = null;
  const q = state.questions[state.index];
  setPhase(state, ctx, 'question', questionTime(DC.question, q.question, q.options), 'input');
}

/** How the viewer's team has answered so far (only shown once they've locked in). */
function teamPicks(state: DidacticsState, me: string) {
  const team = state.teams.find((t) => t.members.includes(me));
  const counts = [0, 0, 0, 0];
  for (const id of team?.members ?? []) if (state.answers[id]) counts[state.answers[id].option] += 1;
  return counts;
}

function reveal(state: DidacticsState, ctx: GameContext) {
  const q = state.questions[state.index];
  const multiplier = isLightning(state) ? 2 : 1;
  const duration = (state.phase.endsAt ?? ctx.now) - state.phase.startedAt || 1;
  const perTeam: Record<string, { right: number; of: number; points: number }> = {};

  for (const id of state.playerIds) {
    const a = state.answers[id];
    if (a?.option !== q.answer) continue;
    state.correct[id] = (state.correct[id] ?? 0) + 1;
    const speed = 1 - Math.min(1, (a.at - state.phase.startedAt) / duration);
    state.scores[id] += statted(state, id, `q${state.index}`, tidy((DC.base + DC.speedBonus * speed) * multiplier));
  }

  for (const team of state.teams) {
    // Count everyone still here; a teammate who never answers counts as a miss.
    const present = ctx.connectedPlayers(team.members);
    const rightIds = present.filter((id) => state.answers[id]?.option === q.answer);
    const right = rightIds.length;
    // A Stat makes its caller's right answer count twice for the team.
    const counted = rightIds.reduce((n, id) => n + statted(state, id, `q${state.index}`, 1), 0);
    const points = present.length ? tidy((DC.pool * counted * multiplier) / present.length) : 0;
    state.teamScores[team.id] += points;
    perTeam[team.id] = { right, of: present.length, points };
  }

  state.last = { perTeam };
  const best = Math.max(...Object.values(perTeam).map((t) => (t.of ? t.right / t.of : 0)));
  if (best === 0) ctx.say('didacticsStumped');
  setPhase(state, ctx, 'reveal', DC.reveal);
}
