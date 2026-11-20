import { ROOM } from '@iatrome/game/client';

const pattern = new RegExp(`^[${ROOM.codeAlphabet}]{${ROOM.codeLength}}$`);

export const isValidCode = (code: string) => pattern.test(code);
