import { type SketchTerm, sketchTerms } from '@iatrome/content';
import { LIMITS, SKETCH as SK } from '../constants';
import { type DrawOp, applyDrawOp } from '../drawing';
import { cleanText, comparable, matchGuess } from '../text';
import type { GameResult, Highlight, Phase } from '../types';
import { type ActionOutcome, type BaseGameState, type GameContext, type GameModule, setPhase, standings, statted, tidy } from './context';

/**
 * Sketch: one player draws a secret term live; everyone races to guess.
 * Small groups go round twice. Solvers heckle with nudges, the room can flag
 * an artist for writing letters, and the night ends with a gallery of everything drawn.
 */

type PhaseName = 'intro' | 'choose' | 'draw' | 'reveal' | 'gallery' | 'done';

interface FeedItem {
  playerId: string;
  kind: 'guess' | 'correct';
  text: string;
  /** A near miss: never shown to the room (it would hand them the answer), only to the artist. */
  close?: boolean;
}

/** A feed line as shown: identical guesses collapse into one with a count. */
export interface FeedEntry {
  playerId: string;
  kind: 'guess' | 'correct';
  text: string;
  count: number;
  /** Index of the latest matching item in the state's feed (the host's hide target). */
  index: number;
  close?: boolean;
}

export interface Nudge {
  id: number;
  playerId: string;
  kind: 'warmer' | 'colder';
}

interface TurnRecord {
  drawer: string;
  term: string;
  drawingId: string | null;
  share: number;
  fastest: { playerId: string; ms: number } | null;
  flagged: boolean;
  /** The wrong guess the most people made, and the first of them to make it. */
  topWrong: { text: string; count: number; playerId: string } | null;
}

export interface SketchState extends BaseGameState {
  game: 'sketch';
  phase: Phase<PhaseName>;
  turns: string[];
  /** 2 when the group is small enough that everyone draws twice. */
  laps: number;
  turn: number;
  choices: SketchTerm[];
  term: SketchTerm | null;
  drawingId: string | null;
  /** Correct guessers → points earned, in order. */
  solved: { playerId: string; points: number }[];
  feed: FeedItem[];
  /** Letter positions to reveal as hints, in order. */
  hintOrder: number[];
  /** Hint beats already announced this turn. */
  hintBeats: number;
  drawerPoints: number;
  /** How long the first correct guess took this turn. */
  firstSolveMs: number | null;
  /** Guessers who flagged this drawing as written, not drawn. */
  flags: string[];
  /** Enough of the room flagged it: the artist earns nothing this turn. */
  flagged: boolean;
  nudges: Nudge[];
  nudgeSeq: number;
  lastNudge: Record<string, number>;
  /** Wrong guesses per player, for the end awards. */
  wrong: Record<string, number>;
  /** Each finished turn, for the gallery and the end-of-game awards. */
  history: TurnRecord[];
}

/**
 * Nudges and flags reuse existing command shapes: `vote` side 0 is "warmer", side 1 "colder";
 * `volunteer` toggles your "they're writing letters" flag.
 */
export type SketchAction =
  | { type: 'choose'; index: number }
  | { type: 'guess'; text: string }
  | { type: 'draw'; op: DrawOp }
  | { type: 'vote'; side: 0 | 1 }
  | { type: 'volunteer' };

export interface SketchView {
  game: 'sketch';
  phase: Phase<PhaseName>;
  turn: number;
  turns: number;
  /** Which lap this turn is in (1-based), of `laps`. */
  lap: number;
  laps: number;
  /** 2 in the final stretch, else 1. */
  multiplier: number;
  drawer: string | null;
  /** The secret: only for the drawer while drawing, and for everyone at the reveal. */
  term: string | null;
  /** "____ ___" with hint letters filled in over time; spaces separate words. */
  mask: string;
  choices: { answer: string; difficulty: number }[];
  drawingId: string | null;
  solved: { playerId: string; points: number }[];
  /** Grouped guesses. Near misses appear only in the artist's view. */
  feed: FeedEntry[];
  /** Viewer-specific: already got it. */
  youSolved: boolean;
  drawerPoints: number;
  scores: Record<string, number>;
  /** "They're writing letters" flags so far, and how many void the artist's points. */
  flags: number;
  flagNeed: number;
  youFlagged: boolean;
  flagged: boolean;
  /** The latest warmer/colder nudges from people who already got it. */
  nudges: Nudge[];
  /** Every drawing of the game, at the end. */
  gallery: { drawingId: string; term: string; drawer: string; share: number; flagged: boolean }[];
}

export const sketch: GameModule<SketchState, SketchAction, SketchView> = {
  id: 'sketch',
  minPlayers: SK.minPlayers,
  maxPlayers: SK.maxPlayers,

  start(ctx, playerIds) {
    const laps = playerIds.length <= SK.twoLapsUpTo ? 2 : 1;
    const first = ctx.rng.shuffle(playerIds);
    let turns = first;
    if (laps === 2) {
      // Second lap in a fresh order, but nobody draws twice in a row across the seam.
      let second = ctx.rng.shuffle(playerIds);
      if (second.length > 1 && second[0] === first.at(-1)) second = [...second.slice(1), second[0]];
      turns = [...first, ...second];
    }
    const state: SketchState = {
      game: 'sketch',
      playerIds,
      scores: Object.fromEntries(playerIds.map((id) => [id, 0])),
      phase: { name: 'intro', startedAt: ctx.now, endsAt: null },
      turns,
      laps,
      turn: 0,
      choices: [],
      term: null,
      drawingId: null,
      solved: [],
      feed: [],
      hintOrder: [],
      hintBeats: 0,
      drawerPoints: 0,
      firstSolveMs: null,
      flags: [],
      flagged: false,
      nudges: [],
      nudgeSeq: 0,
      lastNudge: {},
      wrong: {},
      history: [],
    };
    ctx.say('sketchIntro');
    setPhase(state, ctx, 'intro', SK.intro);
    return state;
  },

  act(state, ctx, playerId, action): ActionOutcome | void {
    const drawer = state.turns[state.turn];
    switch (action.type) {
      case 'choose':
        if (state.phase.name !== 'choose' || playerId !== drawer) return;
        beginDrawing(state, ctx, state.choices[action.index] ?? state.choices[0]);
        return;
      case 'draw': {
        if (state.phase.name !== 'draw' || playerId !== drawer || !state.drawingId) return { error: 'Not your turn to draw.' };
        if (!applyDrawOp(ctx.room.drawings[state.drawingId], action.op)) return { error: 'Canvas is full!' };
        return;
      }
      case 'guess':
        return guess(state, ctx, playerId, action.text);
      case 'vote':
        return nudge(state, ctx, playerId, action.side === 1 ? 'colder' : 'warmer');
      case 'volunteer':
        return flag(state, ctx, playerId);
    }
  },

  timeout(state, ctx) {
    switch (state.phase.name) {
      case 'intro':
        beginChoosing(state, ctx);
        return;
      case 'choose':
        beginDrawing(state, ctx, state.choices[0]);
        return;
      case 'draw':
        reveal(state, ctx);
        return;
      case 'reveal':
        state.turn += 1;
        if (state.turn < state.turns.length) beginChoosing(state, ctx);
        else finish(state, ctx);
        return;
      case 'gallery':
        setPhase(state, ctx, 'done', null);
        return;
    }
  },

  settle(state, ctx) {
    const drawer = state.turns[state.turn];
    const drawerGone = !ctx.connectedPlayers([drawer]).length;
    if (state.phase.name === 'choose' && drawerGone) {
      state.turn += 1;
      beginChoosing(state, ctx);
    } else if (state.phase.name === 'draw') {
      if (drawerGone || everyoneSolved(state, ctx)) reveal(state, ctx);
    }
  },

  hide(state, _ctx, target) {
    // Host removes a guess (and its duplicates) from the public feed.
    const item = state.feed[Number(target)];
    if (!Number.isInteger(Number(target)) || item?.kind !== 'guess') return;
    const key = feedKey(item.text);
    for (const f of state.feed) if (f.kind === 'guess' && feedKey(f.text) === key) f.text = '';
  },

  result(state, ctx): GameResult | null {
    if (state.phase.name !== 'done') return null;
    return { game: 'sketch', standings: standings(ctx, state.scores), highlights: highlights(state, ctx) };
  },

  wakeAt(state) {
    const { name, startedAt, endsAt } = state.phase;
    if (name !== 'draw' || endsAt === null) return [];
    return SK.hintsAt.map((f) => startedAt + f * (endsAt - startedAt));
  },

  tick(state, ctx) {
    // A hint beat: the mask gains letters, and Beep heckles the artist if nobody has it yet.
    if (state.phase.name !== 'draw') return false;
    const beats = hintSteps(state, ctx);
    if (beats <= state.hintBeats) return false;
    state.hintBeats = beats;
    const drawer = ctx.person(state.turns[state.turn]);
    if (!state.solved.length && drawer) ctx.say('sketchHint', { name: drawer.name });
    return true;
  },

  view(state, ctx, viewer) {
    const drawer = state.turns[state.turn] ?? null;
    const isDrawer = viewer.kind === 'player' && viewer.id === drawer;
    const revealing = state.phase.name === 'reveal';
    const term = state.term?.answer ?? '';
    const me = viewer.kind === 'stage' ? null : viewer.id;
    const lapLength = state.turns.length / state.laps;
    return {
      game: 'sketch',
      phase: state.phase,
      turn: state.turn,
      turns: state.turns.length,
      lap: Math.min(state.laps, Math.floor(state.turn / lapLength) + 1),
      laps: state.laps,
      multiplier: stretchFactor(state),
      drawer,
      term: (isDrawer && state.phase.name === 'draw') || revealing ? term : null,
      mask: revealing ? term : mask(term, state.hintOrder, hintsShown(state, ctx)),
      choices: isDrawer && state.phase.name === 'choose' ? state.choices.map((c) => ({ answer: c.answer, difficulty: c.difficulty })) : [],
      drawingId: state.drawingId,
      solved: state.solved,
      feed: groupFeed(state.feed, isDrawer),
      youSolved: me !== null && state.solved.some((s) => s.playerId === me),
      drawerPoints: state.drawerPoints,
      scores: state.scores,
      flags: liveFlags(state, ctx).length,
      flagNeed: flagNeed(state, ctx),
      youFlagged: me !== null && state.flags.includes(me),
      flagged: state.flagged,
      nudges: state.nudges,
      gallery:
        state.phase.name === 'gallery'
          ? state.history
              .filter((h) => h.drawingId && ctx.room.drawings[h.drawingId]?.strokes.length)
              .map((h) => ({ drawingId: h.drawingId!, term: h.term, drawer: h.drawer, share: h.share, flagged: h.flagged }))
          : [],
    };
  },

  statKey(state, _ctx, playerId) {
    if (!['choose', 'draw'].includes(state.phase.name) || !state.playerIds.includes(playerId)) return { error: 'Call it during a turn.' };
    if (state.solved.some((s) => s.playerId === playerId)) return { error: 'Too late, you already got this one.' };
    return `t${state.turn}`;
  },

  statRound(state) {
    return { key: `t${state.turn}`, revealed: state.phase.name === 'reveal' };
  },
};

/** The final third of the turns pay double: the comeback stretch. */
function stretchFactor(state: SketchState) {
  const fromTurn = state.turns.length - Math.ceil(state.turns.length * SK.finalStretch);
  return state.turn >= fromTurn ? SK.finalStretchFactor : 1;
}

function guessersOf(state: SketchState, ctx: GameContext) {
  const drawer = state.turns[state.turn];
  return ctx.connectedPlayers(state.playerIds).filter((id) => id !== drawer);
}

function everyoneSolved(state: SketchState, ctx: GameContext) {
  return guessersOf(state, ctx).every((id) => state.solved.some((s) => s.playerId === id));
}

function beginChoosing(state: SketchState, ctx: GameContext) {
  // Skip drawers who left the room.
  while (state.turn < state.turns.length && !ctx.person(state.turns[state.turn])) state.turn += 1;
  if (state.turn >= state.turns.length) {
    finish(state, ctx);
    return;
  }
  const byDifficulty = (d: number) => ctx.draw(sketchTerms.filter((t) => t.difficulty === d), 1);
  state.choices = [1, 2, 3].flatMap(byDifficulty);
  state.term = null;
  state.drawingId = null;
  state.solved = [];
  state.firstSolveMs = null;
  state.feed = [];
  state.drawerPoints = 0;
  state.hintBeats = 0;
  state.flags = [];
  state.flagged = false;
  state.nudges = [];
  state.lastNudge = {};
  setPhase(state, ctx, 'choose', SK.choose, 'input');
}

function beginDrawing(state: SketchState, ctx: GameContext, term: SketchTerm) {
  state.term = term;
  state.drawingId = ctx.rng.id(10);
  ctx.room.drawings[state.drawingId] = { strokes: [] };
  const letters = [...term.answer].map((ch, i) => (/[a-z0-9]/i.test(ch) ? i : -1)).filter((i) => i >= 0);
  state.hintOrder = ctx.rng.shuffle(letters).slice(0, Math.max(0, Math.floor(letters.length / 3)));
  setPhase(state, ctx, 'draw', state.laps > 1 ? SK.drawTwoLaps : SK.draw, 'input');
}

/** The gallery of everything drawn, then the podium. */
function finish(state: SketchState, ctx: GameContext) {
  const drawn = state.history.filter((h) => h.drawingId && ctx.room.drawings[h.drawingId]?.strokes.length).length;
  if (!drawn) {
    setPhase(state, ctx, 'done', null);
    return;
  }
  setPhase(state, ctx, 'gallery', Math.min(SK.galleryMax, SK.gallery + SK.galleryPerDrawing * drawn));
}

/** How many hint beats (of `hintsAt`) have passed this drawing. */
function hintSteps(state: SketchState, ctx: GameContext) {
  if (state.phase.name !== 'draw' || !state.phase.endsAt) return 0;
  const elapsed = (ctx.now - state.phase.startedAt) / (state.phase.endsAt - state.phase.startedAt);
  return SK.hintsAt.filter((f) => elapsed >= f).length;
}

/** Hints unlock at 45% and 70% of the drawing time (more for long answers). */
function hintsShown(state: SketchState, ctx: GameContext) {
  return Math.min(state.hintOrder.length, Math.ceil((hintSteps(state, ctx) * state.hintOrder.length) / 2));
}

/** "____ ___" with the first `hints` letters of `hintOrder` revealed. */
function mask(term: string, hintOrder: number[], hints: number) {
  const shown = new Set(hintOrder.slice(0, hints));
  return [...term].map((ch, i) => (/[a-z0-9]/i.test(ch) && !shown.has(i) ? '_' : ch)).join('');
}

const feedKey = (text: string) => comparable(text) || text.toLowerCase();

/** Identical guesses show once with a count, bumped to the latest spot. */
function groupFeed(feed: FeedItem[], includeClose: boolean): FeedEntry[] {
  const out: FeedEntry[] = [];
  const byKey = new Map<string, FeedEntry>();
  feed.forEach((f, index) => {
    if (f.kind === 'correct') {
      out.push({ playerId: f.playerId, kind: 'correct', text: '', count: 1, index });
      return;
    }
    if (!f.text || (f.close && !includeClose)) return;
    const key = feedKey(f.text);
    const prev = byKey.get(key);
    if (prev) {
      prev.count += 1;
      prev.index = index;
      out.splice(out.indexOf(prev), 1);
      out.push(prev);
      return;
    }
    const entry: FeedEntry = { playerId: f.playerId, kind: 'guess', text: f.text, count: 1, index, ...(f.close ? { close: true } : {}) };
    byKey.set(key, entry);
    out.push(entry);
  });
  return out.slice(-12);
}

function guess(state: SketchState, ctx: GameContext, playerId: string, raw: string): ActionOutcome | void {
  const drawer = state.turns[state.turn];
  if (state.phase.name !== 'draw' || !state.term) return { error: 'Hold that thought!' };
  if (playerId === drawer) return { error: 'No guessing your own drawing!' };
  if (!state.playerIds.includes(playerId)) return { error: 'Only players can guess.' };
  if (state.solved.some((s) => s.playerId === playerId)) return;
  const text = cleanText(raw, LIMITS.guess);
  if (!text) return;

  const outcome = matchGuess(text, [state.term.answer, ...state.term.accept]);
  if (outcome === 'correct') {
    const elapsed = (ctx.now - state.phase.startedAt) / ((state.phase.endsAt ?? ctx.now) - state.phase.startedAt || 1);
    const round = `t${state.turn}`;
    const pay = (SK.difficultyPay[state.term.difficulty - 1] ?? 1) * stretchFactor(state);
    const points = statted(state, playerId, round, tidy((SK.guessMax - (SK.guessMax - SK.guessMin) * Math.min(1, Math.max(0, elapsed))) * pay));
    // A drawing the room flagged as handwriting earns its artist nothing.
    const art = state.flagged ? 0 : statted(state, drawer, round, tidy(points * SK.drawerShare));
    if (!state.solved.length) {
      state.firstSolveMs = ctx.now - state.phase.startedAt;
      const p = ctx.person(playerId);
      if (p) ctx.say('sketchFirst', { name: p.name });
    }
    state.solved.push({ playerId, points });
    state.scores[playerId] += points;
    state.scores[drawer] += art;
    state.drawerPoints += art;
    state.feed.push({ playerId, kind: 'correct', text: '' });
    if (everyoneSolved(state, ctx)) reveal(state, ctx);
    return { notice: 'correct' };
  }
  state.wrong[playerId] = (state.wrong[playerId] ?? 0) + 1;
  state.feed.push({ playerId, kind: 'guess', text, ...(outcome === 'close' ? { close: true } : {}) });
  if (state.feed.length > 60) state.feed.splice(0, state.feed.length - 60);
  if (outcome === 'close') return { notice: 'close' };
}

/** Someone who already got it tells the room it's getting warmer (or colder). */
function nudge(state: SketchState, ctx: GameContext, playerId: string, kind: Nudge['kind']): ActionOutcome | void {
  if (state.phase.name !== 'draw') return;
  if (!state.solved.some((s) => s.playerId === playerId)) return { error: 'Get it first, then you can heckle.' };
  if (ctx.now - (state.lastNudge[playerId] ?? 0) < SK.nudgeCooldown) return;
  state.lastNudge[playerId] = ctx.now;
  state.nudgeSeq += 1;
  state.nudges = [...state.nudges.slice(-5), { id: state.nudgeSeq, playerId, kind }];
}

const liveFlags = (state: SketchState, ctx: GameContext) => ctx.connectedPlayers(state.flags);

/** At least half the guessers, and never fewer than two (one sore loser can't void a drawing). */
function flagNeed(state: SketchState, ctx: GameContext) {
  const guessers = guessersOf(state, ctx).length;
  return Math.max(Math.min(2, guessers), Math.ceil(guessers * SK.flagShare));
}

/** "They're writing letters": toggles your flag; enough flags void the artist's points for the turn. */
function flag(state: SketchState, ctx: GameContext, playerId: string): ActionOutcome | void {
  const drawer = state.turns[state.turn];
  if (state.phase.name !== 'draw') return { error: 'Flag it while they draw.' };
  if (playerId === drawer || !state.playerIds.includes(playerId) || state.flagged) return;
  state.flags = state.flags.includes(playerId) ? state.flags.filter((id) => id !== playerId) : [...state.flags, playerId];
  if (liveFlags(state, ctx).length >= flagNeed(state, ctx)) {
    state.flagged = true;
    state.scores[drawer] -= state.drawerPoints;
    state.drawerPoints = 0;
  }
}

function reveal(state: SketchState, ctx: GameContext) {
  const drawer = state.turns[state.turn];
  const guessers = state.playerIds.filter((id) => id !== drawer && ctx.person(id));
  if (state.term) {
    const first = state.solved[0];
    state.history.push({
      drawer,
      term: state.term.answer,
      drawingId: state.drawingId,
      share: guessers.length ? state.solved.length / guessers.length : 0,
      fastest: first ? { playerId: first.playerId, ms: state.firstSolveMs ?? 0 } : null,
      flagged: state.flagged,
      topWrong: topWrong(state.feed),
    });
  }
  if (state.solved.length === 0) ctx.say('sketchNobodyGotIt');
  else if (state.solved.length >= guessers.length) ctx.say('sketchEveryoneGotIt');
  setPhase(state, ctx, 'reveal', SK.reveal);
}

/** The wrong guess the most different people made this turn (near misses don't count). */
function topWrong(feed: FeedItem[]): TurnRecord['topWrong'] {
  const by = new Map<string, { text: string; who: Set<string>; playerId: string }>();
  for (const f of feed) {
    if (f.kind !== 'guess' || f.close || !f.text) continue;
    const key = feedKey(f.text);
    const entry = by.get(key) ?? { text: f.text, who: new Set<string>(), playerId: f.playerId };
    entry.who.add(f.playerId);
    by.set(key, entry);
  }
  const best = [...by.values()].sort((a, b) => b.who.size - a.who.size)[0];
  return best ? { text: best.text, count: best.who.size, playerId: best.playerId } : null;
}

/** End-of-game awards, all from what actually happened. */
function highlights(state: SketchState, ctx: GameContext): Highlight[] {
  const out: Highlight[] = [];
  const here = (id: string) => Boolean(ctx.person(id));
  const fastest = state.history.filter((h) => h.fastest && here(h.fastest.playerId)).sort((a, b) => a.fastest!.ms - b.fastest!.ms)[0];
  if (fastest?.fastest)
    out.push({ title: 'Speed Reader', playerId: fastest.fastest.playerId, detail: `Got “${fastest.term}” in ${Math.max(1, Math.round(fastest.fastest.ms / 1000))}s` });

  const lost = state.history.filter((h) => here(h.drawer) && h.share === 0 && !h.flagged)[0];
  if (lost) out.push({ title: 'Abstract Expressionist', playerId: lost.drawer, detail: `Nobody got “${lost.term}”` });

  const caught = state.history.filter((h) => here(h.drawer) && h.flagged)[0];
  if (caught) out.push({ title: 'Wrote a Prescription', playerId: caught.drawer, detail: `Caught writing “${caught.term}”` });

  const misread = state.history.filter((h) => h.topWrong && h.topWrong.count >= 2 && here(h.topWrong.playerId)).sort((a, b) => b.topWrong!.count - a.topWrong!.count)[0];
  if (misread?.topWrong)
    out.push({ title: 'Popular Misdiagnosis', playerId: misread.topWrong.playerId, detail: `${misread.topWrong.count} people said “${misread.topWrong.text}” for “${misread.term}”` });

  const shotgun = Object.entries(state.wrong).filter(([id, n]) => here(id) && n >= 5).sort((a, b) => b[1] - a[1])[0];
  if (shotgun) out.push({ title: 'Shotgun Differential', playerId: shotgun[0], detail: `${shotgun[1]} wrong guesses, undeterred` });

  const legible = state.history.filter((h) => here(h.drawer) && h.share > 0 && !h.flagged).sort((a, b) => b.share - a.share)[0];
  if (legible)
    out.push({
      title: legible.share >= 1 ? 'Suspiciously Legible' : 'Most Legible',
      playerId: legible.drawer,
      detail: legible.share >= 1 ? `Everyone got “${legible.term}”` : `${Math.round(legible.share * 100)}% got “${legible.term}”`,
    });
  return out.slice(0, 5);
}
