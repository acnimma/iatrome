/**
 * Sound effects, synthesized with WebAudio: no files, no licensing, instant.
 * Browsers only allow audio after a user gesture; call `unlockAudio()` from a click.
 */

export type Sfx = 'pop' | 'tick' | 'whoosh' | 'reveal' | 'vote' | 'win' | 'consensus' | 'buzz' | 'drumroll' | 'lose' | 'correct' | 'beat' | 'pathognomonic' | 'lockin' | 'applause' | 'cheer';

const MUTE_KEY = 'iatrome:muted';
let audio: AudioContext | null = null;
let master: GainNode | null = null;

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audio) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audio = new Ctor();
    master = audio.createGain();
    master.gain.value = isMuted() ? 0 : 0.55;
    master.connect(audio.destination);
  }
  return audio;
}

export function unlockAudio() {
  void context()?.resume();
}

export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {}
  if (master) master.gain.value = muted ? 0 : 0.55;
}

/** True until the browser lets us play sound (it needs one tap or click on the page first). */
export function audioLocked(): boolean {
  return !audio || audio.state !== 'running';
}

function tone(freq: number, start: number, duration: number, opts: { type?: OscillatorType; gain?: number; slide?: number } = {}) {
  const ctx = context();
  if (!ctx || !master) return;
  const t = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(freq, t);
  if (opts.slide) osc.frequency.exponentialRampToValueAtTime(freq * opts.slide, t + duration);
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(opts.gain ?? 0.3, t + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(env).connect(master);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

function noise(start: number, duration: number, opts: { from?: number; to?: number; gain?: number } = {}) {
  const ctx = context();
  if (!ctx || !master) return;
  const t = ctx.currentTime + start;
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(opts.from ?? 800, t);
  filter.frequency.exponentialRampToValueAtTime(opts.to ?? 3000, t + duration);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(opts.gain ?? 0.18, t + duration * 0.3);
  env.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  src.connect(filter).connect(env).connect(master);
  src.start(t);
}

const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const C6 = 1046.5;

export function play(sfx: Sfx) {
  if (isMuted() || !context()) return;
  switch (sfx) {
    case 'pop':
      tone(420, 0, 0.12, { slide: 2.2, gain: 0.25 });
      return;
    case 'tick':
      tone(1400, 0, 0.04, { type: 'square', gain: 0.06 });
      return;
    case 'whoosh':
      noise(0, 0.45, { from: 300, to: 4000, gain: 0.12 });
      return;
    case 'reveal':
      tone(G5, 0, 0.18, { gain: 0.2 });
      tone(C6, 0.09, 0.32, { gain: 0.2 });
      return;
    case 'vote':
      tone(880, 0, 0.08, { type: 'triangle', gain: 0.18 });
      return;
    case 'correct':
      tone(E5, 0, 0.12, { type: 'triangle', gain: 0.22 });
      tone(C6, 0.08, 0.22, { type: 'triangle', gain: 0.22 });
      return;
    case 'win':
      [C5, E5, G5, C6].forEach((f, i) => tone(f, i * 0.11, 0.4, { type: 'triangle', gain: 0.22 }));
      return;
    case 'consensus':
      [C5, E5, G5, C6, G5, C6].forEach((f, i) => tone(f, i * 0.07, 0.3, { type: 'triangle', gain: 0.2 }));
      noise(0.1, 0.6, { from: 4000, to: 9000, gain: 0.05 });
      return;
    case 'buzz':
      tone(140, 0, 0.35, { type: 'square', gain: 0.12, slide: 0.8 });
      tone(147, 0, 0.35, { type: 'square', gain: 0.1, slide: 0.8 });
      return;
    case 'lose':
      tone(G5, 0, 0.18, { type: 'triangle', gain: 0.18 });
      tone(E5 * 0.75, 0.15, 0.35, { type: 'triangle', gain: 0.18, slide: 0.9 });
      return;
    case 'beat':
      // One monitor beep.
      tone(988, 0, 0.09, { gain: 0.14 });
      return;
    case 'drumroll': {
      // Beep's heart racing: monitor beeps speeding up and climbing, then the reveal lands.
      let t = 0;
      for (let i = 0; i < 12; i++) {
        tone(880 + i * 22, t, 0.07, { gain: 0.08 + i * 0.008 });
        t += Math.max(0.07, 0.24 - i * 0.016);
      }
      return;
    }
    case 'pathognomonic':
      // The monitor alarm, then a fanfare: the room agreed, which never happens.
      for (let i = 0; i < 3; i++) {
        tone(1319, i * 0.18, 0.12, { type: 'square', gain: 0.07 });
        tone(1046, i * 0.18 + 0.09, 0.12, { type: 'square', gain: 0.07 });
      }
      [C5, E5, G5, C6, E5 * 2, C6 * 1.5].forEach((f, i) => tone(f, 0.6 + i * 0.08, 0.5, { type: 'triangle', gain: 0.2 }));
      noise(0.6, 0.9, { from: 3000, to: 9000, gain: 0.06 });
      return;
    case 'applause':
      clapping(1.8, 26);
      return;
    case 'cheer':
      // A bigger room: more hands, longer, with a whoop of noise on top.
      clapping(3.2, 70);
      noise(0, 1.4, { from: 600, to: 1800, gain: 0.05 });
      return;
    case 'lockin':
      tone(660, 0, 0.07, { type: 'triangle', gain: 0.16 });
      tone(990, 0.06, 0.12, { type: 'triangle', gain: 0.16 });
      return;
  }
}

/**
 * Applause, synthesized: lots of short, bright noise bursts at random moments, densest early,
 * tapering off. No samples, no licensing.
 */
function clapping(seconds: number, hands: number) {
  const ctx = context();
  if (!ctx || !master) return;
  const claps = Math.round(hands * seconds * 6);
  for (let i = 0; i < claps; i++) {
    // Front-loaded: most clapping happens in the first half, then it thins out.
    const t = seconds * Math.random() ** 1.7;
    const gain = 0.05 * (1 - t / seconds) + 0.01;
    noise(t, 0.018 + Math.random() * 0.02, { from: 900 + Math.random() * 900, to: 2200 + Math.random() * 1400, gain });
  }
}

// ── Beep's voice ─────────────────────────────────────────────────────────────

/** Beep acknowledging a line: a soft double blip from the monitor. */
export function beepTalk(_text: string) {
  if (isMuted() || !context()) return;
  // Just the monitor saying "noted": two soft blips. Here and there, never a voice.
  tone(1975, 0, 0.06, { gain: 0.06 });
  tone(1568, 0.09, 0.08, { gain: 0.05 });
}

// ── Music bed ────────────────────────────────────────────────────────────────

/**
 * A quiet, synthesized game-show bed under writing and voting: a walking bass, soft chords and a
 * monitor blip on the beat. Scheduled a little ahead with WebAudio, so it never drifts.
 */
export type Mood = 'lobby' | 'think' | 'vote';
const MOODS: Record<Mood, { bpm: number; gain: number }> = {
  lobby: { bpm: 96, gain: 0.5 },
  think: { bpm: 108, gain: 0.55 },
  vote: { bpm: 120, gain: 0.6 },
};
// Am, F, C, G: two bars each, as semitone offsets from A2.
const ROOTS = [0, -4, 3, -2];
const CHORDS = [
  [12, 15, 19],
  [8, 12, 15],
  [15, 19, 22],
  [10, 14, 17],
];
const A2 = 110;
const freq = (semis: number) => A2 * 2 ** (semis / 12);

let music: { mood: Mood; timer: ReturnType<typeof setInterval>; next: number; step: number; bus: GainNode } | null = null;

export function startMusic(mood: Mood) {
  const ctx = context();
  if (!ctx || !master) return;
  if (music?.mood === mood) return;
  stopMusic();
  const bus = ctx.createGain();
  bus.gain.value = 0.0001;
  bus.gain.exponentialRampToValueAtTime(0.16 * MOODS[mood].gain, ctx.currentTime + 1.2);
  bus.connect(master);
  const state = { mood, next: ctx.currentTime + 0.1, step: 0, bus, timer: 0 as unknown as ReturnType<typeof setInterval> };
  const beat = 60 / MOODS[mood].bpm;
  const note = (f: number, t: number, d: number, type: OscillatorType, g: number) => {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f, t);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(g, t + 0.015);
    env.gain.exponentialRampToValueAtTime(0.0001, t + d);
    osc.connect(env).connect(bus);
    osc.start(t);
    osc.stop(t + d + 0.02);
  };
  state.timer = setInterval(() => {
    // Schedule everything due in the next 300 ms.
    while (state.next < ctx.currentTime + 0.3) {
      const t = state.next;
      const bar = Math.floor(state.step / 4) % 8;
      const chord = Math.floor(bar / 2);
      const beatInBar = state.step % 4;
      // Walking bass on every beat: root, fifth, octave, fifth.
      note(freq(ROOTS[chord] + [0, 7, 12, 7][beatInBar]), t, beat * 0.9, 'triangle', 0.5);
      // Soft chord stabs on 2 and 4.
      if (beatInBar === 1 || beatInBar === 3) for (const s of CHORDS[chord]) note(freq(ROOTS[chord] + s), t, beat * 0.5, 'sine', 0.12);
      // The monitor blip on 1, Beep keeping time.
      if (beatInBar === 0) note(1975, t, 0.05, 'sine', 0.06);
      state.next += beat;
      state.step += 1;
    }
  }, 100);
  music = state;
}

export function stopMusic() {
  if (!music || !audio) return;
  const { bus, timer } = music;
  clearInterval(timer);
  bus.gain.cancelScheduledValues(audio.currentTime);
  bus.gain.setValueAtTime(Math.max(0.0001, bus.gain.value), audio.currentTime);
  bus.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.6);
  setTimeout(() => bus.disconnect(), 800);
  music = null;
}
