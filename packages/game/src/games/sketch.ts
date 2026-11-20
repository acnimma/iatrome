import { type SketchTerm, sketchTerms } from '@iatrome/content';
import { LIMITS, SKETCH as SK } from '../constants';
import { type DrawOp, applyDrawOp } from '../drawing';
import { cleanText, matchGuess } from '../text';
import type { GameResult, Phase } from '../types';
import { type ActionOutcome, type BaseGameState, type GameContext, type GameModule, setPhase, standings, tidy } from './context';

/**
 * Sketch: one player draws a secret term live; everyone races to guess.
 */

type PhaseName = 'intro' | 'choose' | 'draw' | 'reveal' | 'done';

interface FeedItem {
  playerId: string;
  kind: 'guess' | 'correct';
  text: string;
}

export interface SketchState extends BaseGameState {
  game: 'sketch';
  phase: Phase<PhaseName>;
  turns: string[];
  turn: number;
  choices: SketchTerm[];
  term: SketchTerm | null;
  drawingId: string | null;
  /** Correct guessers → points earned, in order. */
  solved: { playerId: string; points: number }[];
  feed: FeedItem[];
  /** Letter positions to reveal as hints, in order. */
  hintOrder: number[];
  drawerPoints: number;
}

export type SketchAction =
  | { type: 'choose'; index: number }
  | { type: 'guess'; text: string }
  | { type: 'draw'; op: DrawOp };

export interface SketchView {
  game: 'sketch';
  phase: Phase<PhaseName>;
  turn: number;
  turns: number;
  drawer: string | null;
  /** The secret: only for the drawer while drawing, and for everyone at the reveal. */
  term: string | null;
  /** "_ _ _ _   _ _ _" with hint letters filled in over time. */
  mask: string;
  choices: { answer: string; difficulty: number }[];
  drawingId: string | null;
  solved: { playerId: string; points: number }[];
  feed: FeedItem[];
  /** Viewer-specific: already got it. */
  youSolved: boolean;
  drawerPoints: number;
  scores: Record<string, number>;
}

export const sketch: GameModule<SketchState, SketchAction, SketchView> = {
  id: 'sketch',
  minPlayers: SK.minPlayers,
  maxPlayers: SK.maxPlayers,

  start(ctx, playerIds) {
    const order = ctx.rng.shuffle(playerIds);
    const turns = order;
    const state: SketchState = {
      game: 'sketch',
      playerIds,
      scores: Object.fromEntries(playerIds.map((id) => [id, 0])),
      phase: { name: 'intro', startedAt: ctx.now, endsAt: null },
      turns,
      turn: 0,
      choices: [],
      term: null,
      drawingId: null,
      solved: [],
      feed: [],
      hintOrder: [],
      drawerPoints: 0,
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
        else setPhase(state, ctx, 'done', null);
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
      const guessers = ctx.connectedPlayers(state.playerIds).filter((id) => id !== drawer);
      if (drawerGone || guessers.every((id) => state.solved.some((s) => s.playerId === id))) reveal(state, ctx);
    }
  },

  hide(state, _ctx, target) {
    // Host removes a guess from the public feed.
    const index = Number(target);
    if (Number.isInteger(index) && state.feed[index]?.kind === 'guess') state.feed[index].text = '';
  },

  result(state, ctx): GameResult | null {
    if (state.phase.name !== 'done') return null;
    return { game: 'sketch', standings: standings(ctx, state.scores), highlights: [] };
  },

  view(state, ctx, viewer) {
    const drawer = state.turns[state.turn] ?? null;
    const isDrawer = viewer.kind === 'player' && viewer.id === drawer;
    const revealing = state.phase.name === 'reveal';
    const term = state.term?.answer ?? '';
    return {
      game: 'sketch',
      phase: state.phase,
      turn: state.turn,
      turns: state.turns.length,
      drawer,
      term: (isDrawer && state.phase.name === 'draw') || revealing ? term : null,
      mask: revealing ? term : mask(term, state.hintOrder, hintsShown(state, ctx)),
      choices: isDrawer && state.phase.name === 'choose' ? state.choices.map((c) => ({ answer: c.answer, difficulty: c.difficulty })) : [],
      drawingId: state.drawingId,
      solved: state.solved,
      feed: state.feed.filter((f) => f.kind === 'correct' || f.text).slice(-12),
      youSolved: viewer.kind !== 'stage' && state.solved.some((s) => s.playerId === viewer.id),
      drawerPoints: state.drawerPoints,
      scores: state.scores,
    };
  },

  bot(state, ctx, botId) {
    const drawer = state.turns[state.turn];
    if (state.phase.name === 'choose' && botId === drawer) {
      beginDrawing(state, ctx, ctx.rng.pick(state.choices));
      return true;
    }
    if (state.phase.name === 'draw') {
      if (botId === drawer) {
        const d = ctx.room.drawings[state.drawingId!];
        if (d.strokes.length >= 4) return false;
        const p: number[] = [];
        for (let i = 0; i < 16; i++) p.push(150 + ctx.rng.int(700), 150 + ctx.rng.int(700));
        applyDrawOp(d, { op: 'begin', c: ctx.rng.int(5), w: 1, p });
        return true;
      }
      if (state.solved.some((s) => s.playerId === botId) || state.feed.some((f) => f.playerId === botId)) return false;
      guess(state, ctx, botId, ctx.rng.next() < 0.6 ? state.term!.answer : ctx.rng.pick(sketchTerms).answer);
      return true;
    }
    return false;
  },
};

function beginChoosing(state: SketchState, ctx: GameContext) {
  // Skip drawers who left the room.
  while (state.turn < state.turns.length && !ctx.person(state.turns[state.turn])) state.turn += 1;
  if (state.turn >= state.turns.length) {
    setPhase(state, ctx, 'done', null);
    return;
  }
  const byDifficulty = (d: number) => ctx.draw(sketchTerms.filter((t) => t.difficulty === d), 1);
  state.choices = [1, 2, 3].flatMap(byDifficulty);
  state.term = null;
  state.drawingId = null;
  state.solved = [];
  state.feed = [];
  state.drawerPoints = 0;
  setPhase(state, ctx, 'choose', SK.choose, 'input');
}

function beginDrawing(state: SketchState, ctx: GameContext, term: SketchTerm) {
  state.term = term;
  state.drawingId = ctx.rng.id(10);
  ctx.room.drawings[state.drawingId] = { strokes: [] };
  const letters = [...term.answer].map((ch, i) => (/[a-z0-9]/i.test(ch) ? i : -1)).filter((i) => i >= 0);
  state.hintOrder = ctx.rng.shuffle(letters).slice(0, Math.max(0, Math.floor(letters.length / 3)));
  setPhase(state, ctx, 'draw', SK.draw, 'input');
}

/** Hints unlock at 45% and 70% of the drawing time (more for long answers). */
function hintsShown(state: SketchState, ctx: GameContext) {
  if (state.phase.name !== 'draw' || !state.phase.endsAt) return 0;
  const elapsed = (ctx.now - state.phase.startedAt) / (state.phase.endsAt - state.phase.startedAt);
  const steps = elapsed >= 0.7 ? 2 : elapsed >= 0.45 ? 1 : 0;
  return Math.min(state.hintOrder.length, Math.ceil((steps * state.hintOrder.length) / 2));
}

/** "_ _ _ _" with the first `hints` letters of `hintOrder` revealed. */
function mask(term: string, hintOrder: number[], hints: number) {
  const shown = new Set(hintOrder.slice(0, hints));
  return [...term].map((ch, i) => (/[a-z0-9]/i.test(ch) && !shown.has(i) ? '_' : ch)).join('');
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
    const points = tidy(SK.guessMax - (SK.guessMax - SK.guessMin) * Math.min(1, Math.max(0, elapsed)));
    state.solved.push({ playerId, points });
    state.scores[playerId] += points;
    state.scores[drawer] += SK.drawerPerGuess;
    state.drawerPoints += SK.drawerPerGuess;
    state.feed.push({ playerId, kind: 'correct', text: '' });
    const guessers = ctx.connectedPlayers(state.playerIds).filter((id) => id !== drawer);
    if (guessers.every((id) => state.solved.some((s) => s.playerId === id))) reveal(state, ctx);
    return { notice: 'correct' };
  }
  state.feed.push({ playerId, kind: 'guess', text });
  if (state.feed.length > 40) state.feed.splice(0, state.feed.length - 40);
  if (outcome === 'close') return { notice: 'close' };
}

function reveal(state: SketchState, ctx: GameContext) {
  const guessers = state.playerIds.filter((id) => id !== state.turns[state.turn] && ctx.person(id));
  if (state.solved.length === 0) ctx.say('sketchNobodyGotIt');
  else if (state.solved.length >= guessers.length) ctx.say('sketchEveryoneGotIt');
  setPhase(state, ctx, 'reveal', SK.reveal);
}
