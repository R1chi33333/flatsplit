/**
 * Ratio-based splitting using the largest remainder method: each
 * share gets its exact proportional floor, then leftover cents go to
 * the shares with the largest fractional parts. Deterministic, exact,
 * and never loses a cent.
 */
export function splitByRatio(totalCents: number, weights: readonly number[]): number[] {
  if (!Number.isInteger(totalCents) || totalCents < 0) {
    throw new RangeError('totalCents must be a non-negative integer');
  }
  if (weights.length === 0) {
    throw new RangeError('weights must not be empty');
  }
  if (weights.some((w) => !Number.isFinite(w) || w < 0)) {
    throw new RangeError('weights must be non-negative finite numbers');
  }
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight <= 0) {
    throw new RangeError('at least one weight must be positive');
  }

  const exact = weights.map((w) => (totalCents * w) / totalWeight);
  const floors = exact.map(Math.floor);
  let remainder = totalCents - floors.reduce((a, b) => a + b, 0);

  const order = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);

  const shares = [...floors];
  for (const { index } of order) {
    if (remainder === 0) {
      break;
    }
    const share = shares[index];
    if (share !== undefined) {
      shares[index] = share + 1;
      remainder--;
    }
  }
  return shares;
}

/**
 * Parse a user-typed dollar amount ("84.50", "$1,234", "12") into
 * integer cents. Returns undefined for anything malformed, negative
 * or with sub-cent precision.
 */
export function parseDollarsToCents(input: string): number | undefined {
  const text = input.trim().replace(/^\$/, '').replaceAll(',', '');
  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    return undefined;
  }
  const [whole = '0', decimals = ''] = text.split('.');
  return Number(whole) * 100 + Number(decimals.padEnd(2, '0') || '0');
}
