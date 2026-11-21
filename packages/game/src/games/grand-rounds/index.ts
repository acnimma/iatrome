import { type HostEvent, curbsideGeneric, playerQuips, quips } from '@iatrome/content';
import { GRAND_ROUNDS as GR, LIMITS } from '../../constants';
import { cleanText, sameAnswer } from '../../text';
import type { GameResult, Highlight, Phase } from '../../types';
import {
  type ActionOutcome,
  type BaseGameState,
  type GameContext,
  type GameModule,
  type Viewer,
  setPhase,
  standings,
  statted,
} from '../context';
import { BEEP, ring, spreadOrder } from './assign';
import { type Side, scoreFinale, scoreForfeit, scoreVotes } from './scoring';
import { duelReadTiming, duelRevealTiming, finaleRevealTiming } from './timing';

// ── State ────────────────────────────────────────────────────────────────────

export type MatchupKind = 'quip';
type PhaseName = 'intro' | 'write' | 'present' | 'vote' | 'results' | 'scores' | 'done';

interface Entry {
  playerId: string;
  text: string | null;
  curbside: boolean;
  /** Locked in (pressed submit). Drafts count if the timer runs out. */
  final: boolean;
  hidden: boolean;
}

/** Per-entry arrays line up with the matchup's entries (two in a duel, everyone in the finale). */
export interface MatchupResult {
  outcome: 'vote' | 'forfeit' | 'duplicate' | 'empty';
  shares: number[];
  points: number[];
  winner: number | null;
  consensus: boolean;
  playerVotes: { voterId: string; side: number }[];
}

/**
 * Rounds 1–2 are duels: two players, one prompt, everyone else votes.
 * The finale is one open-ended quip for everybody (plus Beep), and everyone votes for a favourite
 * that isn't theirs, like Quiplash's last round.
 */
interface Matchup {
  id: string;
  kind: MatchupKind;
  /** Everybody answers this one (the last round). */
  finale: boolean;
  prompt: string;
  curbside: [string, string] | null;
  playerIds: string[];
  entries: Entry[];
  /** Duels: voterId → entry index. */
  votes: Record<string, number>;
  /** Finale: voterId → up to GR.finalePicks entry indexes (stacking allowed). */
  picks: Record<string, number[]>;
  result: MatchupResult | null;
}

export interface GrandRoundsState extends BaseGameState {
  game: 'grand-rounds';
  phase: Phase<PhaseName>;
  round: number;
  matchups: Matchup[];
  current: number;
  /** Scores when the round began, so the scoreboard can show who moved. */
  roundStart: Record<string, number>;
  /** Beep has nagged about the writing time this round. */
  nagged: boolean;
  /** Beep has filled the writing silence this round. */
  bantered: boolean;
  /** Every finished matchup, for end-of-game highlights. */
  archive: { round: number; prompt: string; kind: MatchupKind; entries: Entry[]; result: MatchupResult }[];
}

export type GrandRoundsAction =
  | { type: 'answer'; matchupId: string; text: string; final: boolean }
  | { type: 'curbside'; matchupId: string }
  | { type: 'vote'; side: number }
  /** Finale: take back your votes and place them again. */
  | { type: 'unvote' };

// ── Views ────────────────────────────────────────────────────────────────────

export interface EntryView {
  text: string | null;
  hidden: boolean;
  /** Revealed with the results. */
  author: string | null;
  curbside: boolean;
}

export interface MatchupView {
  id: string;
  kind: MatchupKind;
  prompt: string;
  index: number;
  total: number;
  /** Everyone's answer, all at once: the finale. */
  finale: boolean;
  entries: EntryView[];
  result: MatchupResult | null;
  /** How many votes are in (shown during voting, not who for). */
  votesIn: number;
  votersExpected: number;
  /** Viewer-specific. */
  canVote: boolean;
  myVote: number | null;
  /** Finale: the lists you've put your votes on (stacking allowed), and how many you get. */
  myPicks: number[];
  picksPerVoter: number;
  /** Which entry is the viewer's own answer (only ever told to its author). */
  yours: number | null;
}

export interface TaskView {
  matchupId: string;
  kind: MatchupKind;
  prompt: string;
  done: boolean;
  draft: string | string[] | null;
  canCurbside: boolean;
}

export interface GrandRoundsView {
  game: 'grand-rounds';
  phase: Phase<PhaseName>;
  round: number;
  rounds: number;
  multiplier: number;
  matchup: MatchupView | null;
  /** Players still writing (write phase). */
  waitingOn: string[];
  /** The viewer's own prompts (write phase, players only). */
  tasks: TaskView[];
  scores: Record<string, number>;
  /** Scores before this round (scoreboard phase), so it can show who moved. */
  previousScores: Record<string, number> | null;
}

// ── Module ───────────────────────────────────────────────────────────────────

const ROUNDS = 3;
/** Share of prompts that are inside jokes about the players (when enabled). */
const PERSONAL_SHARE = 0.4;

export const grandRounds: GameModule<GrandRoundsState, GrandRoundsAction, GrandRoundsView> = {
  id: 'grand-rounds',
  minPlayers: GR.minPlayers,
  maxPlayers: GR.maxPlayers,

  start(ctx, playerIds) {
    const state: GrandRoundsState = {
      game: 'grand-rounds',
      playerIds,
      scores: Object.fromEntries(playerIds.map((id) => [id, 0])),
      phase: { name: 'intro', startedAt: ctx.now, endsAt: null },
      round: 0,
      matchups: [],
      current: 0,
      roundStart: {},
      nagged: false,
      bantered: false,
      archive: [],
    };
    startRound(state, ctx);
    return state;
  },

  act(state, ctx, playerId, action) {
    if (action.type === 'vote') return vote(state, ctx, playerId, action.side);
    if (action.type === 'unvote') return unvote(state, playerId);
    if (state.phase.name !== 'write') return { error: 'Too late for that one!' };
    const matchup = state.matchups.find((m) => m.id === action.matchupId);
    const side = matchup?.playerIds.indexOf(playerId) ?? -1;
    if (!matchup || side === -1) return { error: 'That prompt isn’t yours.' };
    const entry = matchup.entries[side];
    if (entry.final) return { error: 'Already locked in.' };

    const outcome = write(matchup, entry, ctx, action);
    if (outcome?.error) return outcome;
    if (entry.final && allWritten(state, ctx)) beginPresent(state, ctx, 0);
    return outcome;
  },

  timeout(state, ctx) {
    switch (state.phase.name) {
      case 'intro':
        setPhase(state, ctx, 'write', writeDuration(state, ctx), 'input');
        return;
      case 'write':
        beginPresent(state, ctx, 0);
        return;
      case 'present':
        if (needsVote(state, ctx)) setPhase(state, ctx, 'vote', isFinale(state.matchups[state.current]) ? GR.voteFinale : GR.vote, 'input');
        else finish(state, ctx);
        return;
      case 'vote':
        finish(state, ctx);
        return;
      case 'results':
        if (state.current + 1 < state.matchups.length) beginPresent(state, ctx, state.current + 1);
        else if (state.round + 1 < ROUNDS) {
          sayScoreboard(state, ctx);
          setPhase(state, ctx, 'scores', GR.scores);
        } else setPhase(state, ctx, 'done', null);
        return;
      case 'scores':
        state.round += 1;
        startRound(state, ctx);
        return;
    }
  },

  settle(state, ctx) {
    if (state.phase.name === 'write' && allWritten(state, ctx)) beginPresent(state, ctx, 0);
    else if (state.phase.name === 'vote') {
      const m = state.matchups[state.current];
      const v = voters(state, ctx, m);
      if (liveCount(m, ctx) < 2 || (v.length > 0 && votingDone(state, ctx, m))) finish(state, ctx);
    }
  },

  hide(state, ctx, target) {
    const matchup = state.matchups[state.current];
    if (!matchup || isFinale(matchup) || !['present', 'vote', 'results'].includes(state.phase.name)) return;
    const side = target === 'a' ? 0 : target === 'b' ? 1 : -1;
    if (side === -1) return;
    matchup.entries[side].hidden = true;
    if (state.phase.name !== 'results') finish(state, ctx);
  },

  result(state, ctx): GameResult | null {
    if (state.phase.name !== 'done') return null;
    return { game: 'grand-rounds', standings: standings(ctx, state.scores), highlights: highlights(state, ctx) };
  },

  view(state, ctx, viewer) {
    const matchup = state.matchups[state.current];
    const showMatchup = ['present', 'vote', 'results'].includes(state.phase.name) && matchup;
    return {
      game: 'grand-rounds',
      phase: state.phase,
      round: state.round,
      rounds: ROUNDS,
      multiplier: GR.multipliers[state.round],
      matchup: showMatchup ? matchupView(state, ctx, matchup, viewer) : null,
      waitingOn: state.phase.name === 'write' ? unwritten(state, ctx) : [],
      tasks: state.phase.name === 'write' && viewer.kind === 'player' ? tasks(state, viewer.id) : [],
      scores: state.scores,
      previousScores: state.phase.name === 'scores' ? state.roundStart : null,
    };
  },

  statKey(state, _ctx, playerId, target) {
    if (state.phase.name !== 'write') return { error: 'Call it while you’re writing.' };
    const m = state.matchups.find((x) => x.id === target);
    if (!m || !m.playerIds.includes(playerId)) return { error: 'Pick one of your own prompts.' };
    return m.id;
  },

  statRound(state) {
    const live = ['present', 'vote', 'results'].includes(state.phase.name);
    return { key: live ? (state.matchups[state.current]?.id ?? null) : null, revealed: state.phase.name === 'results' };
  },

  wakeAt(state) {
    const { name, startedAt, endsAt } = state.phase;
    if (name !== 'write' || endsAt === null) return [];
    return [...(state.bantered ? [] : [banterAt(startedAt, endsAt)]), ...(state.nagged ? [] : [endsAt - GR.nagAt])];
  },

  tick(state, ctx) {
    const { name, startedAt, endsAt } = state.phase;
    if (name !== 'write' || endsAt === null) return false;
    // Fill the silence once, a little before halfway through the writing.
    if (!state.bantered && ctx.now >= banterAt(startedAt, endsAt) && endsAt - ctx.now > GR.nagAt) {
      state.bantered = true;
      if (unwritten(state, ctx).length) ctx.say('writingBanter');
      return true;
    }
    if (state.nagged || endsAt - startedAt < GR.nagAt * 2 || endsAt - ctx.now > GR.nagAt) return false;
    state.nagged = true;
    if (unwritten(state, ctx).length) ctx.say('writeNag');
    return true;
  },

};

// ── Rounds ───────────────────────────────────────────────────────────────────

function startRound(state: GrandRoundsState, ctx: GameContext) {
  const order = ctx.rng.shuffle(state.playerIds.filter((id) => ctx.person(id)));
  state.current = 0;
  state.roundStart = { ...state.scores };
  state.nagged = false;
  state.bantered = false;

  // A name to drop into an inside-joke prompt: anyone except the two people answering.
  const subjectFor = (pair: readonly string[]) => {
    const others = order.filter((id) => !pair.includes(id));
    return others.length ? ctx.person(ctx.rng.pick(others))!.name : null;
  };
  const insideJokes = order.length >= 3;
  const personalize = (text: string, pair: readonly string[]) => {
    const name = subjectFor(pair);
    return name ? text.replace('{player}', () => name) : null;
  };

  if (state.round < 2) {
    const quipCount = order.length;
    const personal = insideJokes ? ctx.draw(playerQuips, Math.round(quipCount * PERSONAL_SHARE)) : [];
    const quipPool = ctx.rng.shuffle([...personal, ...ctx.draw(quips, quipCount - personal.length)]);
    state.matchups = spreadOrder(
      ring(order).map((pair) => {
        let q = quipPool.pop()!;
        let text = q.text.includes('{player}') ? personalize(q.text, pair) : q.text;
        if (text === null) {
          q = ctx.draw(quips, 1)[0];
          text = q.text;
        }
        return newMatchup(ctx, text, q.curbside, pair, false);
      }),
    );
  } else {
    // The finale: one prompt for everybody, and everybody votes.
    const personal = insideJokes && ctx.rng.int(10) < PERSONAL_SHARE * 10 ? ctx.draw(playerQuips, 1) : [];
    const q = personal[0] ?? ctx.draw(quips, 1)[0];
    const text = q.text.includes('{player}') ? q.text.replace('{player}', () => ctx.person(ctx.rng.pick(order))!.name) : q.text;
    state.matchups = [newMatchup(ctx, text, q.curbside, order, true)];
  }

  ctx.say(state.round === 0 ? 'roundOneIntro' : state.round === 1 ? 'roundTwoIntro' : 'finalIntro');
  setPhase(state, ctx, 'intro', GR.intro);
}

function newMatchup(ctx: GameContext, prompt: string, curbside: [string, string] | null, playerIds: string[], finale: boolean): Matchup {
  const entry = (playerId: string): Entry => ({
    playerId,
    text: null,
    curbside: false,
    final: false,
    hidden: false,
  });
  return {
    id: ctx.rng.id(8),
    kind: 'quip',
    finale,
    prompt,
    curbside,
    playerIds,
    entries: playerIds.map(entry),
    votes: {},
    picks: {},
    result: null,
  };
}

function writeDuration(state: GrandRoundsState, ctx: GameContext) {
  return state.round === 2 ? GR.writeFinale : GR.writeQuips;
}

// ── Writing ──────────────────────────────────────────────────────────────────

function write(matchup: Matchup, entry: Entry, ctx: GameContext, action: GrandRoundsAction): ActionOutcome | void {
  switch (action.type) {
    case 'answer': {
      const text = cleanText(action.text, LIMITS.quip);
      if (action.final && !text) return { error: 'Write something first!' };
      entry.text = text || null;
      entry.curbside = false;
      entry.final = action.final;
      return;
    }
    case 'curbside': {
      entry.text = matchup.curbside ? ctx.rng.pick(matchup.curbside) : ctx.rng.pick(curbsideGeneric);
      entry.curbside = true;
      entry.final = true;
      return { notice: entry.text };
    }
  }
}

function hasContent(entry: Entry) {
  return Boolean(entry.text);
}

/** Who still owes an answer (connected players only: we don't wait for dropouts). */
function unwritten(state: GrandRoundsState, ctx: GameContext) {
  const connected = new Set(ctx.connectedPlayers(state.playerIds));
  const waiting = new Set<string>();
  for (const m of state.matchups)
    m.entries.forEach((e) => {
      if (!e.final && connected.has(e.playerId)) waiting.add(e.playerId);
    });
  return [...waiting];
}

const allWritten = (state: GrandRoundsState, ctx: GameContext) => unwritten(state, ctx).length === 0;

function tasks(state: GrandRoundsState, playerId: string): TaskView[] {
  return state.matchups
    .filter((m) => m.playerIds.includes(playerId))
    .map((m) => {
      const e = m.entries[m.playerIds.indexOf(playerId)];
      return {
        matchupId: m.id,
        kind: m.kind,
        prompt: m.prompt,
        done: e.final,
        draft: e.text,
        canCurbside: true,
      };
    });
}

// ── Presenting & voting ──────────────────────────────────────────────────────

function beginPresent(state: GrandRoundsState, ctx: GameContext, index: number) {
  state.current = index;
  const m = state.matchups[index];
  // Drafts that never got submitted still count when the timer runs out.
  for (const e of m.entries) e.final = e.final || hasContent(e);
  if (isFinale(m)) {
    const lists = m.entries.filter((e) => hasContent(e)).length;
    setPhase(state, ctx, 'present', GR.present.finale + lists * GR.presentPerList);
    return;
  }
  const [a, b] = m.entries;
  setPhase(state, ctx, 'present', duelReadTiming(m.prompt, a.text, b.text).total);
}

function live(m: Matchup, ctx: GameContext, side: number) {
  const e = m.entries[side];
  const present = e?.playerId === BEEP || (e && ctx.person(e.playerId));
  return Boolean(present && !e.hidden && hasContent(e));
}

const liveCount = (m: Matchup, ctx: GameContext) => m.entries.filter((_, i) => live(m, ctx, i)).length;

/** The finale is everybody's answer to one prompt. */
const isFinale = (m: Matchup) => m.finale;

function isDuplicate(m: Matchup) {
  if (isFinale(m)) return false;
  const [a, b] = m.entries;
  return Boolean(a.text && b.text && sameAnswer(a.text, b.text));
}

/**
 * Who may vote: in a duel, everyone in the room except its two authors, audience included.
 * In the finale everyone votes (just never for their own list).
 */
function voters(_state: GrandRoundsState, ctx: GameContext, m: Matchup) {
  const everyone = ctx.connectedPlayers(ctx.room.people.map((p) => p.id));
  return isFinale(m) ? everyone : everyone.filter((id) => !m.playerIds.includes(id));
}

/** Voting closes early once every player who can vote has; the audience never holds it up. */
function votingDone(state: GrandRoundsState, ctx: GameContext, m: Matchup) {
  const eligible = voters(state, ctx, m);
  const players = eligible.filter((id) => state.playerIds.includes(id));
  const done = (id: string) => (isFinale(m) ? (m.picks[id]?.length ?? 0) >= GR.finalePicks : id in m.votes);
  return (players.length ? players : eligible).every(done);
}

function leaderOf(scores: Record<string, number>) {
  const [top, next] = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return top && top[1] > 0 && (!next || top[1] > next[1]) ? top[0] : null;
}

function needsVote(state: GrandRoundsState, ctx: GameContext) {
  const m = state.matchups[state.current];
  if (liveCount(m, ctx) < 2 || isDuplicate(m)) return false;
  return voters(state, ctx, m).length > 0;
}

function vote(state: GrandRoundsState, ctx: GameContext, voterId: string, side: number): ActionOutcome | void {
  const m = state.matchups[state.current];
  if (state.phase.name !== 'vote' || !m) return { error: 'Voting is closed.' };
  if (!Number.isInteger(side) || !live(m, ctx, side)) return;
  if (m.entries[side].playerId === voterId || (!isFinale(m) && m.playerIds.includes(voterId))) return { error: 'No voting for yourself!' };
  const eligible = voters(state, ctx, m);
  if (!eligible.includes(voterId)) return { error: 'You can’t vote on this one.' };
  if (isFinale(m)) {
    const mine = (m.picks[voterId] ??= []);
    if (mine.length >= GR.finalePicks) return;
    mine.push(side);
  } else m.votes[voterId] = side;
  if (votingDone(state, ctx, m)) finish(state, ctx);
}

/** Finale only: take your votes back while voting is still open. */
function unvote(state: GrandRoundsState, voterId: string): ActionOutcome | void {
  const m = state.matchups[state.current];
  if (state.phase.name !== 'vote' || !m || !isFinale(m)) return;
  delete m.picks[voterId];
}

// ── Results ──────────────────────────────────────────────────────────────────

function finish(state: GrandRoundsState, ctx: GameContext) {
  const m = state.matchups[state.current];
  if (isFinale(m)) return finishFinale(state, ctx, m);
  const multiplier = GR.multipliers[state.round];
  const curbside: [boolean, boolean] = [m.entries[0].curbside, m.entries[1].curbside];
  const alive: [boolean, boolean] = [live(m, ctx, 0), live(m, ctx, 1)];
  const playerVotes = Object.entries(m.votes).map(([voterId, side]) => ({ voterId, side: side as Side }));
  const base = { playerVotes, consensus: false };

  // Beep waits for the stage to light up the winner before reacting.
  const reveal = duelRevealTiming(Object.keys(m.votes).length, false);
  const say = (event: HostEvent, vars?: Record<string, string>) => ctx.say(event, vars, reveal.winnerAt);
  const nameOf = (side: Side) => ctx.person(m.entries[side].playerId)?.name ?? 'Someone';
  let result: MatchupResult;
  if (!alive[0] && !alive[1]) {
    result = { ...base, outcome: 'empty', shares: [0, 0], points: [0, 0], winner: null };
    say('forfeit');
  } else if (alive[0] !== alive[1]) {
    const winner: Side = alive[0] ? 0 : 1;
    result = {
      ...base,
      outcome: 'forfeit',
      shares: winner === 0 ? [1, 0] : [0, 1],
      points: scoreForfeit(winner, multiplier, curbside[winner]),
      winner,
    };
    say('forfeit');
  } else if (isDuplicate(m)) {
    result = { ...base, outcome: 'duplicate', shares: [0.5, 0.5], points: [0, 0], winner: null };
    say('duplicate');
  } else {
    const counts: [number, number] = [0, 0];
    const audience: [number, number] = [0, 0];
    for (const v of playerVotes) (state.playerIds.includes(v.voterId) ? counts : audience)[v.side] += 1;
    const score = scoreVotes({ votes: counts, audience, multiplier, curbside });
    result = { ...base, outcome: 'vote', ...score };
    const w = score.winner;
    const total = playerVotes.length;
    if (total === 0) say('noVotes');
    else if (w === null) say('tie');
    else if (score.consensus) say('pathognomonic', { name: nameOf(w) });
    else if (curbside[w]) say('curbsideWin');
    else if (m.kind === 'quip' && m.entries[w].text && ctx.rng.int(3) > 0) say('matchupWinner', { name: nameOf(w), answer: quoteable(m.entries[w].text!) });
    else if (total === 1) say('oneVote');
    else if (score.shares[w] >= 0.75) say('blowout');
  }

  settleResult(state, ctx, m, result);
}

function finishFinale(state: GrandRoundsState, ctx: GameContext, m: Matchup) {
  // Beep reacts once the winning list (revealed last) lands.
  const reveal = finaleRevealTiming(m.entries.length);
  const say = (event: HostEvent, vars?: Record<string, string>) => ctx.say(event, vars, reveal.listAt(m.entries.length - 1) + 600);
  const playerVotes = Object.entries(m.picks).flatMap(([voterId, sides]) => sides.map((side) => ({ voterId, side })));
  const votes = m.entries.map(() => 0);
  const audience = m.entries.map(() => 0);
  for (const v of playerVotes) if (live(m, ctx, v.side)) (state.playerIds.includes(v.voterId) ? votes : audience)[v.side] += 1;
  const score = scoreFinale({ votes, audience, multiplier: GR.multipliers[state.round] });
  const alive = liveCount(m, ctx);
  const result: MatchupResult = { outcome: alive ? 'vote' : 'empty', playerVotes, ...score };
  const w = score.winner;
  const punchline = w === null ? null : m.entries[w].text;
  if (!alive) say('forfeit');
  else if (!playerVotes.length) say('noVotes');
  else if (w === null) say('tie');
  else if (score.consensus) say('pathognomonic', { name: ctx.person(m.entries[w].playerId)?.name ?? 'Someone' });
  else if (punchline) say('matchupWinner', { name: ctx.person(m.entries[w].playerId)?.name ?? 'Someone', answer: quoteable(punchline) });
  else say('blowout');
  settleResult(state, ctx, m, result);
}

function settleResult(state: GrandRoundsState, ctx: GameContext, m: Matchup, result: MatchupResult) {
  result.points = result.points.map((p, side) => statted(state, m.entries[side].playerId, m.id, p));
  m.result = result;
  m.entries.forEach((e, side) => {
    if (e.playerId !== BEEP && e.playerId in state.scores) state.scores[e.playerId] += result.points[side];
  });
  state.archive.push({ round: state.round, prompt: m.prompt, kind: m.kind, entries: m.entries, result });
  const duration = isFinale(m)
    ? finaleRevealTiming(m.entries.length).total
    : duelRevealTiming(result.playerVotes.length, result.outcome === 'vote' && result.consensus).total;
  setPhase(state, ctx, 'results', duration);
}

function matchupView(state: GrandRoundsState, ctx: GameContext, m: Matchup, viewer: Viewer): MatchupView {
  const revealed = state.phase.name === 'results';
  const v = voters(state, ctx, m);
  const viewerId = viewer.kind === 'stage' ? null : viewer.id;
  const canVote =
    state.phase.name === 'vote' && viewerId !== null && v.includes(viewerId);
  const entry = (e: Entry): EntryView => {
    const hide = e.hidden || (e.playerId !== BEEP && !ctx.person(e.playerId));
    return {
      text: hide ? null : e.text,
      hidden: hide,
      author: revealed ? e.playerId : null,
      curbside: revealed && e.curbside,
    };
  };
  return {
    id: m.id,
    kind: m.kind,
    prompt: m.prompt,
    index: state.current,
    total: state.matchups.length,
    finale: isFinale(m),
    entries: m.entries.map(entry),
    result: revealed ? m.result : null,
    votesIn: isFinale(m) ? Object.values(m.picks).filter((p) => p.length >= GR.finalePicks).length : Object.keys(m.votes).length,
    votersExpected: v.length,
    canVote,
    myVote: viewerId ? (m.votes[viewerId] ?? null) : null,
    myPicks: viewerId ? (m.picks[viewerId] ?? []) : [],
    picksPerVoter: isFinale(m) ? GR.finalePicks : 1,
    yours: viewerId && m.playerIds.includes(viewerId) ? m.playerIds.indexOf(viewerId) : null,
  };
}

/** Host lines quote answers as “{answer}.”: drop the answer's own closing punctuation and quotes. */
const quoteable = (text: string) => text.trim().replace(/["“”'’]+$/, '').replace(/[.!?…,;:]+$/, '').replace(/^["“”'‘]+/, '');

/** A little before halfway through the writing: when the silence starts to show. */
const banterAt = (startedAt: number, endsAt: number) => startedAt + (endsAt - startedAt) * 0.4;

/** Between rounds: a new leader, a big climber, or a gentle word for whoever is last. */
function sayScoreboard(state: GrandRoundsState, ctx: GameContext) {
  const name = (id: string) => ctx.person(id)?.name ?? 'Someone';
  const [before, now] = [leaderOf(state.roundStart), leaderOf(state.scores)];
  if (before && now && before !== now) return ctx.say('leadChange', { name: name(now) });
  const rank = (scores: Record<string, number>) => {
    const ids = state.playerIds.filter((id) => ctx.person(id)).sort((a, b) => scores[b] - scores[a]);
    return (id: string) => ids.indexOf(id);
  };
  const was = rank(state.roundStart);
  const is = rank(state.scores);
  const climber = state.playerIds.filter((id) => ctx.person(id)).sort((a, b) => was(a) - is(a) - (was(b) - is(b)))[0];
  if (climber && was(climber) - is(climber) >= 2) return ctx.say('comeback', { name: name(climber) });
  const players = state.playerIds.filter((id) => ctx.person(id));
  const last = players.sort((a, b) => state.scores[a] - state.scores[b])[0];
  if (last && players.length >= 3 && ctx.rng.int(2) === 0) return ctx.say('lastPlace', { name: name(last) });
  ctx.say('scoreboard');
}

// ── Highlights ───────────────────────────────────────────────────────────────

function highlights(state: GrandRoundsState, ctx: GameContext): Highlight[] {
  const out: Highlight[] = [];
  const voted = state.archive.filter((a) => a.result.outcome === 'vote' && a.result.winner !== null);

  const best = voted
    .filter((a) => a.result.playerVotes.length >= 2)
    .sort((x, y) => y.result.shares[y.result.winner!] - x.result.shares[x.result.winner!] || y.round - x.round)[0];
  if (best) {
    const e = best.entries[best.result.winner!];
    const line = e.text ?? '';
    out.push({ title: 'Line of the night', playerId: e.playerId === BEEP ? null : e.playerId, detail: line });
  }

  const sweeps: Record<string, number> = {};
  for (const a of voted) if (a.result.consensus) {
    const id = a.entries[a.result.winner!].playerId;
    if (id !== BEEP) sweeps[id] = (sweeps[id] ?? 0) + 1;
  }
  const sweeper = Object.entries(sweeps).sort((a, b) => b[1] - a[1])[0];
  if (sweeper) out.push({ title: 'Consensus magnet', playerId: sweeper[0], detail: `${sweeper[1]}× unanimous` });

  const votes: Record<string, number> = {};
  for (const a of state.archive)
    for (const v of a.result.playerVotes) {
      const id = a.entries[v.side].playerId;
      if (id !== BEEP) votes[id] = (votes[id] ?? 0) + 1;
    }
  const fav = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
  if (fav && ctx.person(fav[0])) out.push({ title: 'Crowd favourite', playerId: fav[0], detail: `${fav[1]} votes` });

  return out;
}
