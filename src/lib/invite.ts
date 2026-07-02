/**
 * Invite codes are short enough to read out over a flat group chat
 * and use an alphabet without lookalike characters (no 0/O, 1/I/L).
 */

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const INVITE_CODE_LENGTH = 6;

export function generateInviteCode(random: () => number = Math.random): string {
  let code = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += ALPHABET.charAt(Math.floor(random() * ALPHABET.length));
  }
  return code;
}

/** Uppercases and strips whitespace so pasted codes still match. */
export function normaliseInviteCode(input: string): string {
  return input.trim().toUpperCase().replaceAll(/\s+/g, '');
}

export function isValidInviteCode(input: string): boolean {
  const code = normaliseInviteCode(input);
  return code.length === INVITE_CODE_LENGTH && [...code].every((c) => ALPHABET.includes(c));
}
