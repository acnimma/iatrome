import { curbsideGeneric, differentials, doodles, quips } from '@iatrome/content';
import { GRAND_ROUNDS as GR, LIMITS } from '../../constants';
import { cleanText, isAllowed, sameAnswer } from '../../text';
import type { Drawing, GameResult, Highlight, Phase } from '../../types';
import { validDrawing } from '../../drawing';
import {
  type ActionOutcome,
  type BaseGameState,
  type GameContext,
  type GameModule,
  type Viewer,
  setPhase,
  standings,
} from '../context';
import { BEEP, finalePairs, mixedKinds, ring, spreadOrder } from './assign';
import { type Side, scoreForfeit, scoreVotes } from './scoring';

// ── State ────────────────────────────────────────────────────────────────────

export type MatchupKind = 'quip' | 'doodle' | 'differential';
type PhaseName = 'intro' | 'write' | 'present' | 'vote' | 'results' | 'scores' | 'done';

interface Entry {
  playerId: string;
  text: string | null;
  items: string[] | null;
  drawingId: string | null;
  curbside: boolean;
  /** Locked in (pressed submit). Drafts count if the timer runs out. */
  final: boolean;
  hidden: boolean;
}

export interface MatchupResult {
  outcome: 'vote' | 'forfeit' | 'duplicate' | 'empty';
  shares: [number, number];
  points: [number, number];
  winner: Side | null;
  consensus: boolean;
  playerVotes: { voterId: string; side: Side }[];
  audienceVotes: [number, number];
}

interface Matchup {
  id: string;
  kind: MatchupKind;
  prompt: string;
  curbside: [string, string] | null;
  playerIds: [string, string];
  entries: [Entry, Entry];
  votes: Record<string, Side>;
  audienceVotes: Record<string, Side>;
  result: MatchupResult | null;
}

export interface GrandRoundsState extends BaseGameState {
  game: 'grand-rounds';
  phase: Phase<PhaseName>;
  round: number;
  matchups: Matchup[];
  current: number;
  /** Every finished matchup, for end-of-game highlights. */
  archive: { round: number; prompt: string; kind: MatchupKind; entries: Entry[]; result: MatchupResult }[];
}

export type GrandRoundsAction =
  | { type: 'answer'; matchupId: string; text: string; final: boolean }
  | { type: 'list'; matchupId: string; items: string[]; final: boolean }
  | { type: 'doodle'; matchupId: string; drawing: Drawing; final: boolean }
  | { type: 'curbside'; matchupId: string }
  | { type: 'vote'; side: Side };

// ── Views ────────────────────────────────────────────────────────────────────

export interface EntryView {
  text: string | null;
  items: string[] | null;
  drawingId: string | null;
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
  entries: [EntryView, EntryView];
  result: MatchupResult | null;
  /** How many votes are in (shown during voting, not who for). */
  votesIn: number;
  votersExpected: number;
  /** Viewer-specific. */
  canVote: boolean;
  myVote: Side | null;
  /** Which side is the viewer's own answer (only ever told to its author). */
  yours: Side | null;
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
}

// ── Module ───────────────────────────────────────────────────────────────────

const ROUNDS = 3;

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
      archive: [],
    };
    startRound(state, ctx);
    return state;
  },

  act(state, ctx, playerId, action) {
    if (action.type === 'vote') return vote(state, ctx, playerId, action.side);
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
        if (needsVote(state, ctx)) setPhase(state, ctx, 'vote', GR.vote, 'input');
        else finish(state, ctx);
        return;
      case 'vote':
        finish(state, ctx);
        return;
      case 'results':
        if (state.current + 1 < state.matchups.length) beginPresent(state, ctx, state.current + 1);
        else if (state.round + 1 < ROUNDS) {
          ctx.say('scoreboard');
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
      if (!live(m, ctx, 0) || !live(m, ctx, 1) || (v.players.length > 0 && v.players.every((id) => id in m.votes))) finish(state, ctx);
    }
  },

  hide(state, ctx, target) {
    const matchup = state.matchups[state.current];
    if (!matchup || !['present', 'vote', 'results'].includes(state.phase.name)) return;
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
    };
  },

  bot(state, ctx, botId) {
    if (state.phase.name === 'write') {
      const mine = state.matchups.filter((m) => m.playerIds.includes(botId) && !m.entries[m.playerIds.indexOf(botId)].final);
      if (!mine.length) return false;
      for (const m of mine) {
        const entry = m.entries[m.playerIds.indexOf(botId)];
        if (m.kind === 'doodle') write(m, entry, ctx, { type: 'doodle', matchupId: m.id, drawing: scribble(ctx), final: true });
        else if (m.kind === 'differential')
          write(m, entry, ctx, { type: 'list', matchupId: m.id, items: [0, 1, 2].map(() => ctx.rng.pick(curbsideGeneric)), final: true });
        else write(m, entry, ctx, { type: 'curbside', matchupId: m.id });
      }
      if (allWritten(state, ctx)) beginPresent(state, ctx, 0);
      return true;
    }
    if (state.phase.name === 'vote') {
      const m = state.matchups[state.current];
      if (m.playerIds.includes(botId) || botId in m.votes) return false;
      vote(state, ctx, botId, ctx.rng.int(2) as Side);
      return true;
    }
    return false;
  },
};

// ── Rounds ───────────────────────────────────────────────────────────────────

function startRound(state: GrandRoundsState, ctx: GameContext) {
  const order = ctx.rng.shuffle(state.playerIds.filter((id) => ctx.person(id)));
  state.current = 0;

  if (state.round < 2) {
    const kinds: MatchupKind[] =
      state.round === 1 && ctx.room.settings.doodles ? mixedKinds(order.length) : order.map(() => 'quip');
    const quipPool = ctx.draw(quips, kinds.filter((k) => k === 'quip').length);
    const doodlePool = ctx.draw(doodles, kinds.filter((k) => k === 'doodle').length);
    state.matchups = spreadOrder(
      ring(order).map((pair, i) => {
        if (kinds[i] === 'doodle') return newMatchup(ctx, 'doodle', doodlePool.pop()!.text, null, pair);
        const q = quipPool.pop()!;
        return newMatchup(ctx, 'quip', q.text, q.curbside, pair);
      }),
    );
  } else {
    const lastPlace = order.slice().sort((a, b) => state.scores[a] - state.scores[b])[0];
    const pairs = finalePairs(order, lastPlace);
    const prompts = ctx.draw(differentials, pairs.length);
    state.matchups = pairs.map((pair, i) => {
      const m = newMatchup(ctx, 'differential', prompts[i].text, null, pair);
      if (pair[1] === BEEP) Object.assign(m.entries[1], { items: [...prompts[i].beep], final: true });
      return m;
    });
  }

  ctx.say(state.round === 0 ? 'roundOneIntro' : state.round === 1 ? 'roundTwoIntro' : 'finalIntro');
  setPhase(state, ctx, 'intro', GR.intro);
}

function newMatchup(
  ctx: GameContext,
  kind: MatchupKind,
  prompt: string,
  curbside: [string, string] | null,
  playerIds: [string, string],
): Matchup {
  const entry = (playerId: string): Entry => ({
    playerId,
    text: null,
    items: null,
    drawingId: null,
    curbside: false,
    final: false,
    hidden: false,
  });
  return {
    id: ctx.rng.id(8),
    kind,
    prompt,
    curbside,
    playerIds,
    entries: [entry(playerIds[0]), entry(playerIds[1])],
    votes: {},
    audienceVotes: {},
    result: null,
  };
}

function writeDuration(state: GrandRoundsState, ctx: GameContext) {
  if (state.round === 2) return GR.writeDifferential;
  return state.round === 1 && ctx.room.settings.doodles ? GR.writeMixed : GR.writeQuips;
}

// ── Writing ──────────────────────────────────────────────────────────────────

const BLOCKED = 'The room’s filter blocked that — try different words.';

function write(matchup: Matchup, entry: Entry, ctx: GameContext, action: GrandRoundsAction): ActionOutcome | void {
  const level = ctx.room.settings.filter;
  switch (action.type) {
    case 'answer': {
      if (matchup.kind !== 'quip') return { error: 'Wrong kind of answer.' };
      const text = cleanText(action.text, LIMITS.quip);
      if (action.final && !text) return { error: 'Write something first!' };
      if (text && !isAllowed(text, level)) return { error: BLOCKED };
      entry.text = text || null;
      entry.curbside = false;
      entry.final = action.final;
      return;
    }
    case 'list': {
      if (matchup.kind !== 'differential') return { error: 'Wrong kind of answer.' };
      const items = action.items.slice(0, 3).map((s) => cleanText(String(s), LIMITS.differentialItem));
      if (action.final && items.filter(Boolean).length < 3) return { error: 'Your differential needs all three!' };
      if (items.some((s) => s && !isAllowed(s, level))) return { error: BLOCKED };
      entry.items = items.some(Boolean) ? items : null;
      entry.final = action.final;
      return;
    }
    case 'doodle': {
      if (matchup.kind !== 'doodle') return { error: 'Wrong kind of answer.' };
      if (!validDrawing(action.drawing)) return { error: 'That drawing didn’t come through — try again.' };
      if (action.final && action.drawing.strokes.length === 0) return { error: 'Draw something first!' };
      entry.drawingId ??= ctx.rng.id(10);
      ctx.room.drawings[entry.drawingId] = action.drawing;
      entry.final = action.final;
      return;
    }
    case 'curbside': {
      if (matchup.kind !== 'quip') return { error: 'No curbside consults on this one.' };
      entry.text = matchup.curbside ? ctx.rng.pick(matchup.curbside) : ctx.rng.pick(curbsideGeneric);
      entry.curbside = true;
      entry.final = true;
      return { notice: entry.text };
    }
  }
}

function hasContent(entry: Entry) {
  return Boolean(entry.text || entry.items?.some(Boolean) || entry.drawingId);
}

/** Who still owes an answer (connected players only — we don't wait for dropouts). */
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
        draft: m.kind === 'differential' ? e.items : m.kind === 'quip' ? e.text : null,
        canCurbside: m.kind === 'quip',
      };
    });
}

// ── Presenting & voting ──────────────────────────────────────────────────────

function beginPresent(state: GrandRoundsState, ctx: GameContext, index: number) {
  state.current = index;
  const m = state.matchups[index];
  // Drafts that never got submitted still count when the timer runs out.
  for (const e of m.entries) e.final = e.final || hasContent(e);
  setPhase(state, ctx, 'present', GR.present[m.kind]);
}

function live(m: Matchup, ctx: GameContext, side: Side) {
  const e = m.entries[side];
  const present = e.playerId === BEEP || ctx.person(e.playerId);
  return Boolean(present && !e.hidden && hasContent(e));
}

function isDuplicate(m: Matchup) {
  const [a, b] = m.entries;
  if (m.kind === 'quip') return Boolean(a.text && b.text && sameAnswer(a.text, b.text));
  if (m.kind === 'differential' && a.items && b.items)
    return a.items.every((item, i) => sameAnswer(item, b.items![i] ?? ''));
  return false;
}

/** People who may vote on the current matchup. */
function voters(state: GrandRoundsState, ctx: GameContext, m: Matchup) {
  const players = ctx.connectedPlayers(state.playerIds).filter((id) => !m.playerIds.includes(id));
  const audience = ctx.room.settings.audience
    ? ctx.room.people.filter((p) => p.connected && !state.playerIds.includes(p.id)).map((p) => p.id)
    : [];
  return { players, audience };
}

function needsVote(state: GrandRoundsState, ctx: GameContext) {
  const m = state.matchups[state.current];
  if (!live(m, ctx, 0) || !live(m, ctx, 1) || isDuplicate(m)) return false;
  const v = voters(state, ctx, m);
  return v.players.length + v.audience.length > 0;
}

function vote(state: GrandRoundsState, ctx: GameContext, voterId: string, side: Side): ActionOutcome | void {
  const m = state.matchups[state.current];
  if (state.phase.name !== 'vote' || !m) return { error: 'Voting is closed.' };
  if (side !== 0 && side !== 1) return;
  if (m.playerIds.includes(voterId)) return { error: 'No voting for yourself!' };
  const v = voters(state, ctx, m);
  if (v.players.includes(voterId)) m.votes[voterId] = side;
  else if (v.audience.includes(voterId)) m.audienceVotes[voterId] = side;
  else return { error: 'You can’t vote on this one.' };
  if (v.players.length > 0 && v.players.every((id) => id in m.votes)) finish(state, ctx);
}

// ── Results ──────────────────────────────────────────────────────────────────

function finish(state: GrandRoundsState, ctx: GameContext) {
  const m = state.matchups[state.current];
  const multiplier = GR.multipliers[state.round];
  const curbside: [boolean, boolean] = [m.entries[0].curbside, m.entries[1].curbside];
  const alive: [boolean, boolean] = [live(m, ctx, 0), live(m, ctx, 1)];
  const playerVotes = Object.entries(m.votes).map(([voterId, side]) => ({ voterId, side }));
  const audienceVotes: [number, number] = [0, 0];
  for (const side of Object.values(m.audienceVotes)) audienceVotes[side] += 1;
  const base = { playerVotes, audienceVotes, consensus: false };

  let result: MatchupResult;
  if (!alive[0] && !alive[1]) {
    result = { ...base, outcome: 'empty', shares: [0, 0], points: [0, 0], winner: null };
    ctx.say('forfeit');
  } else if (alive[0] !== alive[1]) {
    const winner: Side = alive[0] ? 0 : 1;
    result = {
      ...base,
      outcome: 'forfeit',
      shares: winner === 0 ? [1, 0] : [0, 1],
      points: scoreForfeit(winner, multiplier, curbside[winner]),
      winner,
    };
    ctx.say('forfeit');
  } else if (isDuplicate(m)) {
    result = { ...base, outcome: 'duplicate', shares: [0.5, 0.5], points: [0, 0], winner: null };
    ctx.say('duplicate');
  } else {
    const counts: [number, number] = [0, 0];
    for (const v of playerVotes) counts[v.side] += 1;
    const score = scoreVotes({ players: counts, audience: audienceVotes, multiplier, curbside });
    result = { ...base, outcome: 'vote', ...score };
    const w = score.winner;
    if (w === null) ctx.say('tie');
    else if (m.entries[w].playerId === BEEP) ctx.say('beepWins');
    else if (score.consensus) ctx.say('consensus');
    else if (curbside[w]) ctx.say('curbsideWin');
    else if (score.shares[w] >= 0.75) ctx.say('blowout');
  }

  m.result = result;
  m.entries.forEach((e, side) => {
    if (e.playerId !== BEEP && e.playerId in state.scores) state.scores[e.playerId] += result.points[side];
  });
  state.archive.push({ round: state.round, prompt: m.prompt, kind: m.kind, entries: m.entries, result });
  setPhase(state, ctx, 'results', GR.results);
}

function matchupView(state: GrandRoundsState, ctx: GameContext, m: Matchup, viewer: Viewer): MatchupView {
  const revealed = state.phase.name === 'results';
  const v = voters(state, ctx, m);
  const viewerId = viewer.kind === 'stage' ? null : viewer.id;
  const canVote =
    state.phase.name === 'vote' && viewerId !== null && (v.players.includes(viewerId) || v.audience.includes(viewerId));
  const entry = (e: Entry): EntryView => {
    const hide = e.hidden || (e.playerId !== BEEP && !ctx.person(e.playerId));
    return {
      text: hide ? null : e.text,
      items: hide ? null : e.items,
      drawingId: hide ? null : e.drawingId,
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
    entries: [entry(m.entries[0]), entry(m.entries[1])],
    result: revealed ? m.result : null,
    votesIn: Object.keys(m.votes).length + Object.keys(m.audienceVotes).length,
    votersExpected: v.players.length,
    canVote,
    myVote: viewerId ? (m.votes[viewerId] ?? m.audienceVotes[viewerId] ?? null) : null,
    yours: viewerId && m.playerIds.includes(viewerId) ? (m.playerIds.indexOf(viewerId) as Side) : null,
  };
}

// ── Highlights ───────────────────────────────────────────────────────────────

function highlights(state: GrandRoundsState, ctx: GameContext): Highlight[] {
  const out: Highlight[] = [];
  const voted = state.archive.filter((a) => a.result.outcome === 'vote' && a.result.winner !== null);

  const best = voted
    .filter((a) => a.result.playerVotes.length + a.result.audienceVotes[0] + a.result.audienceVotes[1] >= 2)
    .sort((x, y) => y.result.shares[y.result.winner!] - x.result.shares[x.result.winner!] || y.round - x.round)[0];
  if (best) {
    const e = best.entries[best.result.winner!];
    const line = e.text ?? e.items?.join(' · ') ?? `their doodle of “${best.prompt}”`;
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

// ── Bots ─────────────────────────────────────────────────────────────────────

function scribble(ctx: GameContext): Drawing {
  const strokes = Array.from({ length: 3 + ctx.rng.int(4) }, () => {
    const p: number[] = [];
    let x = 200 + ctx.rng.int(600);
    let y = 200 + ctx.rng.int(600);
    for (let i = 0; i < 24; i++) {
      x = Math.max(20, Math.min(980, x + ctx.rng.int(90) - 45));
      y = Math.max(20, Math.min(980, y + ctx.rng.int(90) - 45));
      p.push(x, y);
    }
    return { c: ctx.rng.int(5), w: ctx.rng.int(3), p };
  });
  return { strokes };
}
