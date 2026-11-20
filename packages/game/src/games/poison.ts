import { type Dilemma, dilemmas } from '@iatrome/content';
import { POISON as PO } from '../constants';
import type { GameResult, Highlight, Phase } from '../types';
import { type ActionOutcome, type BaseGameState, type GameContext, type GameModule, setPhase, standings, statted, tidy } from './context';

/**
 * Pick Your Poison: would you rather. Pick a side AND predict which side the OTHER players
 * picked. Being the only one on your side pays (and earns an AMA tag). When there's a
 * minority, one of them goes Against Medical Advice: they argue out loud while the majority
 * can switch sides on their phones, after betting on whether anyone will.
 */

type PhaseName = 'intro' | 'choose' | 'reveal' | 'bet' | 'defence' | 'verdict' | 'final' | 'done';
type Side = 'a' | 'b';

export interface PoisonState extends BaseGameState {
  game: 'poison';
  phase: Phase<PhaseName>;
  dilemmas: Dilemma[];
  index: number;
  picks: Record<string, { side: Side | null; predict: Side | null }>;
  majority: Side | 'tie' | null;
  /** Put on the spot to argue for the minority side (Against Medical Advice). */
  defender: string | null;
  /** Majority players' bets on whether anyone switches. */
  bets: Record<string, boolean>;
  /** Majority players who switched during the defence, in order. */
  flips: string[];
  /** This round's points, by reason. */
  pay: PoisonPay;
  /** Running counts for the end-of-game awards. */
  minorityCount: Record<string, number>;
  readCount: Record<string, number>;
  /** Rounds spent alone on a side (the AMA tag). */
  loneCount: Record<string, number>;
  flipCount: Record<string, number>;
}

export interface PoisonPay {
  /** Read the others right. */
  read: Record<string, number>;
  /** The only one on their side. */
  lone: Record<string, number>;
  /** The defender, for everyone they flipped. */
  flips: Record<string, number>;
  /** Called whether anyone would switch. */
  bet: Record<string, number>;
}

/**
 * `predict` doubles as the bet during the bet phase: 'a' = someone switches, 'b' = nobody does.
 * (The protocol already carries it; a separate action can replace this later.)
 */
export type PoisonAction = { type: 'pick'; side: Side } | { type: 'predict'; side: Side } | { type: 'convinced' };

export const BET_YES: Side = 'a';

export interface PoisonView {
  game: 'poison';
  phase: Phase<PhaseName>;
  /** 3 on the final dilemma, else 1. */
  multiplier: number;
  number: number;
  total: number;
  a: string | null;
  b: string | null;
  /** Revealed counts, as picked (before anyone switched). */
  counts: { a: number; b: number } | null;
  /** Revealed sides as picked; `flips` moved to the other side during the defence. */
  sides: Record<string, Side> | null;
  majority: Side | 'tie' | null;
  done: string[];
  defender: string | null;
  flips: string[];
  /** Who has bet (stage), and your own bet. */
  betters: string[];
  myBet: boolean | null;
  /** The bets, once the verdict is in. */
  bets: Record<string, boolean> | null;
  /** Total points earned this round, and why. */
  earned: Record<string, number>;
  pay: PoisonPay | null;
  /** Running AMA tags: rounds spent alone on a side. */
  ama: Record<string, number>;
  mine: { side: Side | null; predict: Side | null } | null;
  scores: Record<string, number>;
}

const emptyPay = (): PoisonPay => ({ read: {}, lone: {}, flips: {}, bet: {} });

export const poison: GameModule<PoisonState, PoisonAction, PoisonView> = {
  id: 'poison',
  minPlayers: PO.minPlayers,
  maxPlayers: PO.maxPlayers,

  start(ctx, playerIds) {
    const state: PoisonState = {
      game: 'poison',
      playerIds,
      scores: Object.fromEntries(playerIds.map((id) => [id, 0])),
      phase: { name: 'intro', startedAt: ctx.now, endsAt: null },
      dilemmas: ctx.draw(dilemmas, PO.rounds),
      index: 0,
      picks: {},
      majority: null,
      defender: null,
      bets: {},
      flips: [],
      pay: emptyPay(),
      minorityCount: {},
      readCount: {},
      loneCount: {},
      flipCount: {},
    };
    ctx.say('poisonIntro');
    setPhase(state, ctx, 'intro', PO.intro);
    return state;
  },

  act(state, ctx, playerId, action): ActionOutcome | void {
    if (!state.playerIds.includes(playerId)) return { error: 'Only players can pick.' };
    if (action.type === 'convinced') {
      if (state.phase.name !== 'defence' || !state.defender || state.flips.includes(playerId)) return;
      if (state.picks[playerId]?.side !== state.majority) return { error: 'You’re already on their side.' };
      state.flips.push(playerId);
      const points = statted(state, state.defender, `d${state.index}`, PO.flipPoints * finalFactor(state));
      award(state, state.defender, 'flips', points);
      state.flipCount[state.defender] = (state.flipCount[state.defender] ?? 0) + 1;
      ctx.say('poisonFlip', { name: ctx.person(state.defender)?.name ?? 'The defence' });
      if (unflipped(state, ctx).length === 0) verdict(state, ctx);
      return;
    }
    if (action.type === 'predict' && state.phase.name === 'bet') {
      if (state.picks[playerId]?.side !== state.majority || playerId in state.bets) return;
      if (action.side !== 'a' && action.side !== 'b') return;
      state.bets[playerId] = action.side === BET_YES;
      if (betsIn(state, ctx)) defend(state, ctx);
      return;
    }
    if (action.type !== 'pick' && action.type !== 'predict') return;
    if (state.phase.name !== 'choose') return { error: 'Too late!' };
    if (action.side !== 'a' && action.side !== 'b') return;
    const pick = (state.picks[playerId] ??= { side: null, predict: null });
    if (action.type === 'pick') pick.side = action.side;
    else pick.predict = action.side;
    if (allPicked(state, ctx)) reveal(state, ctx);
  },

  timeout(state, ctx) {
    switch (state.phase.name) {
      case 'intro':
      case 'final':
        ask(state, ctx);
        return;
      case 'choose':
        reveal(state, ctx);
        return;
      case 'reveal': {
        // A minority goes Against Medical Advice: one of them is put on the spot, no volunteering.
        const minority = ctx.connectedPlayers(state.playerIds).filter((id) => inMinority(state, id));
        if (minority.length && unflipped(state, ctx).length) {
          state.defender = minority.length === 1 ? minority[0] : ctx.rng.pick(minority);
          ctx.say('poisonMinority');
          setPhase(state, ctx, 'bet', PO.bet, 'input');
          return;
        }
        next(state, ctx);
        return;
      }
      case 'bet':
        defend(state, ctx);
        return;
      case 'defence':
        verdict(state, ctx);
        return;
      case 'verdict':
        next(state, ctx);
        return;
    }
  },

  settle(state, ctx) {
    if (state.phase.name === 'choose' && allPicked(state, ctx)) reveal(state, ctx);
    else if (state.phase.name === 'bet' && betsIn(state, ctx)) defend(state, ctx);
    else if (state.phase.name === 'defence' && state.defender && !ctx.connectedPlayers([state.defender]).length) verdict(state, ctx);
  },

  /** The host's "hide" during a defence cuts the mic: straight to the verdict. */
  hide(state, ctx) {
    if (state.phase.name === 'defence') verdict(state, ctx);
  },

  result(state, ctx): GameResult | null {
    if (state.phase.name !== 'done') return null;
    return { game: 'poison', standings: standings(ctx, state.scores), highlights: highlights(state, ctx) };
  },

  view(state, _ctx, viewer) {
    const d = state.dilemmas[state.index];
    const phase = state.phase.name;
    const asking = phase !== 'intro' && phase !== 'done' && phase !== 'final';
    const revealed = ['reveal', 'bet', 'defence', 'verdict'].includes(phase);
    const sides: Record<string, Side> = {};
    for (const [id, p] of Object.entries(state.picks)) if (p.side) sides[id] = p.side;
    const me = viewer.kind === 'stage' ? null : viewer.id;
    const earned: Record<string, number> = {};
    for (const reason of Object.values(state.pay) as Record<string, number>[]) for (const [id, n] of Object.entries(reason)) earned[id] = (earned[id] ?? 0) + n;
    return {
      game: 'poison',
      phase: state.phase,
      number: state.index + 1,
      total: state.dilemmas.length,
      multiplier: finalFactor(state),
      a: asking ? d.a : null,
      b: asking ? d.b : null,
      counts: revealed ? { a: Object.values(sides).filter((s) => s === 'a').length, b: Object.values(sides).filter((s) => s === 'b').length } : null,
      sides: revealed ? sides : null,
      majority: revealed ? state.majority : null,
      done: Object.entries(state.picks).filter(([, p]) => p.side && p.predict).map(([id]) => id),
      defender: revealed ? state.defender : null,
      flips: phase === 'defence' || phase === 'verdict' ? state.flips : [],
      betters: phase === 'bet' || phase === 'defence' || phase === 'verdict' ? Object.keys(state.bets) : [],
      myBet: me && me in state.bets ? state.bets[me] : null,
      bets: phase === 'verdict' ? state.bets : null,
      earned: revealed ? earned : {},
      pay: revealed ? state.pay : null,
      ama: state.loneCount,
      mine: me ? (state.picks[me] ?? null) : null,
      scores: state.scores,
    };
  },

  statKey(state, _ctx, playerId) {
    if (state.phase.name !== 'choose' || !state.playerIds.includes(playerId)) return { error: 'Call it while you’re picking.' };
    return `d${state.index}`;
  },

  statRound(state) {
    const live = ['choose', 'reveal', 'bet', 'defence', 'verdict'].includes(state.phase.name);
    return { key: live ? `d${state.index}` : null, revealed: state.phase.name !== 'choose' };
  },
};

function ask(state: PoisonState, ctx: GameContext) {
  state.picks = {};
  state.majority = null;
  state.defender = null;
  state.bets = {};
  state.flips = [];
  state.pay = emptyPay();
  setPhase(state, ctx, 'choose', PO.choose, 'input');
}

/** The last dilemma is worth triple. */
const finalFactor = (state: PoisonState) => (state.index === state.dilemmas.length - 1 ? PO.finalFactor : 1);

function award(state: PoisonState, id: string, reason: keyof PoisonPay, points: number) {
  if (!points) return;
  state.scores[id] += points;
  state.pay[reason][id] = (state.pay[reason][id] ?? 0) + points;
}

function allPicked(state: PoisonState, ctx: GameContext) {
  return ctx.connectedPlayers(state.playerIds).every((id) => state.picks[id]?.side && state.picks[id]?.predict);
}

/** Majority players still on their original side. */
function unflipped(state: PoisonState, ctx: GameContext) {
  return ctx.connectedPlayers(state.playerIds).filter((id) => state.picks[id]?.side === state.majority && !state.flips.includes(id));
}

function betsIn(state: PoisonState, ctx: GameContext) {
  return ctx.connectedPlayers(state.playerIds).every((id) => state.picks[id]?.side !== state.majority || id in state.bets);
}

function reveal(state: PoisonState, ctx: GameContext) {
  const picked = Object.entries(state.picks).filter((e): e is [string, { side: Side; predict: Side | null }] => Boolean(e[1].side));
  const count = (side: Side, except?: string) => picked.filter(([id, p]) => p.side === side && id !== except).length;
  const a = count('a');
  const b = count('b');
  state.majority = a === b ? 'tie' : a > b ? 'a' : 'b';
  const factor = finalFactor(state);
  for (const [id, p] of Object.entries(state.picks)) {
    // A prediction is about everyone else: your own pick doesn't count toward the majority you call.
    if (p.predict) {
      const oa = count('a', id);
      const ob = count('b', id);
      if (oa + ob > 0) {
        const theirs: Side | 'tie' = oa === ob ? 'tie' : oa > ob ? 'a' : 'b';
        // Reading a 51/49 room is harder than a 90/10 one: closeness 0 (unanimous) to 1 (dead even).
        const closeness = 1 - Math.abs(oa - ob) / (oa + ob);
        const base = theirs === 'tie' ? PO.predictPoints / 2 : p.predict === theirs ? PO.predictPoints * (1 + closeness) : 0;
        award(state, id, 'read', statted(state, id, `d${state.index}`, tidy(base * factor)));
        if (p.predict === theirs) state.readCount[id] = (state.readCount[id] ?? 0) + 1;
      }
    }
    if (inMinority(state, id)) state.minorityCount[id] = (state.minorityCount[id] ?? 0) + 1;
    // Alone against the room (at least two on the other side): the contrarian bonus and an AMA tag.
    if (p.side && count(p.side) === 1 && count(p.side === 'a' ? 'b' : 'a') >= 2) {
      award(state, id, 'lone', statted(state, id, `d${state.index}`, PO.loneBonus * factor));
      state.loneCount[id] = (state.loneCount[id] ?? 0) + 1;
    }
  }
  if (picked.length > 1 && (a === 0 || b === 0)) ctx.say('poisonUnanimous');
  setPhase(state, ctx, 'reveal', PO.reveal);
}

function defend(state: PoisonState, ctx: GameContext) {
  if (!state.defender || !ctx.connectedPlayers([state.defender]).length) {
    verdict(state, ctx);
    return;
  }
  ctx.say('poisonAma', { name: ctx.person(state.defender)?.name ?? 'Someone' });
  setPhase(state, ctx, 'defence', PO.defence, 'input');
}

/** Settle the bets: "yes" wins if someone else switched, "no" if nobody else did. */
function verdict(state: PoisonState, ctx: GameContext) {
  for (const [id, yes] of Object.entries(state.bets)) {
    const switched = state.flips.some((f) => f !== id);
    if (yes === switched) award(state, id, 'bet', statted(state, id, `d${state.index}`, PO.betPoints * finalFactor(state)));
  }
  setPhase(state, ctx, 'verdict', PO.verdict);
}

function next(state: PoisonState, ctx: GameContext) {
  if (state.index + 1 >= state.dilemmas.length) {
    setPhase(state, ctx, 'done', null);
    return;
  }
  state.index += 1;
  // The final dilemma gets its own title card.
  if (state.index === state.dilemmas.length - 1 && state.dilemmas.length > 1) {
    state.picks = {};
    state.defender = null;
    state.flips = [];
    state.bets = {};
    state.pay = emptyPay();
    setPhase(state, ctx, 'final', PO.finalIntro);
  } else ask(state, ctx);
}

function inMinority(state: PoisonState, id: string) {
  const side = state.picks[id]?.side;
  return Boolean(side && (state.majority === 'a' || state.majority === 'b') && side !== state.majority);
}

/** End-of-game awards: who kept ending up alone, who could talk people round, who read the room. */
function highlights(state: PoisonState, ctx: GameContext): Highlight[] {
  const top = (counts: Record<string, number>) =>
    Object.entries(counts)
      .filter(([id, n]) => ctx.person(id) && n > 0)
      .sort((a, b) => b[1] - a[1])[0];
  const rounds = state.index + 1;
  const out: Highlight[] = [];
  const lone = top(state.loneCount);
  if (lone) out.push({ title: 'Against Medical Advice', playerId: lone[0], detail: `Alone on ${lone[1]} of ${rounds}` });
  else {
    const contrarian = top(state.minorityCount);
    if (contrarian) out.push({ title: 'Contrarian', playerId: contrarian[0], detail: `In the minority ${contrarian[1]} of ${rounds}` });
  }
  const persuader = top(state.flipCount);
  if (persuader) out.push({ title: 'Silver tongue', playerId: persuader[0], detail: `Talked ${persuader[1]} ${persuader[1] === 1 ? 'person' : 'people'} into it` });
  const reader = top(state.readCount);
  if (reader) out.push({ title: 'Mind reader', playerId: reader[0], detail: `Called the room ${reader[1]} of ${rounds}` });
  return out;
}
