/**
 * Settlement engine: turns a pile of shared expenses into the transfers
 * that square everyone up.
 *
 * All amounts are integer cents. Positive net balance means the flat
 * owes you money; negative means you owe the flat.
 *
 * The transfer plan uses a greedy largest-debtor-to-largest-creditor
 * match. It always produces at most n-1 transfers for n members and is
 * exact: applying the transfers zeroes every balance. Finding the true
 * minimum number of transfers is NP-hard (it hides subset sum), and for
 * flat-sized groups the greedy plan is optimal or within one transfer.
 */

/** One shared expense: who paid, and how it is split. */
export interface Expense {
  /** Member who fronted the money. */
  payerId: string;
  /** Total in cents. Must equal the sum of share amounts. */
  amountCents: number;
  /** How the expense divides across members, in cents. */
  shares: readonly { memberId: string; cents: number }[];
}

/** A single repayment instruction. */
export interface Transfer {
  fromId: string;
  toId: string;
  cents: number;
}

/**
 * Net position per member across all expenses: what they paid minus
 * what they owe. Balances always sum to zero.
 *
 * @throws RangeError when an expense's shares do not sum to its total.
 */
export function netBalances(expenses: readonly Expense[]): Map<string, number> {
  const balances = new Map<string, number>();
  const add = (id: string, cents: number): void => {
    balances.set(id, (balances.get(id) ?? 0) + cents);
  };

  for (const expense of expenses) {
    const shareSum = expense.shares.reduce((sum, share) => sum + share.cents, 0);
    if (shareSum !== expense.amountCents) {
      throw new RangeError(
        `Expense shares sum to ${String(shareSum)} but the total is ${String(expense.amountCents)}`,
      );
    }
    add(expense.payerId, expense.amountCents);
    for (const share of expense.shares) {
      add(share.memberId, -share.cents);
    }
  }

  return balances;
}

/**
 * Compute a transfer plan that settles the given balances.
 *
 * Greedy: repeatedly pay the largest debt toward the largest credit.
 * Ties break by member id so the plan is deterministic.
 *
 * @throws RangeError when balances do not sum to zero.
 */
export function settle(balances: ReadonlyMap<string, number>): Transfer[] {
  let total = 0;
  for (const cents of balances.values()) {
    total += cents;
  }
  if (total !== 0) {
    throw new RangeError(`Balances must sum to zero, got ${String(total)}`);
  }

  const byAmountThenId = (a: { id: string; cents: number }, b: { id: string; cents: number }) =>
    b.cents - a.cents || a.id.localeCompare(b.id);

  const creditors = [...balances.entries()]
    .map(([id, cents]) => ({ id, cents }))
    .filter((m) => m.cents > 0)
    .sort(byAmountThenId);
  const debtors = [...balances.entries()]
    .map(([id, cents]) => ({ id, cents: -cents }))
    .filter((m) => m.cents > 0)
    .sort(byAmountThenId);

  const transfers: Transfer[] = [];
  let ci = 0;
  let di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    if (creditor === undefined || debtor === undefined) {
      break;
    }
    const cents = Math.min(creditor.cents, debtor.cents);
    transfers.push({ fromId: debtor.id, toId: creditor.id, cents });
    creditor.cents -= cents;
    debtor.cents -= cents;
    if (creditor.cents === 0) {
      ci++;
    }
    if (debtor.cents === 0) {
      di++;
    }
  }

  return transfers;
}

/**
 * Convenience: balances then transfers in one call.
 */
export function settleExpenses(expenses: readonly Expense[]): Transfer[] {
  return settle(netBalances(expenses));
}
