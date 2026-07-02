import { cache } from 'react';
import { desc, eq, inArray } from 'drizzle-orm';
import { getDb } from '@/db';
import { expenses, expenseShares, flatMembers, flats } from '@/db/schema';

export interface FlatMemberRow {
  id: string;
  displayName: string;
  joinedAt: Date;
  userId: string;
}

export interface FlatContext {
  flat: { id: string; name: string; inviteCode: string };
  members: FlatMemberRow[];
  /** The signed-in user's membership row. */
  membership: FlatMemberRow;
}

/**
 * The flat the user belongs to, with all members. MVP assumes one
 * flat per user; the earliest membership wins if there are several.
 */
export const getFlatContext = cache(async (userId: string): Promise<FlatContext | null> => {
  const db = getDb();
  const membership = await db.query.flatMembers.findFirst({
    where: eq(flatMembers.userId, userId),
    orderBy: flatMembers.joinedAt,
  });
  if (!membership) {
    return null;
  }

  const flat = await db.query.flats.findFirst({ where: eq(flats.id, membership.flatId) });
  if (!flat) {
    return null;
  }

  const members = await db.query.flatMembers.findMany({
    where: eq(flatMembers.flatId, flat.id),
    orderBy: flatMembers.joinedAt,
  });

  return {
    flat: { id: flat.id, name: flat.name, inviteCode: flat.inviteCode },
    members,
    membership,
  };
});

export interface ExpenseRow {
  id: string;
  description: string;
  category: string;
  splitMethod: string;
  amountCents: number;
  incurredOn: string;
  paidByMemberId: string;
  shares: { memberId: string; cents: number }[];
}

/** All expenses for a flat, newest first, with their shares. */
export async function getFlatExpenses(flatId: string): Promise<ExpenseRow[]> {
  const db = getDb();
  const rows = await db.query.expenses.findMany({
    where: eq(expenses.flatId, flatId),
    orderBy: [desc(expenses.incurredOn), desc(expenses.createdAt)],
  });
  if (rows.length === 0) {
    return [];
  }

  const shares = await db
    .select({
      expenseId: expenseShares.expenseId,
      memberId: expenseShares.memberId,
      cents: expenseShares.cents,
    })
    .from(expenseShares)
    .where(
      inArray(
        expenseShares.expenseId,
        rows.map((row) => row.id),
      ),
    );
  const byExpense = new Map<string, { memberId: string; cents: number }[]>();
  for (const share of shares) {
    const list = byExpense.get(share.expenseId) ?? [];
    list.push({ memberId: share.memberId, cents: share.cents });
    byExpense.set(share.expenseId, list);
  }

  return rows.map((row) => ({
    id: row.id,
    description: row.description,
    category: row.category,
    splitMethod: row.splitMethod,
    amountCents: row.amountCents,
    incurredOn: row.incurredOn,
    paidByMemberId: row.paidByMemberId,
    shares: byExpense.get(row.id) ?? [],
  }));
}
