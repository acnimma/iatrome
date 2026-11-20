/**
 * Sound effects, synthesized with WebAudio — no files, no licensing, instant.
 * Browsers only allow audio after a user gesture; call `unlockAudio()` from a click.
 */

export type Sfx = 'pop' | 'tick' | 'whoosh' | 'reveal' | 'vote' | 'win' | 'consensus' | 'buzz' | 'drumroll' | 'lose' | 'correct';

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
    case 'drumroll':
      for (let i = 0; i < 14; i++) noise(i * 0.06, 0.05, { from: 150, to: 400, gain: 0.08 + i * 0.008 });
      return;
  }
}
