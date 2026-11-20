import { describe, expect, it } from 'vitest';
import { DIDACTICS } from '../constants';
import { advance, createRoom, hostCommand, join, nextWake, playerCommand, viewFor } from '../room';
import type { RoomState } from '../types';
import { type DidacticsState, type DidacticsView, teamCount } from './didactics';

const START = 1_700_000_000_000;

function setup(players: number) {
  const clock = { now: START };
  const room = createRoom({ code: 'ABCDEF', seed: 5, now: clock.now, settings: { game: 'didactics' } });
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

const state = (room: RoomState) => room.game as DidacticsState;
const viewOf = (room: RoomState, id: string | null, now: number) =>
  viewFor(room, id ? { kind: 'player', id } : { kind: 'stage' }, now).game as DidacticsView;

function until(room: RoomState, clock: { now: number }, phase: string) {
  for (let i = 0; i < 400 && room.game && state(room).phase.name !== phase; i++) step(room, clock);
  expect(state(room).phase.name).toBe(phase);
  return state(room);
}

describe('Didactics Mode', () => {
  it('makes teams of four to six, up to eight, balanced', () => {
    for (let n = 4; n <= 40; n++) {
      const count = teamCount(n);
      expect(count).toBeLessThanOrEqual(DIDACTICS.maxTeams);
      if (n >= 8) expect(n / count).toBeGreaterThanOrEqual(4);
      if (n >= 8) expect(n / count).toBeLessThanOrEqual(6);
    }
    const { room } = setup(40);
    const g = state(room);
    expect(g.teams).toHaveLength(8);
    expect(new Set(g.teams.map((t) => t.members.length))).toEqual(new Set([5]));
    expect(g.teams.map((t) => t.name)).not.toContain('The Lollipops');
  });

  it('huddles once everyone has answered: splits show, one switch each, then the reveal', () => {
    const { room, ids, clock } = setup(4);
    const g = until(room, clock, 'question');
    const answer = g.questions[0].answer;
    const wrong = (answer + 1) % 4;
    expect(playerCommand(room, ids[0], { type: 'pick-option', option: wrong }, clock.now)).toBeUndefined();
    // No switching before the huddle, and no peeking at the team.
    expect(playerCommand(room, ids[0], { type: 'pick-option', option: answer }, clock.now)).toHaveProperty('error');
    expect(viewOf(room, ids[0], clock.now).teamPicks).toBeNull();
    ids.slice(1).forEach((id) => playerCommand(room, id, { type: 'pick-option', option: answer }, clock.now));
    expect(g.phase.name).toBe('huddle');
    expect(room.hostLine?.event).toBe('didacticsHuddle');
    expect(viewOf(room, ids[0], clock.now).teamPicks?.reduce((a, b) => a + b)).toBe(2);
    expect(viewOf(room, null, clock.now).teamPicks).toBeNull();
    playerCommand(room, ids[0], { type: 'pick-option', option: answer }, clock.now);
    expect(playerCommand(room, ids[0], { type: 'pick-option', option: wrong }, clock.now)).toHaveProperty('error');
    expect(g.answers[ids[0]]).toMatchObject({ option: answer, switched: true, speed: 0 });
    step(room, clock);
    expect(g.phase.name).toBe('reveal');
  });

  it('calls out the most popular wrong answer', () => {
    const { room, ids, clock } = setup(5);
    const g = until(room, clock, 'question');
    const answer = g.questions[0].answer;
    const wrong = (answer + 2) % 4;
    ids.forEach((id, i) => playerCommand(room, id, { type: 'pick-option', option: i < 3 ? wrong : answer }, clock.now));
    until(room, clock, 'reveal');
    expect(viewOf(room, null, clock.now).callout).toEqual({ option: wrong, count: 3 });
  });

  it('runs a lightning round with its own intro, a short clock and no huddle', () => {
    const { room, ids, clock } = setup(4);
    const g = until(room, clock, 'lightning');
    expect(room.hostLine?.event).toBe('didacticsLightning');
    until(room, clock, 'question');
    expect(viewOf(room, null, clock.now).lightning).toBe(true);
    expect(g.phase.endsAt! - g.phase.startedAt).toBeLessThan(DIDACTICS.question);
    ids.forEach((id) => playerCommand(room, id, { type: 'pick-option', option: 0 }, clock.now));
    expect(g.phase.name).toBe('reveal');
  });

  it('lets each captain wager on the final, and the trailing team can come back', () => {
    const { room, ids, clock } = setup(4);
    const g = until(room, clock, 'wager');
    expect(room.hostLine?.event).toBe('didacticsWager');
    const [lead, trail] = g.teams;
    g.teamScores[lead.id] = 5000;
    g.teamScores[trail.id] = 2700;
    const captainOf = (t: typeof lead) => g.wager![t.id].captain;
    const notCaptain = trail.members.find((id) => id !== captainOf(trail))!;
    expect(playerCommand(room, notCaptain, { type: 'pick-option', option: 3 }, clock.now)).toHaveProperty('error');
    expect(viewOf(room, captainOf(trail), clock.now).youCaptain).toBe(true);
    playerCommand(room, captainOf(trail), { type: 'pick-option', option: 3 }, clock.now); // 100%
    // Other teams can't see the bet yet.
    expect(viewOf(room, captainOf(lead), clock.now).wager?.teams[trail.id]).toMatchObject({ picked: true, pct: null });
    playerCommand(room, captainOf(lead), { type: 'pick-option', option: 2 }, clock.now); // 50%
    expect(g.phase.name).toBe('question');
    expect(viewOf(room, null, clock.now).final).toBe(true);
    const answer = g.questions[g.index].answer;
    for (const id of ids) playerCommand(room, id, { type: 'pick-option', option: trail.members.includes(id) ? answer : (answer + 1) % 4 }, clock.now);
    until(room, clock, 'reveal');
    expect(g.last?.perTeam[trail.id].wager).toEqual({ pct: 1, amount: 2700, swing: 2700 });
    expect(g.last?.perTeam[lead.id].wager).toEqual({ pct: 0.5, amount: 2500, swing: -2500 });
    expect(g.teamScores[trail.id]).toBeGreaterThan(g.teamScores[lead.id]);
    expect(viewOf(room, null, clock.now).wager?.teams[trail.id].pct).toBe(1);
    step(room, clock);
    expect(room.result?.teams?.[0].name).toBe(trail.name);
    expect(room.result?.highlights.map((h) => h.title)).toContain('High Roller');
  });

  it('captains who never bet risk nothing', () => {
    const { room, ids, clock } = setup(4);
    const g = until(room, clock, 'wager');
    const before = { ...g.teamScores };
    step(room, clock);
    expect(g.phase.name).toBe('question');
    ids.forEach((id) => playerCommand(room, id, { type: 'pick-option', option: (g.questions[g.index].answer + 1) % 4 }, clock.now));
    until(room, clock, 'reveal');
    expect(g.teamScores).toEqual(before);
  });
});
