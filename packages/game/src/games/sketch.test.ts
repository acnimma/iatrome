import { describe, expect, it } from 'vitest';
import { SKETCH } from '../constants';
import { advance, createRoom, hostCommand, join, nextWake, playerCommand, viewFor } from '../room';
import type { RoomState } from '../types';
import type { SketchState, SketchView } from './sketch';

const START = 1_700_000_000_000;

function setup(players: number) {
  const clock = { now: START };
  const room = createRoom({ code: 'ABCDEF', seed: 11, now: clock.now, settings: { game: 'sketch' } });
  const ids = Array.from({ length: players }, (_, i) => {
    const r = join(room, { deviceId: `device-${i}`, name: `Player ${i + 1}`, now: clock.now });
    if (!r.ok) throw new Error(r.error);
    return r.person.id;
  });
  hostCommand(room, { type: 'start' }, clock.now);
  return { room, ids, clock };
}

function step(room: RoomState, clock: { now: number }) {
  const wake = nextWake(room, clock.now);
  clock.now = wake === null ? clock.now + 1000 : Math.max(clock.now + 1, wake);
  advance(room, clock.now);
}

const state = (room: RoomState) => {
  if (room.game?.game !== 'sketch') throw new Error('not sketch');
  return room.game as SketchState;
};

/** Advance to the drawing phase of the current turn (the drawer picks the first word). */
function toDrawing(room: RoomState, clock: { now: number }) {
  for (let i = 0; i < 50 && state(room).phase.name !== 'choose'; i++) step(room, clock);
  const g = state(room);
  playerCommand(room, g.turns[g.turn], { type: 'choose', index: 0 }, clock.now);
  expect(g.phase.name).toBe('draw');
  return { g, drawer: g.turns[g.turn], guessers: g.playerIds.filter((id) => id !== g.turns[g.turn]) };
}

const viewOf = (room: RoomState, id: string | null, now: number) =>
  viewFor(room, id ? { kind: 'player', id } : { kind: 'stage' }, now).game as SketchView;

describe('Sketch', () => {
  it('keeps near misses out of the public feed, but tells the guesser and the artist', () => {
    const { room, clock } = setup(4);
    const { g, drawer, guessers } = toDrawing(room, clock);
    const answer = g.term!.answer;
    const nearMiss = answer.length > 4 ? answer.slice(0, -1) : `${answer}x`;
    const out = playerCommand(room, guessers[0], { type: 'guess', text: nearMiss }, clock.now);
    expect(out).toEqual({ notice: 'close' });
    expect(viewOf(room, null, clock.now).feed).toHaveLength(0);
    expect(viewOf(room, guessers[1], clock.now).feed).toHaveLength(0);
    expect(viewOf(room, drawer, clock.now).feed[0]).toMatchObject({ text: nearMiss, close: true });
  });

  it('collapses identical guesses into one line with a count', () => {
    const { room, clock } = setup(4);
    const { guessers } = toDrawing(room, clock);
    playerCommand(room, guessers[0], { type: 'guess', text: 'zzq banana' }, clock.now);
    playerCommand(room, guessers[1], { type: 'guess', text: 'other thing' }, clock.now);
    playerCommand(room, guessers[2], { type: 'guess', text: 'ZZQ Banana!' }, clock.now);
    const feed = viewOf(room, null, clock.now).feed;
    expect(feed.map((f) => [f.text, f.count])).toEqual([
      ['other thing', 1],
      ['zzq banana', 2],
    ]);
  });

  it('goes round twice with four or fewer players, on a shorter clock, and never twice in a row', () => {
    for (const n of [3, 4]) {
      const { room, clock } = setup(n);
      const g = state(room);
      expect(g.turns).toHaveLength(n * 2);
      expect(g.turns[n - 1]).not.toBe(g.turns[n]);
      const { g: drawing } = toDrawing(room, clock);
      expect(drawing.phase.endsAt! - drawing.phase.startedAt).toBe(SKETCH.drawTwoLaps);
    }
    const five = setup(5);
    expect(state(five.room).turns).toHaveLength(5);
  });

  it('has Beep heckle the artist at a hint beat when nobody has it, and call the first solver', () => {
    const { room, clock } = setup(4);
    const { g, drawer, guessers } = toDrawing(room, clock);
    step(room, clock); // first hint beat
    expect(g.phase.name).toBe('draw');
    expect(room.hostLine?.event).toBe('sketchHint');
    expect(viewOf(room, null, clock.now).mask).not.toBe(g.term!.answer.replace(/[a-z0-9]/gi, '_'));
    void drawer;
    playerCommand(room, guessers[0], { type: 'guess', text: g.term!.answer }, clock.now);
    expect(room.hostLine?.event).toBe('sketchFirst');
  });

  it('voids the artist’s points when enough of the room flags letters', () => {
    const { room, clock } = setup(5);
    const { g, drawer, guessers } = toDrawing(room, clock);
    playerCommand(room, guessers[0], { type: 'guess', text: g.term!.answer }, clock.now);
    expect(g.drawerPoints).toBeGreaterThan(0);
    // Four guessers: two flags needed.
    playerCommand(room, guessers[1], { type: 'volunteer' }, clock.now);
    expect(g.flagged).toBe(false);
    expect(viewOf(room, null, clock.now)).toMatchObject({ flags: 1, flagNeed: 2 });
    playerCommand(room, drawer, { type: 'volunteer' }, clock.now); // the artist can't flag themselves
    playerCommand(room, guessers[2], { type: 'volunteer' }, clock.now);
    expect(g.flagged).toBe(true);
    expect(g.drawerPoints).toBe(0);
    expect(g.scores[drawer]).toBe(0);
    playerCommand(room, guessers[3], { type: 'guess', text: g.term!.answer }, clock.now);
    expect(g.scores[drawer]).toBe(0);
  });

  it('never lets a single flag void a drawing', () => {
    const { room, clock } = setup(3);
    const { g, guessers } = toDrawing(room, clock);
    playerCommand(room, guessers[0], { type: 'volunteer' }, clock.now);
    expect(g.flagged).toBe(false);
    playerCommand(room, guessers[1], { type: 'volunteer' }, clock.now);
    expect(g.flagged).toBe(true);
  });

  it('lets solvers (and only solvers) nudge the room', () => {
    const { room, clock } = setup(4);
    const { g, guessers } = toDrawing(room, clock);
    expect(playerCommand(room, guessers[0], { type: 'vote', side: 0 }, clock.now)).toHaveProperty('error');
    playerCommand(room, guessers[0], { type: 'guess', text: g.term!.answer }, clock.now);
    playerCommand(room, guessers[0], { type: 'vote', side: 1 }, clock.now);
    playerCommand(room, guessers[0], { type: 'vote', side: 0 }, clock.now); // too soon
    expect(viewOf(room, null, clock.now).nudges).toEqual([{ id: 1, playerId: guessers[0], kind: 'colder' }]);
  });

  it('ends with a gallery of every drawing, then awards from what happened', () => {
    const { room, ids, clock } = setup(3);
    let sawGallery: SketchView['gallery'] = [];
    for (let i = 0; i < 400 && room.stage === 'playing'; i++) {
      const g = state(room);
      if (g.phase.name === 'choose') playerCommand(room, g.turns[g.turn], { type: 'choose', index: 0 }, clock.now);
      if (g.phase.name === 'draw' && g.drawingId && !room.drawings[g.drawingId].strokes.length)
        playerCommand(room, g.turns[g.turn], { type: 'draw', op: { op: 'begin', c: 0, w: 1, p: [10, 10, 400, 400] } }, clock.now);
      if (g.phase.name === 'gallery') sawGallery = viewOf(room, null, clock.now).gallery;
      step(room, clock); // nobody guesses: every drawing is a mystery
    }
    expect(room.stage).toBe('over');
    expect(sawGallery).toHaveLength(6);
    expect(sawGallery[0]).toMatchObject({ share: 0, flagged: false });
    expect(room.result?.highlights.map((h) => h.title)).toContain('Abstract Expressionist');
    void ids;
  });
});
