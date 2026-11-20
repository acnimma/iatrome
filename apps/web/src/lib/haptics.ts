/**
 * Tiny haptic vocabulary. Uses the Vibration API where available (Android
 * Chrome); silently does nothing elsewhere (iOS Safari has no Vibration API).
 */
const patterns = {
  tap: 8,
  success: [12, 40, 18],
  error: [40, 30, 40],
} as const;

export type Haptic = keyof typeof patterns;

export function haptic(kind: Haptic) {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  try {
    navigator.vibrate(patterns[kind] as VibratePattern);
  } catch {
    // some browsers throw when called without a user gesture — ignore
  }
}
