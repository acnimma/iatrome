import { type TriviaQuestion, trivia } from '@iatrome/content';
import { DIDACTICS as DC } from '../constants';
import type { GameResult, Highlight, Phase } from '../types';
import { type ActionOutcome, type BaseGameState, type GameContext, type GameModule, questionTime, sawtooth, setPhase, statted, tidy } from './context';

/**
 * Didactics Mode: team trivia for big groups (up to 40). Random teams of about five;
 * everyone answers on their phone; a team scores by the share of its members who got it
 * right, so team sizes stay fair. After each answer window, a short huddle shows each team
 * its own split and everyone may switch once. Then a lightning round (short clock, double
 * points, no huddle), and a final question with a wager from each team's captain.
 * Late arrivals join the smallest team.
 */

type PhaseName = 'intro' | 'teams' | 'question' | 'huddle' | 'reveal' | 'standings' | 'lightning' | 'wager' | 'done';

export interface Team {
  id: string;
  name: string;
  /** Index into the team colours. */
  color: number;
  members: string[];
}

interface Answer {
  option: number;
  at: number;
  /** 0 to 1: how much of the clock was left. Huddle answers and switches score no speed. */
  speed: number;
  /** They changed their answer in the huddle (once per question); `from` was the first pick. */
  switched?: boolean;
  from?: number;
}

interface TeamWager {
  captain: string;
  /** Share of the team's score, from DC.wagers; null until the captain picks. */
  pct: number | null;
}

interface TeamResult {
  right: number;
  of: number;
  points: number;
  /** The final question only: what the captain bet and how it went. */
  wager?: { pct: number; amount: number; swing: number };
}

export interface DidacticsState extends BaseGameState {
  game: 'didactics';
  phase: Phase<PhaseName>;
  teams: Team[];
  teamScores: Record<string, number>;
  questions: TriviaQuestion[];
  index: number;
  answers: Record<string, Answer>;
  /** Right answers per player, for the MVP. */
  correct: Record<string, number>;
  /** For the end awards. */
  carry: Record<string, number>;
  fastWrong: Record<string, number>;
  talkedOut: Record<string, number>;
  talkedIn: Record<string, number>;
  wager: Record<string, TeamWager> | null;
  last: { perTeam: Record<string, TeamResult> } | null;
}

/** One action: pick an answer, or (a captain, during the wager) pick a share of DC.wagers. */
export type DidacticsAction = { type: 'pick-option'; option: number };

export interface DidacticsView {
  game: 'didactics';
  phase: Phase<PhaseName>;
  number: number;
  total: number;
  lightning: boolean;
  /** The final, wagered question. */
  final: boolean;
  question: string | null;
  options: string[];
  answer: number | null;
  fact: string | null;
  tally: number[];
  /** The most popular wrong answer, at the reveal. */
  callout: { option: number; count: number } | null;
  answered: string[];
  /** How many switched in this huddle (the stage shows the count, never the splits). */
  switches: number;
  teams: (Team & { score: number })[];
  last: DidacticsState['last'];
  myTeam: string | null;
  myAnswer: number | null;
  mySwitched: boolean;
  /** You may still answer or switch (only in the huddle once you've answered). */
  canPick: boolean;
  /** Your team's answers per option, during the huddle and the reveal. */
  teamPicks: number[] | null;
  /** The final wager: per team, the captain and whether they've bet (the share only for your own team, or once revealed). */
  wager: {
    options: readonly number[];
    difficulty: number;
    teams: Record<string, { captain: string; picked: boolean; pct: number | null; stake: number }>;
  } | null;
  youCaptain: boolean;
}

/** Deadpan medical team names; a random few each game. */
const TEAM_NAMES = [
  'The Night Shift',
  'Sterile Field',
  'Second Opinion',
  'Stat Pack',
  'Prior Auth',
  'Waiting Room',
  'Off Label',
  'Nil by Mouth',
  'Bedside Manner',
  'Rounding Error',
  'Clean Catch',
  'Copay Due',
];

export const didactics: GameModule<DidacticsState, DidacticsAction, DidacticsView> = {
  id: 'didactics',
  minPlayers: DC.minPlayers,
  maxPlayers: DC.maxPlayers,

  start(ctx, playerIds) {
    const count = teamCount(playerIds.length);
    const names = ctx.rng.shuffle(TEAM_NAMES);
    const teams: Team[] = names.slice(0, count).map((name, i) => ({ id: `t${i}`, name, color: i, members: [] }));
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
      carry: {},
      fastWrong: {},
      talkedOut: {},
      talkedIn: {},
      wager: null,
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
    if (!state.playerIds.includes(playerId)) return;
    if (!Number.isInteger(action.option) || action.option < 0 || action.option > 3) return;
    const phase = state.phase.name;

    if (phase === 'wager') {
      const team = teamOf(state, playerId);
      const bet = team && state.wager?.[team.id];
      if (!bet || bet.captain !== playerId) return { error: 'Your captain makes this call.' };
      bet.pct = DC.wagers[action.option];
      didactics.settle(state, ctx);
      return;
    }

    if (phase !== 'question' && phase !== 'huddle') return { error: 'Too late!' };
    const before = state.answers[playerId];
    if (!before) {
      state.answers[playerId] = { option: action.option, at: ctx.now, speed: phase === 'question' ? clockLeft(state, ctx) : 0 };
      didactics.settle(state, ctx);
      return;
    }
    if (before.option === action.option) return;
    // One change of heart per question, in the huddle, after seeing how the team split. Speed resets.
    if (phase === 'question') return { error: 'Locked in. You can switch in the huddle.' };
    if (before.switched) return { error: 'You already switched.' };
    state.answers[playerId] = { option: action.option, at: ctx.now, speed: 0, switched: true, from: before.option };
  },

  settle(state, ctx) {
    if (state.phase.name === 'question' && ctx.connectedPlayers(state.playerIds).every((id) => id in state.answers)) closeAnswers(state, ctx);
    if (state.phase.name === 'wager' && state.wager) {
      const waiting = Object.values(state.wager).filter((w) => w.pct === null && ctx.connectedPlayers([w.captain]).length);
      if (!waiting.length) ask(state, ctx);
    }
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
        closeAnswers(state, ctx);
        return;
      case 'huddle':
        reveal(state, ctx);
        return;
      case 'reveal': {
        const next = state.index + 1;
        if (next >= state.questions.length) setPhase(state, ctx, 'done', null);
        else if (next === finalIndex(state) || next === lightningStart(state) || (next % DC.standingsEvery === 0 && lightningStart(state) - next >= 2)) {
          ctx.say('scoreboard');
          setPhase(state, ctx, 'standings', DC.standings);
        } else {
          state.index = next;
          ask(state, ctx);
        }
        return;
      }
      case 'standings':
        state.index += 1;
        if (state.index === finalIndex(state)) openWager(state, ctx);
        else if (state.index === lightningStart(state)) {
          ctx.say('didacticsLightning');
          setPhase(state, ctx, 'lightning', DC.lightningIntro);
        } else ask(state, ctx);
        return;
      case 'lightning':
        ask(state, ctx);
        return;
      case 'wager':
        ask(state, ctx);
        return;
    }
  },

  result(state, ctx): GameResult | null {
    if (state.phase.name !== 'done') return null;
    const ranked = state.teams.slice().sort((a, b) => state.teamScores[b.id] - state.teamScores[a.id]);
    const rankOf = new Map<string, number>();
    ranked.forEach((t, i) => rankOf.set(t.id, i > 0 && state.teamScores[t.id] === state.teamScores[ranked[i - 1].id] ? rankOf.get(ranked[i - 1].id)! : i + 1));
    const players = state.playerIds
      .filter((id) => ctx.person(id))
      .sort((a, b) => state.teamScores[teamOf(state, b)!.id] - state.teamScores[teamOf(state, a)!.id] || state.scores[b] - state.scores[a]);
    return {
      game: 'didactics',
      standings: players.map((id) => {
        const p = ctx.person(id)!;
        return { playerId: id, name: p.name, avatar: p.avatar, score: state.scores[id], rank: rankOf.get(teamOf(state, id)!.id)! };
      }),
      teams: ranked.map((t) => ({ name: t.name, color: t.color, score: state.teamScores[t.id], rank: rankOf.get(t.id)!, members: t.members.filter((id) => ctx.person(id)) })),
      highlights: highlights(state, ctx, players),
    };
  },

  view(state, _ctx, viewer) {
    const q = state.questions[state.index];
    const phase = state.phase.name;
    const showing = phase === 'question' || phase === 'huddle' || phase === 'reveal';
    const revealed = phase === 'reveal';
    const tally = [0, 0, 0, 0];
    if (revealed) for (const a of Object.values(state.answers)) tally[a.option] += 1;
    const me = viewer.kind === 'stage' ? null : viewer.id;
    const myTeam = me ? teamOf(state, me) : null;
    const mine = me ? state.answers[me] : undefined;
    const wrong = tally.map((n, i) => ({ option: i, count: n })).filter((x) => x.option !== q.answer && x.count > 0);
    return {
      game: 'didactics',
      phase: state.phase,
      number: state.index + 1,
      total: state.questions.length,
      lightning: isLightning(state),
      final: isFinal(state),
      question: showing ? q.question : null,
      options: showing ? [...q.options] : [],
      answer: revealed ? q.answer : null,
      fact: revealed ? q.fact : null,
      tally,
      callout: revealed ? (wrong.sort((a, b) => b.count - a.count)[0] ?? null) : null,
      answered: Object.keys(state.answers),
      switches: Object.values(state.answers).filter((a) => a.switched).length,
      teams: state.teams.map((t) => ({ ...t, score: state.teamScores[t.id] })),
      last: revealed ? state.last : null,
      myTeam: myTeam?.id ?? null,
      myAnswer: mine?.option ?? null,
      mySwitched: Boolean(mine?.switched),
      canPick: Boolean(me && state.playerIds.includes(me)) && (phase === 'question' ? !mine : phase === 'huddle' && !mine?.switched),
      teamPicks: myTeam && (phase === 'huddle' || revealed) ? teamPicks(state, myTeam) : null,
      wager: wagerView(state, myTeam?.id ?? null),
      youCaptain: Boolean(me && myTeam && state.wager?.[myTeam.id]?.captain === me && phase === 'wager'),
    };
  },

  statKey(state, _ctx, playerId) {
    if (!['question', 'huddle'].includes(state.phase.name) || !state.playerIds.includes(playerId)) return { error: 'Call it while a question is up.' };
    return `q${state.index}`;
  },

  statRound(state) {
    return { key: `q${state.index}`, revealed: state.phase.name === 'reveal' };
  },
};

/** About five a team, at least two teams, at most eight. */
export const teamCount = (players: number) => Math.max(2, Math.min(DC.maxTeams, Math.ceil(players / DC.perTeam)));

const finalIndex = (state: DidacticsState) => (state.questions.length > 1 ? state.questions.length - 1 : -1);
const lightningStart = (state: DidacticsState) => Math.max(1, state.questions.length - 1 - DC.lightning);
const isFinal = (state: DidacticsState) => state.index === finalIndex(state);
const isLightning = (state: DidacticsState) => state.index >= lightningStart(state) && !isFinal(state);
const teamOf = (state: DidacticsState, id: string) => state.teams.find((t) => t.members.includes(id)) ?? null;

/** Share of the answer clock still left, 0 to 1. */
function clockLeft(state: DidacticsState, ctx: GameContext) {
  const { startedAt, endsAt } = state.phase;
  if (endsAt === null) return 0;
  return Math.max(0, Math.min(1, 1 - (ctx.now - startedAt) / (endsAt - startedAt || 1)));
}

function ask(state: DidacticsState, ctx: GameContext) {
  state.answers = {};
  state.last = null;
  const q = state.questions[state.index];
  setPhase(state, ctx, 'question', questionTime(isLightning(state) ? DC.lightningQuestion : DC.question, q.question, q.options), 'input');
}

/** Everyone's in (or time's up): huddle, except in the lightning round, which goes straight to the answer. */
function closeAnswers(state: DidacticsState, ctx: GameContext) {
  if (isLightning(state)) {
    reveal(state, ctx);
    return;
  }
  ctx.say('didacticsHuddle');
  setPhase(state, ctx, 'huddle', DC.huddle, 'input');
}

/** The best player on each team so far captains the final wager. */
function openWager(state: DidacticsState, ctx: GameContext) {
  const wager: Record<string, TeamWager> = {};
  for (const team of state.teams) {
    const here = ctx.connectedPlayers(team.members);
    const captain = (here.length ? here : team.members)
      .slice()
      .sort((a, b) => state.scores[b] - state.scores[a] || (state.correct[b] ?? 0) - (state.correct[a] ?? 0))[0];
    if (captain) wager[team.id] = { captain, pct: null };
  }
  state.wager = wager;
  ctx.say('didacticsWager');
  setPhase(state, ctx, 'wager', DC.wager, 'input');
}

/** What a team bets: a share of its score, as if it had at least the floor. */
const stakeOf = (state: DidacticsState, teamId: string) => Math.max(state.teamScores[teamId] ?? 0, DC.wagerFloor);

function wagerView(state: DidacticsState, myTeam: string | null): DidacticsView['wager'] {
  if (!state.wager || !(state.phase.name === 'wager' || isFinal(state))) return null;
  const open = state.phase.name === 'reveal';
  const teams: NonNullable<DidacticsView['wager']>['teams'] = {};
  for (const [id, w] of Object.entries(state.wager))
    teams[id] = { captain: w.captain, picked: w.pct !== null, pct: open || id === myTeam ? w.pct : null, stake: stakeOf(state, id) };
  return { options: DC.wagers, difficulty: state.questions[finalIndex(state)]?.difficulty ?? 2, teams };
}

/** How the viewer's team has answered so far. */
function teamPicks(state: DidacticsState, team: Team) {
  const counts = [0, 0, 0, 0];
  for (const id of team.members) if (state.answers[id]) counts[state.answers[id].option] += 1;
  return counts;
}

const bump = (rec: Record<string, number>, id: string) => (rec[id] = (rec[id] ?? 0) + 1);

function reveal(state: DidacticsState, ctx: GameContext) {
  const q = state.questions[state.index];
  const multiplier = isLightning(state) ? 2 : 1;
  const round = `q${state.index}`;
  const perTeam: Record<string, TeamResult> = {};

  for (const id of state.playerIds) {
    const a = state.answers[id];
    if (!a) continue;
    if (a.switched && a.from === q.answer) bump(state.talkedOut, id);
    if (a.switched && a.option === q.answer) bump(state.talkedIn, id);
    if (a.option !== q.answer) {
      if (!a.switched && a.speed >= 0.6) bump(state.fastWrong, id);
      continue;
    }
    bump(state.correct, id);
    state.scores[id] += statted(state, id, round, tidy((DC.base + DC.speedBonus * a.speed) * multiplier));
  }

  for (const team of state.teams) {
    // Count everyone still here; a teammate who never answers counts as a miss.
    const present = ctx.connectedPlayers(team.members);
    const rightIds = present.filter((id) => state.answers[id]?.option === q.answer);
    const right = rightIds.length;
    // Carrying: right when two thirds of the team wasn't.
    if (present.length >= 3 && right * 3 <= present.length) rightIds.forEach((id) => bump(state.carry, id));
    // A Stat makes its caller's right answer count twice for the team.
    const counted = rightIds.reduce((n, id) => n + statted(state, id, round, 1), 0);
    const points = present.length ? tidy((DC.pool * counted * multiplier) / present.length) : 0;
    const result: TeamResult = { right, of: present.length, points };

    const bet = isFinal(state) ? state.wager?.[team.id] : undefined;
    if (bet) {
      // The team's majority decides the bet. A loss never takes a team below zero.
      const pct = bet.pct ?? 0;
      const amount = tidy(pct * stakeOf(state, team.id));
      const won = present.length > 0 && right * 2 >= present.length;
      const swing = won ? amount : -Math.min(amount, state.teamScores[team.id]);
      result.wager = { pct, amount, swing };
      state.teamScores[team.id] += swing;
    }
    state.teamScores[team.id] += points;
    perTeam[team.id] = result;
  }

  state.last = { perTeam };
  const best = Math.max(...Object.values(perTeam).map((t) => (t.of ? t.right / t.of : 0)));
  if (best === 0) ctx.say('didacticsStumped');
  setPhase(state, ctx, 'reveal', isFinal(state) ? DC.finalReveal : DC.reveal);
}

/** End-of-game awards beyond the MVP, from what people actually did. */
function highlights(state: DidacticsState, ctx: GameContext, players: string[]): Highlight[] {
  const out: Highlight[] = [];
  const most = (rec: Record<string, number>, min: number) => {
    const best = players.filter((id) => (rec[id] ?? 0) >= min).sort((a, b) => rec[b] - rec[a])[0];
    return best ? { id: best, n: rec[best] } : null;
  };
  const times = (n: number) => (n === 1 ? 'once' : `${n} times`);

  const mvp = players.slice().sort((a, b) => (state.correct[b] ?? 0) - (state.correct[a] ?? 0) || state.scores[b] - state.scores[a])[0];
  if (mvp) out.push({ title: 'MVP', playerId: mvp, detail: `${state.correct[mvp] ?? 0} of ${state.questions.length} right` });

  const carry = most(state.carry, 2);
  if (carry) out.push({ title: 'Team Carry', playerId: carry.id, detail: `Right while the team wasn’t, ${times(carry.n)}` });

  const confident = most(state.fastWrong, 3);
  if (confident) out.push({ title: 'Most Confidently Wrong', playerId: confident.id, detail: `${confident.n} wrong answers, all of them fast` });

  const talkedOut = most(state.talkedOut, 1);
  if (talkedOut) out.push({ title: 'Talked Out of It', playerId: talkedOut.id, detail: `Switched off the right answer ${times(talkedOut.n)}` });

  const finalTeams = state.last?.perTeam ?? {};
  const roller = Object.entries(state.wager ?? {}).find(([teamId, w]) => w.pct === 1 && finalTeams[teamId]?.wager && ctx.person(w.captain));
  if (roller) {
    const won = (finalTeams[roller[0]].wager?.swing ?? 0) > 0;
    out.push({ title: 'High Roller', playerId: roller[1].captain, detail: `Bet everything on the final. ${won ? 'It worked.' : 'It did not.'}` });
  } else {
    const convert = most(state.talkedIn, 2);
    if (convert) out.push({ title: 'Peer Reviewed', playerId: convert.id, detail: `The huddle fixed their answer ${times(convert.n)}` });
  }
  return out.slice(0, 5);
}
