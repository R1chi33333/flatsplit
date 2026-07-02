import { describe, expect, it } from 'vitest';
import {
  generateInviteCode,
  INVITE_CODE_LENGTH,
  isValidInviteCode,
  normaliseInviteCode,
} from '../src/lib/invite';

describe('generateInviteCode', () => {
  it('produces codes of the right length from the safe alphabet', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateInviteCode();
      expect(code).toHaveLength(INVITE_CODE_LENGTH);
      expect(isValidInviteCode(code)).toBe(true);
    }
  });

  it('never contains lookalike characters', () => {
    for (let i = 0; i < 200; i++) {
      expect(generateInviteCode()).not.toMatch(/[01OIL]/);
    }
  });

  it('is deterministic for a seeded random source', () => {
    const fixed = () => 0.5;
    expect(generateInviteCode(fixed)).toBe(generateInviteCode(fixed));
  });
});

describe('normaliseInviteCode', () => {
  it('uppercases and strips whitespace', () => {
    expect(normaliseInviteCode('  ab c9 2x ')).toBe('ABC92X');
  });
});

describe('isValidInviteCode', () => {
  it('accepts normalised valid codes', () => {
    expect(isValidInviteCode('abc92x')).toBe(true);
  });

  it('rejects wrong lengths and bad characters', () => {
    expect(isValidInviteCode('ABC92')).toBe(false);
    expect(isValidInviteCode('ABC92XY')).toBe(false);
    expect(isValidInviteCode('ABC10I')).toBe(false);
    expect(isValidInviteCode('')).toBe(false);
  });
});
