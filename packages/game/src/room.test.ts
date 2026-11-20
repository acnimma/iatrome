import { describe, expect, it } from 'vitest';
import { advance, createRoom, hostCommand, join, nextWake, playerCommand, setConnected, viewFor } from './room';
import type { GameId, RoomSettings, RoomState } from './types';

const START = 1_700_000_000_000;

function setup(players: number, settings: Partial<RoomSettings> = {}) {
  const clock = { now: START };
  const room = createRoom({ code: 'ABCDEF', seed: 7, now: clock.now, settings });
  const ids = Array.from({ length: players }, (_, i) => {
    const r = join(room, { deviceId: `device-${i}`, name: `Player ${i + 1}`, now: clock.now });
    if (!r.ok) throw new Error(r.error);
    return r.person.id;
  });
  return { room, ids, clock };
}

/** Let time pass to the next scheduled event. */
function step(room: RoomState, clock: { now: number }) {
  const wake = nextWake(room, clock.now);
  clock.now = wake === null ? clock.now + 1000 : Math.max(clock.now + 1, wake);
  advance(room, clock.now);
}

/** A tidy human: answers everything sensibly as soon as it can. */
function actFor(room: RoomState, id: string, now: number, i: number) {
  const view = viewFor(room, { kind: 'player', id }, now);
  const g = view.game;
  if (!g) return;
  switch (g.game) {
    case 'grand-rounds':
      for (const t of g.tasks.filter((t) => !t.done)) {
        if (t.kind === 'quip') playerCommand(room, id, { type: 'answer', matchupId: t.matchupId, text: `answer ${i} ${t.matchupId}`, final: true }, now);
        if (t.kind === 'differential')
          playerCommand(room, id, { type: 'list', matchupId: t.matchupId, items: ['one', 'two', `three ${i}`], final: true }, now);
        if (t.kind === 'doodle')
          playerCommand(room, id, { type: 'doodle', matchupId: t.matchupId, drawing: { strokes: [{ c: 0, w: 1, p: [10, 10, 500, 500] }] }, final: true }, now);
      }
      if (g.matchup?.canVote && g.matchup.myVote === null) playerCommand(room, id, { type: 'vote', side: (i % 2) as 0 | 1 }, now);
      return;
    case 'sketch': {
      if (g.drawer === id && g.phase.name === 'choose') playerCommand(room, id, { type: 'choose', index: 0 }, now);
      const state = room.game!.game === 'sketch' ? room.game : null;
      if (g.phase.name === 'draw' && g.drawer !== id && !g.youSolved && state && 'term' in state && state.term)
        playerCommand(room, id, { type: 'guess', text: state.term.answer }, now);
      return;
    }
    case 'survive':
      if (g.phase.name === 'question' && g.myAnswer === null) playerCommand(room, id, { type: 'pick-option', option: i % 4 }, now);
      return;
    case 'didactics':
      if (g.phase.name === 'question' && g.myAnswer === null) playerCommand(room, id, { type: 'pick-option', option: i % 4 }, now);
      return;
    case 'poison':
      if (g.phase.name === 'choose' && !(g.mine?.side && g.mine.predict)) {
        playerCommand(room, id, { type: 'pick', side: i % 3 === 0 ? 'b' : 'a' }, now);
        playerCommand(room, id, { type: 'predict', side: 'a' }, now);
      }
      if (g.phase.name === 'defend' && g.defender === id) playerCommand(room, id, { type: 'defend', text: 'Because I said so.' }, now);
      return;
  }
}

function playToEnd(room: RoomState, ids: string[], clock: { now: number }, act = true) {
  for (let i = 0; i < 5000 && room.stage === 'playing'; i++) {
    if (act) ids.forEach((id, n) => actFor(room, id, clock.now, n));
    step(room, clock);
  }
}

describe('full games', () => {
  const cases: [GameId, number][] = [
    ['grand-rounds', 3],
    ['grand-rounds', 5],
    ['grand-rounds', 8],
    ['sketch', 4],
    ['survive', 6],
    ['poison', 5],
    ['didactics', 4],
    ['didactics', 12],
    ['didactics', 40],
  ];
  for (const [game, n] of cases) {
    it(`${game} with ${n} players runs from start to final standings`, () => {
      const { room, ids, clock } = setup(n, { game });
      expect(hostCommand(room, { type: 'start' }, clock.now)).toBeUndefined();
      playToEnd(room, ids, clock);
      expect(room.stage).toBe('over');
      expect(room.result?.standings).toHaveLength(n);
      expect(room.result?.standings[0].rank).toBe(1);
      expect(room.hostLine?.event).toBe('winner');
    });
  }

  it('finishes every game even when nobody does anything', () => {
    for (const game of ['grand-rounds', 'sketch', 'survive', 'poison', 'didactics'] as GameId[]) {
      const { room, ids, clock } = setup(4, { game });
      hostCommand(room, { type: 'start' }, clock.now);
      playToEnd(room, ids, clock, false);
      expect(room.stage).toBe('over');
    }
  });
});

describe('Grand Rounds rules', () => {
  function toVote() {
    const ctx = setup(4, { game: 'grand-rounds' });
    hostCommand(ctx.room, { type: 'start' }, ctx.clock.now);
    for (let i = 0; i < 200 && ctx.room.game?.phase.name !== 'vote'; i++) {
      ctx.ids.forEach((id, n) => {
        const g = viewFor(ctx.room, { kind: 'player', id }, ctx.clock.now).game;
        if (g?.game === 'grand-rounds')
          for (const t of g.tasks.filter((t) => !t.done))
            playerCommand(ctx.room, id, { type: 'answer', matchupId: t.matchupId, text: `unique ${n} ${t.matchupId}`, final: true }, ctx.clock.now);
      });
      step(ctx.room, ctx.clock);
    }
    return ctx;
  }

  it('keeps authors anonymous until the results', () => {
    const { room, ids, clock } = toVote();
    expect(room.game?.phase.name).toBe('vote');
    for (const viewer of [{ kind: 'stage' as const }, ...ids.map((id) => ({ kind: 'player' as const, id }))]) {
      const g = viewFor(room, viewer, clock.now).game;
      if (g?.game !== 'grand-rounds') throw new Error('wrong game');
      expect(g.matchup?.entries.map((e) => e.author)).toEqual([null, null]);
      expect(g.matchup?.result).toBeNull();
    }
    // …and serialized views never contain the authors' ids alongside the answers.
    const json = JSON.stringify(viewFor(room, { kind: 'stage' }, clock.now).game);
    expect(json).not.toContain('"author":"');
  });

  it('refuses votes from the two players in the matchup', () => {
    const { room, clock } = toVote();
    const game = room.game!;
    if (game.game !== 'grand-rounds') throw new Error('wrong game');
    const author = game.matchups[game.current].playerIds[0];
    expect(playerCommand(room, author, { type: 'vote', side: 1 }, clock.now)).toEqual({ error: 'No voting for yourself!' });
  });

  it('ends voting early once every eligible player has voted', () => {
    const { room, clock } = toVote();
    const game = room.game!;
    if (game.game !== 'grand-rounds') throw new Error('wrong game');
    const m = game.matchups[game.current];
    const voters = room.people.map((p) => p.id).filter((id) => !m.playerIds.includes(id));
    voters.forEach((id) => playerCommand(room, id, { type: 'vote', side: 0 }, clock.now));
    expect(room.game?.phase.name).toBe('results');
    expect(m.result?.consensus).toBe(true);
  });

  it('pauses and resumes without losing time', () => {
    const { room, clock } = toVote();
    const remaining = room.game!.phase.endsAt! - clock.now;
    hostCommand(room, { type: 'pause' }, clock.now);
    expect(nextWake(room, clock.now)).toBeNull();
    clock.now += 60_000;
    expect(advance(room, clock.now)).toBe(false);
    hostCommand(room, { type: 'resume' }, clock.now);
    expect(room.game!.phase.endsAt! - clock.now).toBe(remaining);
  });

  it('host can hide an answer, which forfeits it', () => {
    const { room, clock } = toVote();
    hostCommand(room, { type: 'hide', target: 'a' }, clock.now);
    const game = room.game!;
    if (game.game !== 'grand-rounds') throw new Error('wrong game');
    expect(room.game?.phase.name).toBe('results');
    expect(game.matchups[game.current].result?.outcome).toBe('forfeit');
    const g = viewFor(room, { kind: 'stage' }, clock.now).game;
    if (g?.game !== 'grand-rounds') throw new Error('wrong game');
    expect(g.matchup?.entries[0].text).toBeNull();
  });

  it('writes inside jokes about someone other than the two people answering', () => {
    const names = ['Zorblat', 'Quimby', 'Xanthe', 'Pellaquin', 'Brunhild'];
    let personal = 0;
    for (let seed = 0; seed < 20; seed++) {
      const clock = { now: START };
      const room = createRoom({ code: 'JOKESA', seed, now: clock.now, settings: { game: 'grand-rounds' } });
      names.forEach((name, i) => join(room, { deviceId: `device-${i}`, name, now: clock.now }));
      hostCommand(room, { type: 'start' }, clock.now);
      const game = room.game!;
      if (game.game !== 'grand-rounds') throw new Error('wrong game');
      for (const m of game.matchups) {
        expect(m.prompt).not.toContain('{player}');
        const subject = names.find((n) => m.prompt.includes(n));
        if (!subject) continue;
        personal++;
        const authors = m.playerIds.map((id) => room.people.find((p) => p.id === id)!.name);
        expect(authors).not.toContain(subject);
      }
    }
    expect(personal).toBeGreaterThan(20);
  });

});

describe('trivia pacing', () => {
  it('mixes easy wins between harder questions instead of a steady climb', async () => {
    const { sawtooth } = await import('./games/context');
    const qs = [3, 3, 2, 1, 1, 2, 1, 3, 2, 1].map((difficulty, i) => ({ id: String(i), difficulty }));
    const order = sawtooth(qs).map((q) => q.difficulty);
    expect(order.slice(0, 4)).toEqual([1, 2, 1, 3]);
    expect(order).toHaveLength(qs.length);
  });
});

describe('Didactics Mode', () => {
  it('splits players into balanced random teams', () => {
    for (const [n, teams] of [[4, 2], [7, 2], [8, 3], [15, 3], [16, 4], [40, 4]] as const) {
      const { room, clock } = setup(n, { game: 'didactics' });
      hostCommand(room, { type: 'start' }, clock.now);
      const game = room.game!;
      if (game.game !== 'didactics') throw new Error('wrong game');
      expect(game.teams).toHaveLength(teams);
      const sizes = game.teams.map((t) => t.members.length);
      expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
      expect(sizes.reduce((a, b) => a + b, 0)).toBe(n);
    }
  });

  it('seats late arrivals straight into the smallest team', () => {
    const { room, clock } = setup(5, { game: 'didactics' });
    hostCommand(room, { type: 'start' }, clock.now);
    const late = join(room, { deviceId: 'late', name: 'Grandpa', now: clock.now });
    if (!late.ok) throw new Error(late.error);
    expect(late.person.role).toBe('player');
    const game = room.game!;
    if (game.game !== 'didactics') throw new Error('wrong game');
    expect(game.teams.map((t) => t.members.length).sort()).toEqual([3, 3]);
    expect(game.playerIds).toContain(late.person.id);
  });

  it('scores teams by share of members right, so small teams aren’t punished', () => {
    const { room, ids, clock } = setup(6, { game: 'didactics' });
    hostCommand(room, { type: 'start' }, clock.now);
    const game = room.game!;
    if (game.game !== 'didactics') throw new Error('wrong game');
    while (room.game?.phase.name !== 'question') step(room, clock);
    const answer = game.questions[game.index].answer;
    // Everyone right: every team gets the full pool.
    ids.forEach((id) => playerCommand(room, id, { type: 'pick-option', option: answer }, clock.now));
    expect(room.game?.phase.name).toBe('reveal');
    for (const t of game.teams) expect(game.last?.perTeam[t.id].points).toBe(1000);
  });
});

describe('joining and moderation', () => {
  it('rejects duplicate names, banned devices and locked rooms', () => {
    const { room, ids, clock } = setup(3);
    expect(join(room, { deviceId: 'x1', name: 'player 1', now: clock.now })).toEqual({ ok: false, error: 'name-taken' });
    hostCommand(room, { type: 'ban', id: ids[0] }, clock.now);
    expect(join(room, { deviceId: 'device-0', name: 'New Name', now: clock.now })).toEqual({ ok: false, error: 'banned' });
    hostCommand(room, { type: 'lock' }, clock.now);
    expect(join(room, { deviceId: 'x2', name: 'Latecomer', now: clock.now })).toEqual({ ok: false, error: 'locked' });
  });

  it('seats late joiners for the next game (they can’t vote mid-game)', () => {
    const { room, ids, clock } = setup(3, { game: 'grand-rounds' });
    hostCommand(room, { type: 'start' }, clock.now);
    const late = join(room, { deviceId: 'late', name: 'Late', now: clock.now });
    if (!late.ok) throw new Error(late.error);
    expect(late.person.role).toBe('audience');
    playToEnd(room, ids, clock);
    hostCommand(room, { type: 'again' }, clock.now);
    expect(room.game?.playerIds).toContain(late.person.id);
  });

  it('keeps going when a player drops out mid-game', () => {
    const { room, ids, clock } = setup(4, { game: 'survive' });
    hostCommand(room, { type: 'start' }, clock.now);
    setConnected(room, ids[3], false, clock.now);
    playToEnd(room, ids.slice(0, 3), clock);
    expect(room.stage).toBe('over');
  });

  it('lets a player leave, freeing their name and seat', () => {
    const { room, ids, clock } = setup(3);
    playerCommand(room, ids[2], { type: 'leave' }, clock.now);
    expect(room.people).toHaveLength(2);
    expect(join(room, { deviceId: 'x', name: 'Player 3', now: clock.now }).ok).toBe(true);
  });

  it('only the VIP can start from their phone', () => {
    const { room, ids, clock } = setup(3);
    expect(playerCommand(room, ids[1], { type: 'start' }, clock.now)).toEqual({ error: 'Only the host can start.' });
    expect(playerCommand(room, ids[0], { type: 'start' }, clock.now)).toBeUndefined();
    expect(room.stage).toBe('playing');
  });

  it('never sends session tokens in views', () => {
    const { room, ids, clock } = setup(3);
    const json = JSON.stringify(viewFor(room, { kind: 'player', id: ids[0] }, clock.now));
    for (const p of room.people) expect(json).not.toContain(p.token);
  });
});

describe('Stats (carried into the next game, double one round)', () => {
  function finished(n: number, game: GameId) {
    const s = setup(n, { game });
    hostCommand(s.room, { type: 'start' }, s.clock.now);
    playToEnd(s.room, s.ids, s.clock);
    return s;
  }

  it('go to the top three, plus last place in bigger groups', () => {
    const { room } = finished(6, 'survive');
    const grants = Object.values(room.stats ?? {});
    expect(grants.filter((g) => g === 'top')).toHaveLength(3);
    expect(grants.filter((g) => g === 'mercy')).toHaveLength(1);
    const order = room.result!.standings.map((s) => s.playerId);
    expect(room.stats?.[order[0]]).toBe('top');
    expect(room.stats?.[order.at(-1)!]).toBe('mercy');
  });

  it('are scarcer in small groups so they still mean something', () => {
    const { room } = finished(3, 'survive');
    expect(Object.keys(room.stats ?? {})).toHaveLength(1);
  });

  it('double the caller’s points for that round, once', () => {
    const { room, clock } = finished(6, 'survive');
    const holder = Object.keys(room.stats!).find((id) => room.stats![id] === 'top')!;
    const other = room.people.find((p) => !room.stats![p.id])!.id;
    expect(playerCommand(room, other, { type: 'stat' }, clock.now)).toEqual({ error: 'No game running.' });
    hostCommand(room, { type: 'start' }, clock.now);
    while (room.game?.phase.name !== 'question') step(room, clock);

    expect(playerCommand(room, other, { type: 'stat' }, clock.now)).toEqual({ error: 'You don’t have a Stat to call.' });
    expect(playerCommand(room, holder, { type: 'stat' }, clock.now)).toEqual({ notice: 'stat' });
    expect(room.hostLine?.event).toBe('statCalled');
    expect(viewFor(room, { kind: 'player', id: holder }, clock.now).stat).toMatchObject({ ready: false, onThis: true });
    expect(playerCommand(room, holder, { type: 'stat' }, clock.now)).toEqual({ error: 'You don’t have a Stat to call.' });

    const g = room.game;
    if (g?.game !== 'survive') throw new Error('expected survive');
    const answer = g.questions[g.index].answer;
    playerCommand(room, holder, { type: 'pick-option', option: answer }, clock.now);
    playerCommand(room, other, { type: 'pick-option', option: answer }, clock.now);
    while (room.game?.phase.name === 'question') step(room, clock);
    const last = room.game?.game === 'survive' ? room.game.last : null;
    expect(last?.points[holder]).toBe(2 * last!.points[other]);
    expect(viewFor(room, { kind: 'player', id: other }, clock.now).stat.calls).toEqual([holder]);
  });

  it('never give away who wrote an answer before the results', () => {
    const { room, ids, clock } = finished(5, 'grand-rounds');
    room.settings.game = 'grand-rounds';
    const holder = Object.keys(room.stats!)[0];
    hostCommand(room, { type: 'start' }, clock.now);
    while (room.game?.phase.name !== 'write') step(room, clock);
    const mine = viewFor(room, { kind: 'player', id: holder }, clock.now);
    const task = mine.game?.game === 'grand-rounds' ? mine.game.tasks[0] : null;
    expect(playerCommand(room, holder, { type: 'stat', target: 'not-mine' }, clock.now)).toEqual({ error: 'Pick one of your own prompts.' });
    expect(playerCommand(room, holder, { type: 'stat', target: task!.matchupId }, clock.now)).toEqual({ notice: 'stat' });

    const watcher = ids.find((id) => id !== holder)!;
    for (let i = 0; i < 3000 && room.stage === 'playing'; i++) {
      ids.forEach((id, n) => actFor(room, id, clock.now, n));
      const g = room.game?.game === 'grand-rounds' ? room.game : null;
      const calls = viewFor(room, { kind: 'player', id: watcher }, clock.now).stat.calls;
      if (g && g.phase.name !== 'results') expect(calls).toEqual([]);
      if (g?.phase.name === 'results' && g.matchups[g.current].id === task!.matchupId) {
        expect(calls).toEqual([holder]);
        const m = g.matchups[g.current];
        const side = m.playerIds.indexOf(holder);
        const r = m.result!;
        if (r.outcome === 'vote' && r.points[side] > 0) expect(r.points[side] % 2).toBe(0);
        break;
      }
      step(room, clock);
    }
  });
});

describe('polish rules', () => {
  it('Survive: a phone that dropped out doesn’t lose a coffee for a question it never saw', () => {
    const { room, ids, clock } = setup(3, { game: 'survive' });
    hostCommand(room, { type: 'start' }, clock.now);
    while (room.game?.phase.name !== 'question') step(room, clock);
    setConnected(room, ids[2], false, clock.now);
    const s = room.game?.game === 'survive' ? room.game : null;
    playerCommand(room, ids[1], { type: 'pick-option', option: s!.questions[s!.index].answer }, clock.now);
    while (room.game?.phase.name === 'question') step(room, clock);
    const g = room.game;
    if (g?.game !== 'survive') throw new Error('expected survive');
    expect(g.coffees[ids[2]]).toBe(2);
    expect(g.coffees[ids[0]]).toBe(1); // present, didn't answer
  });

  it('Survive: two right in a row as a ghost puts you back on shift, as often as you earn it', () => {
    const { room, ids, clock } = setup(3, { game: 'survive' });
    hostCommand(room, { type: 'start' }, clock.now);
    const g = () => (room.game?.game === 'survive' ? room.game : null)!;
    const answerRight = () => {
      while (room.game?.phase.name !== 'question') step(room, clock);
      const answer = g().questions[g().index].answer;
      for (const id of ids) playerCommand(room, id, { type: 'pick-option', option: answer }, clock.now);
      while (room.game?.phase.name === 'question') step(room, clock);
    };
    while (room.game?.phase.name !== 'question') step(room, clock);
    for (let comeback = 0; comeback < 2; comeback++) {
      g().coffees[ids[0]] = 0;
      g().clockedOut[ids[0]] = g().index;
      answerRight();
      expect(ids[0] in g().clockedOut).toBe(true);
      answerRight();
      expect(ids[0] in g().clockedOut).toBe(false);
      expect(g().coffees[ids[0]]).toBe(1);
      expect(g().last?.revived).toEqual([ids[0]]);
      expect(room.hostLine?.event).toBe('ghostRevive');
    }
  });

  it('Pick Your Poison: nobody is forced to defend; the first volunteer gets the mic', () => {
    const { room, ids, clock } = setup(4, { game: 'poison' });
    hostCommand(room, { type: 'start' }, clock.now);
    while (room.game?.phase.name !== 'choose') step(room, clock);
    ids.forEach((id, i) => {
      playerCommand(room, id, { type: 'pick', side: i === 0 ? 'b' : 'a' }, clock.now);
      playerCommand(room, id, { type: 'predict', side: 'a' }, clock.now);
    });
    while ((room.game?.phase.name as string) === 'reveal') step(room, clock);
    expect(room.game?.phase.name).toBe('volunteer');
    playerCommand(room, ids[1], { type: 'volunteer' }, clock.now); // majority can't
    expect(room.game?.phase.name).toBe('volunteer');
    playerCommand(room, ids[0], { type: 'volunteer' }, clock.now);
    expect(room.game?.phase.name).toBe('defend');
    playerCommand(room, ids[0], { type: 'defend', text: 'Hear me out.' }, clock.now);
    playerCommand(room, ids[1], { type: 'convinced' }, clock.now);
    playerCommand(room, ids[1], { type: 'convinced' }, clock.now);
    const g = room.game?.game === 'poison' ? room.game : null;
    expect(g?.converts).toEqual([ids[1]]);
  });

  it('Sketch: wakes the server for hint letters even when nobody guesses', () => {
    const { room, ids, clock } = setup(3, { game: 'sketch' });
    hostCommand(room, { type: 'start' }, clock.now);
    while (room.game?.phase.name !== 'choose') step(room, clock);
    const g = room.game?.game === 'sketch' ? room.game : null;
    playerCommand(room, g!.turns[g!.turn], { type: 'choose', index: 0 }, clock.now);
    const { startedAt, endsAt } = room.game!.phase;
    expect(nextWake(room, clock.now)).toBe(startedAt + 0.45 * (endsAt! - startedAt));
    void ids;
  });
});
