/**
 * Everything this browser remembers, in localStorage:
 *  - a device id (used for bans and password lockouts)
 *  - the last name typed
 *  - per-room session tokens (to rejoin after a refresh or dropped connection)
 *  - per-room host tokens (proof this browser created the room)
 */
const KEY = {
  device: 'iatrome:device',
  name: 'iatrome:name',
  session: (code: string) => `iatrome:session:${code}`,
  host: (code: string) => `iatrome:host:${code}`,
};

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // private mode / storage full: the game still works, it just won't remember you
  }
}

export function deviceId(): string {
  let id = read(KEY.device);
  if (!id) {
    id = crypto.randomUUID();
    write(KEY.device, id);
  }
  return id;
}

export const lastName = () => read(KEY.name) ?? '';
export const rememberName = (name: string) => write(KEY.name, name);

export const sessionToken = (code: string) => read(KEY.session(code));
export const rememberSession = (code: string, token: string | null) => write(KEY.session(code), token);

export const hostToken = (code: string) => read(KEY.host(code));
export const rememberHost = (code: string, token: string) => write(KEY.host(code), token);

/** The host's own copy of the room password, so the stage can show it to read out. */
export const roomPassword = (code: string) => read(`iatrome:password:${code}`);
export const rememberPassword = (code: string, password: string) => write(`iatrome:password:${code}`, password || null);
