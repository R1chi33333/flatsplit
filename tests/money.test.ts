import { describe, expect, it } from 'vitest';
import { formatCents, splitEvenly } from '../src/lib/money';

describe('formatCents', () => {
  it('formats integer cents as NZD', () => {
    expect(formatCents(123456)).toBe('$1,234.56');
    expect(formatCents(5)).toBe('$0.05');
  });
});

describe('splitEvenly', () => {
  it('splits amounts that divide exactly', () => {
    expect(splitEvenly(900, 3)).toEqual([300, 300, 300]);
  });

  it('distributes remainder cents to the earliest shares', () => {
    expect(splitEvenly(1000, 3)).toEqual([334, 333, 333]);
    expect(splitEvenly(1001, 3)).toEqual([334, 334, 333]);
  });

  it('always sums back to the total', () => {
    for (const [total, count] of [
      [999, 4],
      [1, 3],
      [28000, 7],
    ] as const) {
      const shares = splitEvenly(total, count);
      expect(shares.reduce((a, b) => a + b, 0)).toBe(total);
      expect(shares).toHaveLength(count);
    }
  });

  it('rejects invalid input', () => {
    expect(() => splitEvenly(-1, 2)).toThrow(RangeError);
    expect(() => splitEvenly(10.5, 2)).toThrow(RangeError);
    expect(() => splitEvenly(100, 0)).toThrow(RangeError);
  });
});
