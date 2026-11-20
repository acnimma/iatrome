import { describe, expect, it } from 'vitest';
import { SURVIVE as SV } from '../constants';
import { advance, createRoom, hostCommand, join, nextWake, playerCommand, viewFor } from '../room';
import type { RoomState } from '../types';
import type { SurviveState } from './survive';

const START = 1_700_000_000_000;

function setup(players: number) {
  const clock = { now: START };
  const room = createRoom({ code: 'ABCDEF', seed: 11, now: clock.now, settings: { game: 'survive' } });
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

const game = (room: RoomState) => room.game as SurviveState;

/** Run to the next question, then have each player answer: true = right, false = wrong. */
function play(room: RoomState, clock: { now: number }, ids: string[], right: (id: string, index: number) => boolean) {
  while (room.stage === 'playing' && game(room).phase.name !== 'question') step(room, clock);
  if (room.stage !== 'playing') return;
  const g = game(room);
  const answer = g.questions[g.index].answer;
  for (const id of ids) playerCommand(room, id, { type: 'pick-option', option: right(id, g.index) ? answer : (answer + 1) % 4 }, clock.now);
  while (game(room).phase.name === 'question') step(room, clock);
}

describe('Survive the Shift', () => {
  it('plays every question even when only one player is left on shift', () => {
    const { room, ids, clock } = setup(3);
    const asked = new Set<number>();
    for (let i = 0; i < 40 && room.stage === 'playing'; i++) {
      play(room, clock, ids, (id) => id === ids[0]);
      if (room.game) asked.add(game(room).index);
    }
    expect(room.stage).toBe('over');
    expect(asked.size).toBe(SV.maxQuestions);
  });

  it('ranks by score, pays shift pay to survivors only, and lets a strong ghost win the chase', () => {
    const { room, ids, clock } = setup(3);
    const [ghost, leader, other] = ids;
    // Ghost clocks out early, then misses on purpose until the chase (no revive); the leader cruises.
    play(room, clock, ids, (id) => id === leader);
    expect(game(room).last?.pay[leader]).toBe(SV.shiftPay);
    play(room, clock, ids, (id) => id === leader);
    expect(ghost in game(room).clockedOut).toBe(true);
    expect(game(room).last?.pay[ghost]).toBeUndefined();
    while (game(room).index < SV.maxQuestions - SV.chaseFactors.length - 1) play(room, clock, ids, (id) => id === leader);
    // Even the score up so the chase decides it.
    const g = game(room);
    g.scores[ghost] = g.scores[leader] - 100;
    // Into Sign-out: the card, then three questions the leader blows and the ghost nails.
    while (game(room).phase.name !== 'chase') step(room, clock);
    expect(room.hostLine?.event).toBe('surviveChase');
    for (let k = 0; k < SV.chaseFactors.length; k++) {
      play(room, clock, ids, (id) => id === ghost);
      const v = viewFor(room, { kind: 'stage' }, clock.now).game;
      if (v?.game !== 'survive') throw new Error('expected survive');
      expect(v.chase).toBe(true);
      expect(v.multiplier).toBe(SV.chaseFactors[k]);
    }
    while (room.stage === 'playing') step(room, clock);
    const order = room.result!.standings.map((s) => s.playerId);
    expect(order[0]).toBe(ghost);
    const scores = room.result!.standings.map((s) => s.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
    expect(room.result!.highlights.some((h) => h.title === 'Best ghost' && h.playerId === ghost)).toBe(true);
    void other;
  });

  it('pays ghosts in full during the chase and takes the speed bonus off the leader', () => {
    const { room, ids, clock } = setup(3);
    while (game(room).phase.name !== 'question') step(room, clock);
    const g = game(room);
    // Skip to the first chase question with a ghost and a clear leader.
    g.index = SV.maxQuestions - SV.chaseFactors.length - 1;
    g.clockedOut[ids[0]] = 0;
    g.coffees[ids[0]] = 0;
    g.scores[ids[1]] = 1000;
    playerCommand(room, ids[2], { type: 'pick-option', option: 9 }, clock.now);
    while (game(room).phase.name !== 'chase') step(room, clock);
    while (game(room).phase.name !== 'question') step(room, clock);
    expect(game(room).handicap).toEqual([ids[1]]);
    const answer = g.questions[g.index].answer;
    for (const id of ids) playerCommand(room, id, { type: 'pick-option', option: answer }, clock.now);
    const pts = game(room).last!.points;
    // Everyone answered instantly: full speed bonus, doubled, except the leader's.
    expect(pts[ids[0]]).toBe((SV.base + SV.speedBonus) * SV.chaseFactors[0]);
    expect(pts[ids[2]]).toBe((SV.base + SV.speedBonus) * SV.chaseFactors[0]);
    expect(pts[ids[1]]).toBe(SV.base * SV.chaseFactors[0]);
  });

  it('keeps the mercy rule for big groups early on, but not with two on shift or in the chase', () => {
    const big = setup(4);
    play(big.room, big.clock, big.ids, () => false);
    expect(game(big.room).last?.mercy).toBe(true);
    expect(Object.values(game(big.room).coffees)).toEqual([2, 2, 2, 2]);

    const two = setup(2);
    play(two.room, two.clock, two.ids, () => false);
    expect(game(two.room).last?.mercy).toBe(false);

    const late = setup(4);
    while (game(late.room).phase.name !== 'question') step(late.room, late.clock);
    game(late.room).index = SV.maxQuestions - SV.chaseFactors.length - 1;
    while (game(late.room).phase.name !== 'chase') step(late.room, late.clock);
    play(late.room, late.clock, late.ids, () => false);
    expect(game(late.room).last?.mercy).toBe(false);
  });

  it('gives a clock-out its moment: Beep names them and the reveal runs longer', () => {
    const { room, ids, clock } = setup(3);
    play(room, clock, ids, (id) => id !== ids[0]);
    play(room, clock, ids, (id) => id !== ids[0]);
    const g = game(room);
    expect(g.last?.clockedOut).toEqual([ids[0]]);
    expect(room.hostLine?.event).toBe('surviveOut');
    expect(g.phase.endsAt! - g.phase.startedAt).toBe(SV.reveal + SV.outScene);
  });
});
