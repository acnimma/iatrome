const encoder = new TextEncoder();

const toHex = (buf: ArrayBuffer | Uint8Array) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

export function randomToken(bytes = 18): string {
  return toHex(crypto.getRandomValues(new Uint8Array(bytes)));
}

/** Salted SHA-256. Room passwords are short-lived party passwords, not account credentials. */
export async function hashPassword(password: string, salt = randomToken(12)) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(`${salt}:${password.trim()}`));
  return { salt, hash: toHex(digest) };
}

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
