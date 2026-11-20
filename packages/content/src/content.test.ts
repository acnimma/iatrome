import { describe, expect, it } from 'vitest';
import {
  curbsideGeneric,
  differentials,
  dilemmas,
  doodles,
  hostEvents,
  hostLines,
  namedHostEvents,
  playerDifferentials,
  playerQuips,
  quips,
  sketchTerms,
  trivia,
} from './index';

const packs = { quips, playerQuips, playerDifferentials, doodles, differentials, dilemmas, sketchTerms, trivia };

describe('every pack', () => {
  for (const [name, pack] of Object.entries(packs)) {
    it(`${name}: unique ids and no duplicate text`, () => {
      const ids = pack.map((x) => x.id);
      expect(new Set(ids).size).toBe(ids.length);
      const texts = pack.map((x) => JSON.stringify(x).replace(/"id":"[^"]+",?/, '').replace(/"breadth":"\w+",?/, '').toLowerCase());
      expect(new Set(texts).size).toBe(texts.length);
    });
  }
});

describe('Normal and Pro mode', () => {
  // Enough fresh items for many games in each mode (Normal draws only universal items; Pro mostly clinical).
  const minimum: Record<keyof typeof packs, [number, number]> = {
    quips: [180, 100],
    playerQuips: [80, 40],
    playerDifferentials: [20, 12],
    doodles: [100, 45],
    differentials: [50, 35],
    dilemmas: [100, 55],
    sketchTerms: [160, 60],
    trivia: [110, 100],
  };
  for (const [name, [normal, pro]] of Object.entries(minimum)) {
    it(`${name}: ≥ ${normal} Normal and ≥ ${pro} Pro items`, () => {
      const pack = packs[name as keyof typeof packs];
      expect(pack.filter((x) => x.breadth === 'universal').length).toBeGreaterThanOrEqual(normal);
      expect(pack.filter((x) => x.breadth === 'clinical').length).toBeGreaterThanOrEqual(pro);
    });
  }
});

describe('no em dashes', () => {
  it('appear anywhere in the content', () => {
    const all = JSON.stringify({ ...packs, hostLines, curbsideGeneric });
    expect(all).not.toContain('—');
  });
});

describe('Grand Rounds', () => {
  it('has enough prompts for many games without repeats', () => {
    expect(quips.length).toBeGreaterThanOrEqual(280);
    expect(doodles.length).toBeGreaterThanOrEqual(100);
    expect(differentials.length).toBeGreaterThanOrEqual(60);
  });
  it('fits on screen', () => {
    for (const q of quips) expect(q.text.length, q.id).toBeLessThanOrEqual(110);
    for (const d of doodles) expect(d.text.length, d.id).toBeLessThanOrEqual(90);
    for (const d of differentials) expect(d.text.length, d.id).toBeLessThanOrEqual(90);
  });
  it('curbside consults fit in an answer (60 chars)', () => {
    for (const q of quips) for (const c of q.curbside) expect(c.length, q.id).toBeLessThanOrEqual(60);
    for (const c of curbsideGeneric) expect(c.length).toBeLessThanOrEqual(60);
    for (const d of differentials) for (const b of d.beep) expect(b.length, d.id).toBeLessThanOrEqual(40);
  });
});

// The house style: short, classic frames with the whole joke left to the player.
// No setups, no second sentences, no explaining the scenario.
describe('prompts are short and one sentence', () => {
  const words = (t: string) => t.trim().split(/\s+/).length;
  const twoSentences = /[.!?]["”’]?\s+[A-Z“"]/;
  const cases: [string, { id: string; text: string; breadth?: string }[], number, number][] = [
    ['quips', quips, 11, 13],
    ['inside-joke quips', playerQuips, 11, 13],
    ['doodles', doodles, 10, 11],
    ['differentials', differentials, 12, 13],
    ['inside-joke differentials', playerDifferentials, 12, 13],
  ];
  for (const [name, pack, normal, pro] of cases)
    it(`${name}: at most ${normal} words (${pro} in Pro), one sentence`, () => {
      for (const p of pack) {
        const max = p.breadth === 'clinical' ? pro : normal;
        expect(words(p.text), `${p.id}: ${p.text}`).toBeLessThanOrEqual(max);
        expect(twoSentences.test(p.text.replace(/\b(a\.m|p\.m|Dr|Mr|Mrs|Ms|St|vs)\./g, '$1')), `${p.id}: ${p.text}`).toBe(false);
      }
    });
  it('bot answers are short too (at most 9 words)', () => {
    for (const q of quips) for (const c of q.curbside) expect(words(c), `${q.id}: ${c}`).toBeLessThanOrEqual(9);
    for (const c of curbsideGeneric) expect(words(c), c).toBeLessThanOrEqual(9);
  });
});

describe('Inside jokes', () => {
  it('name exactly one player, and fit on screen once the name is in', () => {
    for (const p of [...playerQuips, ...playerDifferentials]) {
      expect(p.text.match(/\{player\}/g)?.length, p.id).toBe(1);
      expect(p.text.replace('{player}', 'Maximilianus').length, p.id).toBeLessThanOrEqual(110);
    }
    for (const q of playerQuips) for (const c of q.curbside) expect(c.length, q.id).toBeLessThanOrEqual(60);
    for (const d of playerDifferentials) for (const b of d.beep) expect(b.length, d.id).toBeLessThanOrEqual(40);
  });
  it('keeps {player} out of the general packs', () => {
    for (const p of [...quips, ...differentials, ...doodles]) expect(p.text, p.id).not.toContain('{player}');
  });
});

describe('Sketch', () => {
  it('has terms at every difficulty, with clean alternatives', () => {
    for (const d of [1, 2, 3]) expect(sketchTerms.filter((t) => t.difficulty === d).length).toBeGreaterThanOrEqual(20);
    for (const t of sketchTerms) {
      expect(t.answer.length, t.id).toBeLessThanOrEqual(24);
      expect(t.accept.map((a) => a.toLowerCase()), t.id).not.toContain(t.answer.toLowerCase());
    }
  });
});

describe('Survive the Shift', () => {
  it('has well-formed, sourced questions', () => {
    expect(trivia.length).toBeGreaterThanOrEqual(100);
    for (const q of trivia) {
      expect(q.options, q.id).toHaveLength(4);
      expect(new Set(q.options.map((o) => o.toLowerCase())).size, q.id).toBe(4);
      expect([0, 1, 2, 3], q.id).toContain(q.answer);
      expect(q.source, q.id).toMatch(/^https?:\/\//);
      expect(q.fact.length, q.id).toBeGreaterThan(10);
    }
  });
  it('spreads correct answers across positions', () => {
    for (const i of [0, 1, 2, 3]) expect(trivia.filter((q) => q.answer === i).length / trivia.length).toBeGreaterThan(0.15);
  });
});

describe('Pick Your Poison', () => {
  it('has plenty of dilemmas phrased to follow "would you rather"', () => {
    expect(dilemmas.length).toBeGreaterThanOrEqual(100);
    for (const d of dilemmas) {
      expect(d.a.toLowerCase().startsWith('would you rather'), d.id).toBe(false);
      expect(d.a.length, d.id).toBeLessThanOrEqual(80);
      expect(d.b.length, d.id).toBeLessThanOrEqual(80);
    }
  });
});

describe('Beep', () => {
  it('has a deep pool of lines for every event', () => {
    for (const event of hostEvents) expect(hostLines[event]?.length ?? 0, event).toBeGreaterThanOrEqual(10);
  });
  it('only uses {name} where a name is passed in', () => {
    for (const event of hostEvents)
      for (const line of hostLines[event]) {
        const vars = line.match(/\{(\w+)\}/g) ?? [];
        if (namedHostEvents.includes(event)) expect(vars.every((v) => v === '{name}'), line).toBe(true);
        else expect(vars, `${event}: ${line}`).toEqual([]);
      }
  });
});
