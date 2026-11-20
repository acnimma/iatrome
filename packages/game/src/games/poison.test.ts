import { describe, expect, it } from 'vitest';
import { POISON as PO } from '../constants';
import { advance, createRoom, hostCommand, join, nextWake, playerCommand, viewFor } from '../room';
import type { RoomState } from '../types';
import type { PoisonState } from './poison';

const START = 1_700_000_000_000;

function setup(players: number) {
  const clock = { now: START };
  const room = createRoom({ code: 'ABCDEF', seed: 5, now: clock.now, settings: { game: 'poison' } });
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

const game = (room: RoomState) => room.game as PoisonState;
const phase = (room: RoomState) => game(room).phase.name as string;

/** Pick and predict for everyone: [side, predict] per player. */
function choose(room: RoomState, clock: { now: number }, ids: string[], picks: ['a' | 'b', 'a' | 'b'][]) {
  while (phase(room) !== 'choose') step(room, clock);
  ids.forEach((id, i) => {
    playerCommand(room, id, { type: 'pick', side: picks[i][0] }, clock.now);
    playerCommand(room, id, { type: 'predict', side: picks[i][1] }, clock.now);
  });
}

describe('Pick Your Poison', () => {
  it('scores a prediction on the other players only; a tie among them pays half', () => {
    const { room, ids, clock } = setup(3);
    choose(room, clock, ids, [
      ['a', 'a'], // others split 1-1: half
      ['a', 'b'], // others split 1-1: half, whatever you called
      ['b', 'b'], // others are both a: wrong, even though b is "your" side
    ]);
    const pay = game(room).pay.read;
    expect(pay[ids[0]]).toBe(PO.predictPoints / 2);
    expect(pay[ids[1]]).toBe(PO.predictPoints / 2);
    expect(pay[ids[2]]).toBeUndefined();
  });

  it('keeps the closeness bonus when reading the others right', () => {
    const { room, ids, clock } = setup(5);
    // For player 1 the others split 3-1 for a: closeness 0.5.
    choose(room, clock, ids, [
      ['b', 'a'],
      ['a', 'a'],
      ['a', 'a'],
      ['a', 'a'],
      ['b', 'b'],
    ]);
    expect(game(room).pay.read[ids[0]]).toBe(150);
    // Player 2's others are 2 a, 2 b: a tie.
    expect(game(room).pay.read[ids[1]]).toBe(PO.predictPoints / 2);
  });

  it('puts the lone dissenter on the spot: bets, out-loud defence, flips that move people and pay', () => {
    const { room, ids, clock } = setup(4);
    const [lone, a, b, c] = ids;
    choose(room, clock, ids, [
      ['b', 'a'],
      ['a', 'a'],
      ['a', 'a'],
      ['a', 'a'],
    ]);
    expect(game(room).pay.lone[lone]).toBe(PO.loneBonus);
    expect(game(room).loneCount[lone]).toBe(1);
    while (phase(room) === 'reveal') step(room, clock);
    expect(phase(room)).toBe('bet');
    expect(game(room).defender).toBe(lone);
    playerCommand(room, lone, { type: 'predict', side: 'a' }, clock.now); // the minority doesn't bet
    playerCommand(room, a, { type: 'predict', side: 'a' }, clock.now); // someone will switch
    playerCommand(room, b, { type: 'predict', side: 'b' }, clock.now); // nobody will
    playerCommand(room, c, { type: 'predict', side: 'a' }, clock.now); // c bets yes, then flips: doesn't count for c
    expect(phase(room)).toBe('defence');
    expect(room.hostLine).toMatchObject({ event: 'poisonAma' });
    expect(room.hostLine?.text).toContain('Player 1');

    expect(playerCommand(room, lone, { type: 'convinced' }, clock.now)).toEqual({ error: 'You’re already on their side.' });
    playerCommand(room, c, { type: 'convinced' }, clock.now);
    playerCommand(room, c, { type: 'convinced' }, clock.now);
    expect(game(room).flips).toEqual([c]);
    expect(room.hostLine).toMatchObject({ event: 'poisonFlip' });
    expect(game(room).pay.flips[lone]).toBe(PO.flipPoints);
    const stage = viewFor(room, { kind: 'stage' }, clock.now).game;
    expect(stage?.game === 'poison' && stage.flips).toEqual([c]);

    while (phase(room) === 'defence') step(room, clock);
    expect(phase(room)).toBe('verdict');
    const bet = game(room).pay.bet;
    expect(bet[a]).toBe(PO.betPoints); // c switched: a called it
    expect(bet[b]).toBeUndefined();
    expect(bet[c]).toBeUndefined(); // only c switched, so "someone else" didn't
  });

  it('ends the defence early once the whole majority has switched', () => {
    const { room, ids, clock } = setup(3);
    choose(room, clock, ids, [
      ['b', 'a'],
      ['a', 'a'],
      ['a', 'a'],
    ]);
    while (phase(room) !== 'defence') step(room, clock);
    playerCommand(room, ids[1], { type: 'convinced' }, clock.now);
    playerCommand(room, ids[2], { type: 'convinced' }, clock.now);
    expect(phase(room)).toBe('verdict');
    expect(game(room).flipCount[ids[0]]).toBe(2);
  });

  it('skips the defence on a unanimous round, with Beep’s line', () => {
    const { room, ids, clock } = setup(3);
    choose(room, clock, ids, [
      ['a', 'a'],
      ['a', 'a'],
      ['a', 'a'],
    ]);
    expect(room.hostLine?.event).toBe('poisonUnanimous');
    const index = game(room).index;
    while (phase(room) === 'reveal') step(room, clock);
    expect(phase(room)).toBe('choose');
    expect(game(room).index).toBe(index + 1);
  });

  it('gives the final dilemma its own card, then plays it at triple value', () => {
    const { room, clock } = setup(3);
    for (let i = 0; i < 2000 && phase(room) !== 'final'; i++) step(room, clock);
    expect(phase(room)).toBe('final');
    expect(game(room).index).toBe(PO.rounds - 1);
    while (phase(room) === 'final') step(room, clock);
    const v = viewFor(room, { kind: 'stage' }, clock.now).game;
    expect(v?.game === 'poison' && v.multiplier).toBe(PO.finalFactor);
  });

  it('awards Against Medical Advice to whoever was alone most often', () => {
    const { room, ids, clock } = setup(4);
    for (let i = 0; i < 4000 && room.stage === 'playing'; i++) {
      if (phase(room) === 'choose' && !game(room).picks[ids[3]]) choose(room, clock, ids, [['a', 'a'], ['a', 'a'], ['a', 'a'], ['b', 'a']]);
      else step(room, clock);
    }
    expect(room.stage).toBe('over');
    expect(room.result!.highlights[0]).toMatchObject({ title: 'Against Medical Advice', playerId: ids[3] });
    expect(room.result!.standings.find((s) => s.playerId === ids[3])!.score).toBeGreaterThan(0);
  });
});
