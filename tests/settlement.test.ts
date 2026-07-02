import { describe, expect, it } from 'vitest';
import { netBalances, settle, settleExpenses, type Expense } from '../src/lib/settlement';
import { splitEvenly } from '../src/lib/money';

function expense(payerId: string, amountCents: number, memberIds: string[]): Expense {
  const shares = splitEvenly(amountCents, memberIds.length);
  return {
    payerId,
    amountCents,
    shares: memberIds.map((memberId, i) => ({ memberId, cents: shares[i] ?? 0 })),
  };
}

/** Apply transfers to balances and assert everyone ends at zero. */
function assertSettles(balances: Map<string, number>, transfers: ReturnType<typeof settle>) {
  const after = new Map(balances);
  for (const t of transfers) {
    after.set(t.fromId, (after.get(t.fromId) ?? 0) + t.cents);
    after.set(t.toId, (after.get(t.toId) ?? 0) - t.cents);
  }
  for (const [id, cents] of after) {
    expect(cents, `member ${id} should end settled`).toBe(0);
  }
}

describe('netBalances', () => {
  it('credits the payer and debits every share', () => {
    const balances = netBalances([expense('ana', 3000, ['ana', 'ben', 'cam'])]);
    expect(balances.get('ana')).toBe(2000);
    expect(balances.get('ben')).toBe(-1000);
    expect(balances.get('cam')).toBe(-1000);
  });

  it('sums multiple expenses and always totals zero', () => {
    const balances = netBalances([
      expense('ana', 28000, ['ana', 'ben', 'cam', 'dee']),
      expense('ben', 14219, ['ana', 'ben', 'cam', 'dee']),
      expense('cam', 8743, ['ana', 'cam']),
    ]);
    const total = [...balances.values()].reduce((a, b) => a + b, 0);
    expect(total).toBe(0);
  });

  it('rejects expenses whose shares do not sum to the total', () => {
    expect(() =>
      netBalances([
        { payerId: 'ana', amountCents: 1000, shares: [{ memberId: 'ben', cents: 999 }] },
      ]),
    ).toThrow(RangeError);
  });
});

describe('settle', () => {
  it('returns no transfers when everyone is square', () => {
    expect(settle(new Map([['ana', 0]]))).toEqual([]);
    expect(settle(new Map())).toEqual([]);
  });

  it('settles a simple two-person debt with one transfer', () => {
    const balances = new Map([
      ['ana', 1500],
      ['ben', -1500],
    ]);
    expect(settle(balances)).toEqual([{ fromId: 'ben', toId: 'ana', cents: 1500 }]);
  });

  it('uses at most n-1 transfers and zeroes every balance', () => {
    const balances = new Map([
      ['ana', 7000],
      ['ben', -2500],
      ['cam', -2500],
      ['dee', -2000],
    ]);
    const transfers = settle(balances);
    expect(transfers.length).toBeLessThanOrEqual(3);
    assertSettles(balances, transfers);
  });

  it('produces a deterministic plan for tied amounts', () => {
    const balances = new Map([
      ['zoe', 1000],
      ['amy', 1000],
      ['ben', -1000],
      ['cal', -1000],
    ]);
    expect(settle(balances)).toEqual([
      { fromId: 'ben', toId: 'amy', cents: 1000 },
      { fromId: 'cal', toId: 'zoe', cents: 1000 },
    ]);
  });

  it('never emits zero or negative transfers', () => {
    const balances = new Map([
      ['ana', 3],
      ['ben', -1],
      ['cam', -2],
      ['dee', 0],
    ]);
    const transfers = settle(balances);
    for (const t of transfers) {
      expect(t.cents).toBeGreaterThan(0);
    }
    assertSettles(balances, transfers);
  });

  it('rejects balances that do not sum to zero', () => {
    expect(() => settle(new Map([['ana', 1]]))).toThrow(RangeError);
  });
});

describe('settleExpenses', () => {
  it('settles a realistic month of flat expenses', () => {
    const flat = ['ana', 'ben', 'cam', 'dee'];
    const expenses = [
      expense('ana', 112000, flat), // rent, paid by ana
      expense('ben', 14219, flat), // power
      expense('cam', 8999, flat), // broadband
      expense('dee', 18650, flat), // groceries
      expense('ana', 4520, ['ana', 'ben']), // shared taxi
    ];
    const transfers = settleExpenses(expenses);

    expect(transfers.length).toBeLessThanOrEqual(flat.length - 1);
    assertSettles(netBalances(expenses), transfers);
  });

  it('handles amounts that do not divide evenly without losing cents', () => {
    const expenses = [expense('ana', 1000, ['ana', 'ben', 'cam'])];
    const transfers = settleExpenses(expenses);
    const paidToAna = transfers
      .filter((t) => t.toId === 'ana')
      .reduce((sum, t) => sum + t.cents, 0);
    expect(paidToAna).toBe(666);
  });
});
