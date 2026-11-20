/**
 * "Read aloud" for the stage: reads prompts and answers so remote players on a
 * laggy Zoom share can follow along. Uses the browser's built-in voices.
 */

const KEY = 'iatrome:read-aloud';

export function readAloudEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function setReadAloud(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch {}
  if (!on) window.speechSynthesis?.cancel();
}

let voice: SpeechSynthesisVoice | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  const english = voices.filter((v) => v.lang.startsWith('en'));
  const preferred = ['Samantha', 'Google UK English Female', 'Google US English', 'Daniel', 'Karen', 'Microsoft Aria'];
  return preferred.map((name) => english.find((v) => v.name.includes(name))).find(Boolean) ?? english[0] ?? null;
}

export function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis || !readAloudEnabled() || !text.trim()) return;
  voice ??= pickVoice();
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/_{2,}/g, 'blank'));
  if (voice) u.voice = voice;
  u.rate = 1.05;
  u.pitch = 1.05;
  window.speechSynthesis.speak(u);
}
