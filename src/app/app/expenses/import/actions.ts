'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getDb } from '@/db';
import { expenses, expenseShares } from '@/db/schema';
import { getFlatContext } from '@/db/queries';
import { splitEvenly } from '@/lib/money';

export interface ImportItem {
  description: string;
  amountCents: number;
  incurredOn: string;
}

export interface ImportResult {
  error?: string;
  imported?: number;
}

const MAX_IMPORT_ROWS = 200;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Bulk-insert transactions selected from a bank CSV as equally split
 * expenses paid by the chosen member. Parsing happens client-side
 * with nz-bank-parser; this action revalidates every row anyway.
 */
export async function importExpenses(
  paidByMemberId: string,
  items: ImportItem[],
): Promise<ImportResult> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  const context = await getFlatContext(session.user.id);
  if (!context) {
    redirect('/app');
  }

  if (!context.members.some((m) => m.id === paidByMemberId)) {
    return { error: 'The payer must be a member of the flat.' };
  }
  if (items.length === 0) {
    return { error: 'Select at least one transaction.' };
  }
  if (items.length > MAX_IMPORT_ROWS) {
    return { error: `Import at most ${String(MAX_IMPORT_ROWS)} transactions at a time.` };
  }
  for (const item of items) {
    if (
      typeof item.description !== 'string' ||
      item.description.trim().length === 0 ||
      item.description.length > 200 ||
      !Number.isInteger(item.amountCents) ||
      item.amountCents <= 0 ||
      !ISO_DATE.test(item.incurredOn)
    ) {
      return { error: 'One of the selected rows is not a valid expense.' };
    }
  }

  const db = getDb();
  const memberIds = context.members.map((m) => m.id);

  for (const item of items) {
    const inserted = await db
      .insert(expenses)
      .values({
        flatId: context.flat.id,
        paidByMemberId,
        description: item.description.trim().slice(0, 100),
        category: 'other',
        splitMethod: 'equal',
        amountCents: item.amountCents,
        incurredOn: item.incurredOn,
      })
      .returning({ id: expenses.id });
    const expenseId = inserted[0]?.id;
    if (!expenseId) {
      return { error: 'Import failed part-way. Check the expense list before retrying.' };
    }
    const parts = splitEvenly(item.amountCents, memberIds.length);
    await db.insert(expenseShares).values(
      memberIds.map((memberId, i) => ({
        expenseId,
        memberId,
        cents: parts[i] ?? 0,
      })),
    );
  }

  revalidatePath('/app');
  revalidatePath('/app/expenses');
  revalidatePath('/app/settle');
  return { imported: items.length };
}
