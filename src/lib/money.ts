/**
 * Money utilities. All amounts in FlatSplit are integer cents,
 * matching the convention of nz-bank-parser.
 */

const nzd = new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' });

/** Format integer cents as an NZD string, e.g. 123456 -> "$1,234.56". */
export function formatCents(cents: number): string {
  return nzd.format(cents / 100);
}

/**
 * Split an amount into `count` integer shares that sum exactly to the
 * total. Remainder cents go to the earliest shares, so no cent is ever
 * lost or invented.
 */
export function splitEvenly(totalCents: number, count: number): number[] {
  if (!Number.isInteger(totalCents) || totalCents < 0) {
    throw new RangeError('totalCents must be a non-negative integer');
  }
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError('count must be a positive integer');
  }
  const base = Math.floor(totalCents / count);
  const remainder = totalCents % count;
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
}
