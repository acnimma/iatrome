import { describe, expect, it } from 'vitest';
import {
  curbsideGeneric,
  differentials,
  dilemmas,
  doodles,
  hostEvents,
  hostLines,
  hostEventVars,
  playerDifferentials,
  playerQuips,
  quips,
  sketchTerms,
  trivia,
} from './index';
import { quips as quipsNormal } from './packs/quips';
import { quipsPro } from './packs/quips-pro';
import { playerDifferentials as playerDifferentialsNormal, playerQuips as playerQuipsNormal } from './packs/player-prompts';
import { playerDifferentialsPro, playerQuipsPro } from './packs/player-prompts-pro';
import { showHostLines } from './packs/host-lines-show';

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
    sketchTerms: [180, 100],
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

// Variety: no sentence frame (the first three words) may carry more than 8% of a pack.
describe('prompts do not lean on one frame', () => {
  const frame = (t: string) =>
    t
      .toLowerCase()
      .replace(/[^a-z{} ]/g, '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .join(' ');
  const sources = {
    quips: quipsNormal,
    quipsPro,
    playerQuips: playerQuipsNormal,
    playerQuipsPro,
    playerDifferentials: playerDifferentialsNormal,
    playerDifferentialsPro,
    allQuips: quips,
  };
  for (const [name, pack] of Object.entries(sources))
    it(`${name}: no frame over 8%`, () => {
      const counts = new Map<string, number>();
      for (const p of pack) counts.set(frame(p.text), (counts.get(frame(p.text)) ?? 0) + 1);
      for (const [f, n] of counts) expect(n / pack.length, `"${f}" starts ${n} of ${pack.length}`).toBeLessThanOrEqual(0.08);
    });
  it('Normal quips keep plenty of fill-in-the-blanks (15 to 20%)', () => {
    const share = quipsNormal.filter((q) => q.text.includes('____')).length / quipsNormal.length;
    expect(share).toBeGreaterThanOrEqual(0.15);
    expect(share).toBeLessThanOrEqual(0.2);
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
    for (const d of [1, 2, 3]) expect(sketchTerms.filter((t) => t.difficulty === d).length).toBeGreaterThanOrEqual(45);
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
  it('has an extra-deep pool for the show moments', () => {
    for (const [event, lines] of Object.entries(showHostLines)) expect(lines.length, event).toBeGreaterThanOrEqual(14);
  });
  it('reads aloud in about three seconds (at most 18 words)', () => {
    for (const lines of Object.values(hostLines)) for (const l of lines) expect(l.split(/\s+/).length, l).toBeLessThanOrEqual(18);
  });
  it('is a bedside heart monitor: no pager, robot or flatline jokes', () => {
    for (const lines of Object.values(hostLines))
      for (const l of lines) expect(l, l).not.toMatch(/\b(pager|robot|bots?|plastic|rectangle|flatline|flatlined)\b|playing too/i);
  });
  it('only uses the {vars} each event is given', () => {
    for (const event of hostEvents)
      for (const line of hostLines[event]) {
        const allowed = (hostEventVars[event] ?? []).map((v) => `{${v}}`);
        const vars = line.match(/\{(\w+)\}/g) ?? [];
        expect(vars.filter((v) => !allowed.includes(v)), `${event}: ${line}`).toEqual([]);
      }
  });
});
