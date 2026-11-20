/**
 * Phones-only hosting: the host types their name while setting up the room, so the join
 * screen that follows can walk them straight in. One use per room, kept for this tab only.
 */
const key = (code: string) => `iatrome:auto-join:${code}`;

export function rememberAutoJoin(code: string, name: string) {
  try {
    sessionStorage.setItem(key(code), name);
  } catch {
    // private mode: the host just types their name again
  }
}

export function takeAutoJoin(code: string): string | null {
  try {
    const name = sessionStorage.getItem(key(code));
    sessionStorage.removeItem(key(code));
    return name;
  } catch {
    return null;
  }
}
