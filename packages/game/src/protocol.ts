import { z } from 'zod';
import { LIMITS, REACTIONS, ROOM } from './constants';
import type { DrawOp } from './drawing';
import type { HostCommand, JoinError, PlayerCommand, RoomView } from './room';
import type { Drawing } from './types';

// ── Client → server ──────────────────────────────────────────────────────────

const text = (max: number) => z.string().max(max * 4);
const id = z.string().min(1).max(40);
const side = z.union([z.literal(0), z.literal(1)]);
const ab = z.enum(['a', 'b']);
const points = z.array(z.number().int().min(0).max(1000)).max(LIMITS.drawing.maxPoints * 2);
const stroke = z.object({ c: z.number().int().min(0).max(15), w: z.number().int().min(0).max(5), p: points });
const drawing = z.object({ strokes: z.array(stroke).max(LIMITS.drawing.maxStrokes) });

const drawOp = z.discriminatedUnion('op', [
  z.object({ op: z.literal('begin'), c: z.number().int().min(0).max(15), w: z.number().int().min(0).max(5), p: points }),
  z.object({ op: z.literal('extend'), p: points }),
  z.object({ op: z.literal('undo') }),
  z.object({ op: z.literal('clear') }),
]);

const playerCommand = z.discriminatedUnion('type', [
  z.object({ type: z.literal('start') }),
  z.object({ type: z.literal('leave') }),
  z.object({ type: z.literal('avatar'), avatar: z.number().int().min(0).max(63) }),
  z.object({ type: z.literal('stat'), target: id.optional() }),
  // Grand Rounds
  z.object({ type: z.literal('answer'), matchupId: id, text: text(LIMITS.quip), final: z.boolean() }),
  z.object({ type: z.literal('list'), matchupId: id, items: z.array(text(LIMITS.differentialItem)).max(3), final: z.boolean() }),
  z.object({ type: z.literal('doodle'), matchupId: id, drawing, final: z.boolean() }),
  z.object({ type: z.literal('curbside'), matchupId: id }),
  z.object({ type: z.literal('vote'), side }),
  // Sketch
  z.object({ type: z.literal('choose'), index: z.number().int().min(0).max(2) }),
  z.object({ type: z.literal('guess'), text: text(LIMITS.guess) }),
  z.object({ type: z.literal('draw'), op: drawOp }),
  // Survive the Shift
  z.object({ type: z.literal('pick-option'), option: z.number().int().min(0).max(3) }),
  // Pick Your Poison
  z.object({ type: z.literal('pick'), side: ab }),
  z.object({ type: z.literal('predict'), side: ab }),
  z.object({ type: z.literal('defend'), text: text(LIMITS.defence) }),
  z.object({ type: z.literal('volunteer') }),
  z.object({ type: z.literal('convinced') }),
]);

const settings = z
  .object({
    game: z.enum(['grand-rounds', 'sketch', 'survive', 'poison', 'didactics']),
    mode: z.enum(['normal', 'pro']),
    extendedTimers: z.boolean(),
    speed: z.number().min(0.02).max(1),
  })
  .partial();

const hostCommand = z.discriminatedUnion('type', [
  ...(['start', 'again', 'lobby', 'end', 'pause', 'resume', 'skip', 'lock', 'unlock', 'add-bot'] as const).map((type) =>
    z.object({ type: z.literal(type) }),
  ),
  z.object({ type: z.literal('kick'), id }),
  z.object({ type: z.literal('ban'), id }),
  z.object({ type: z.literal('hide'), target: z.string().max(12) }),
  z.object({ type: z.literal('settings'), settings }),
] as unknown as [z.ZodObject, ...z.ZodObject[]]);

export const clientMessage = z.discriminatedUnion('t', [
  z.object({ t: z.literal('host'), token: z.string().max(64) }),
  z.object({ t: z.literal('claim-host'), token: z.string().max(64) }),
  z.object({
    t: z.literal('join'),
    deviceId: z.string().min(8).max(64),
    name: z.string().max(ROOM.maxNameLength * 4),
    password: z.string().max(ROOM.maxPasswordLength * 4).optional(),
  }),
  z.object({ t: z.literal('resume'), token: z.string().max(64) }),
  z.object({ t: z.literal('ping'), c: z.number() }),
  z.object({ t: z.literal('cmd'), cmd: playerCommand }),
  z.object({ t: z.literal('host-cmd'), cmd: hostCommand }),
  z.object({ t: z.literal('react'), e: z.number().int().min(0).max(REACTIONS.length - 1) }),
]);

export type ClientMessage =
  | { t: 'host'; token: string }
  /** A player whose device created the room: lets their phone run host controls. */
  | { t: 'claim-host'; token: string }
  | { t: 'join'; deviceId: string; name: string; password?: string }
  | { t: 'resume'; token: string }
  | { t: 'ping'; c: number }
  | { t: 'cmd'; cmd: PlayerCommand }
  | { t: 'host-cmd'; cmd: HostCommand }
  | { t: 'react'; e: number };

export function parseClientMessage(raw: string): ClientMessage | null {
  if (raw.length > 400_000) return null;
  try {
    const result = clientMessage.safeParse(JSON.parse(raw));
    return result.success ? (result.data as ClientMessage) : null;
  } catch {
    return null;
  }
}

// ── Server → client ──────────────────────────────────────────────────────────

export type ConnectError = JoinError | 'bad-password' | 'too-many-attempts' | 'no-room' | 'bad-token';

export type ServerMessage =
  | { t: 'welcome'; role: 'host' | 'player' | 'audience'; you: { id: string; token: string } | null }
  | { t: 'state'; view: RoomView }
  | { t: 'drawing'; id: string; drawing: Drawing }
  | { t: 'draw-op'; id: string; op: DrawOp }
  | { t: 'feedback'; error?: string; notice?: string }
  | { t: 'connect-error'; error: ConnectError }
  | { t: 'pong'; c: number; s: number }
  | { t: 'react'; from: string; e: number }
  | { t: 'removed'; reason: 'kicked' | 'banned' | 'closed' };

/** Room creation (HTTP). */
export interface CreateRoomRequest {
  settings?: Partial<import('./types').RoomSettings>;
  password?: string;
}

export interface CreateRoomResponse {
  code: string;
  hostToken: string;
}
