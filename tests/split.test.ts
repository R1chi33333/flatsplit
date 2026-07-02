import { describe, expect, it } from 'vitest';
import { parseDollarsToCents, splitByRatio } from '../src/lib/split';

describe('splitByRatio', () => {
  it('splits proportionally when amounts divide exactly', () => {
    expect(splitByRatio(1000, [1, 1])).toEqual([500, 500]);
    expect(splitByRatio(3000, [2, 1])).toEqual([2000, 1000]);
  });

  it('gives leftover cents to the largest fractional parts', () => {
    // 100 cents split 1:1:1 -> 33.33 each, first two get the extras
    expect(splitByRatio(100, [1, 1, 1])).toEqual([34, 33, 33]);
    // 2:1 over 100 -> 66.67 and 33.33, larger fraction wins the cent
    expect(splitByRatio(100, [2, 1])).toEqual([67, 33]);
  });

  it('always sums exactly to the total', () => {
    const cases: [number, number[]][] = [
      [999, [3, 2, 1]],
      [28000, [40, 35, 25]],
      [1, [1, 1, 1, 1]],
      [12345, [0.5, 0.3, 0.2]],
    ];
    for (const [total, weights] of cases) {
      const shares = splitByRatio(total, weights);
      expect(shares.reduce((a, b) => a + b, 0)).toBe(total);
    }
  });

  it('gives zero to zero-weight members', () => {
    expect(splitByRatio(900, [1, 0, 2])).toEqual([300, 0, 600]);
  });

  it('breaks fraction ties by position', () => {
    expect(splitByRatio(1, [1, 1])).toEqual([1, 0]);
  });

  it('rejects invalid input', () => {
    expect(() => splitByRatio(-1, [1])).toThrow(RangeError);
    expect(() => splitByRatio(10.5, [1])).toThrow(RangeError);
    expect(() => splitByRatio(100, [])).toThrow(RangeError);
    expect(() => splitByRatio(100, [0, 0])).toThrow(RangeError);
    expect(() => splitByRatio(100, [-1, 2])).toThrow(RangeError);
    expect(() => splitByRatio(100, [Number.NaN])).toThrow(RangeError);
  });
});

describe('parseDollarsToCents', () => {
  it('parses plain and formatted amounts', () => {
    expect(parseDollarsToCents('84.50')).toBe(8450);
    expect(parseDollarsToCents('12')).toBe(1200);
    expect(parseDollarsToCents('$1,234')).toBe(123400);
    expect(parseDollarsToCents(' 0.05 ')).toBe(5);
    expect(parseDollarsToCents('7.5')).toBe(750);
  });

  it('rejects malformed, negative or sub-cent input', () => {
    expect(parseDollarsToCents('')).toBeUndefined();
    expect(parseDollarsToCents('-5')).toBeUndefined();
    expect(parseDollarsToCents('1.234')).toBeUndefined();
    expect(parseDollarsToCents('abc')).toBeUndefined();
    expect(parseDollarsToCents('1.2.3')).toBeUndefined();
  });
});
