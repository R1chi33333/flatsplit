'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getDb } from '@/db';
import { expenseCategory, expenses, expenseShares } from '@/db/schema';
import { getFlatContext } from '@/db/queries';
import { splitEvenly } from '@/lib/money';
import { parseDollarsToCents, splitByRatio } from '@/lib/split';

export interface ExpenseActionState {
  error?: string;
}

const CATEGORIES = expenseCategory.enumValues;
const SPLIT_METHODS = ['equal', 'ratio', 'fixed'] as const;
type SplitMethodValue = (typeof SPLIT_METHODS)[number];

interface ShareInput {
  memberId: string;
  cents: number;
}

function computeShares(
  method: SplitMethodValue,
  amountCents: number,
  memberIds: string[],
  formData: FormData,
): ShareInput[] | string {
  if (method === 'equal') {
    const selected = memberIds.filter((id) => formData.get(`include-${id}`) === 'on');
    if (selected.length === 0) {
      return 'Select at least one member to split between.';
    }
    const parts = splitEvenly(amountCents, selected.length);
    return selected.map((memberId, i) => ({ memberId, cents: parts[i] ?? 0 }));
  }

  if (method === 'ratio') {
    const weights = memberIds.map((id) => Number(formData.get(`weight-${id}`) ?? 0));
    if (weights.some((w) => !Number.isFinite(w) || w < 0)) {
      return 'Ratio weights must be zero or positive numbers.';
    }
    if (weights.every((w) => w === 0)) {
      return 'At least one member needs a positive ratio.';
    }
    const parts = splitByRatio(amountCents, weights);
    return memberIds
      .map((memberId, i) => ({ memberId, cents: parts[i] ?? 0 }))
      .filter((share) => share.cents > 0);
  }

  const shares: ShareInput[] = [];
  let sum = 0;
  for (const id of memberIds) {
    const raw = String(formData.get(`fixed-${id}`) ?? '').trim();
    if (raw === '') {
      continue;
    }
    const cents = parseDollarsToCents(raw);
    if (cents === undefined) {
      return 'Fixed amounts must be valid dollar values.';
    }
    if (cents > 0) {
      shares.push({ memberId: id, cents });
      sum += cents;
    }
  }
  if (shares.length === 0) {
    return 'Enter at least one fixed amount.';
  }
  if (sum !== amountCents) {
    return `Fixed amounts must add up to the total. They are ${sum > amountCents ? 'over' : 'short'} by ${Math.abs(sum - amountCents) / 100} dollars.`;
  }
  return shares;
}

export async function addExpense(
  _prev: ExpenseActionState,
  formData: FormData,
): Promise<ExpenseActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  const context = await getFlatContext(session.user.id);
  if (!context) {
    redirect('/app');
  }

  const description = String(formData.get('description') ?? '').trim();
  if (description.length < 1 || description.length > 100) {
    return { error: 'Description must be between 1 and 100 characters.' };
  }

  const amountCents = parseDollarsToCents(String(formData.get('amount') ?? ''));
  if (amountCents === undefined || amountCents === 0) {
    return { error: 'Enter a valid amount above zero.' };
  }

  const category = String(formData.get('category') ?? 'other');
  if (!(CATEGORIES as readonly string[]).includes(category)) {
    return { error: 'Unknown category.' };
  }

  const method = String(formData.get('splitMethod') ?? 'equal');
  if (!(SPLIT_METHODS as readonly string[]).includes(method)) {
    return { error: 'Unknown split method.' };
  }

  const incurredOn = String(formData.get('incurredOn') ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(incurredOn)) {
    return { error: 'Pick a valid date.' };
  }

  const paidByMemberId = String(formData.get('paidBy') ?? '');
  const memberIds = context.members.map((m) => m.id);
  if (!memberIds.includes(paidByMemberId)) {
    return { error: 'The payer must be a member of the flat.' };
  }

  const shares = computeShares(method as SplitMethodValue, amountCents, memberIds, formData);
  if (typeof shares === 'string') {
    return { error: shares };
  }

  const db = getDb();
  const inserted = await db
    .insert(expenses)
    .values({
      flatId: context.flat.id,
      paidByMemberId,
      description,
      category: category as (typeof CATEGORIES)[number],
      splitMethod: method as SplitMethodValue,
      amountCents,
      incurredOn,
    })
    .returning({ id: expenses.id });
  const expenseId = inserted[0]?.id;
  if (!expenseId) {
    return { error: 'Could not save the expense. Try again.' };
  }
  await db
    .insert(expenseShares)
    .values(shares.map((share) => ({ expenseId, memberId: share.memberId, cents: share.cents })));

  revalidatePath('/app');
  revalidatePath('/app/expenses');
  revalidatePath('/app/settle');
  return {};
}

export async function deleteExpense(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  const context = await getFlatContext(session.user.id);
  if (!context) {
    redirect('/app');
  }

  const expenseId = String(formData.get('expenseId') ?? '');
  const db = getDb();
  await db
    .delete(expenses)
    .where(and(eq(expenses.id, expenseId), eq(expenses.flatId, context.flat.id)));

  revalidatePath('/app');
  revalidatePath('/app/expenses');
  revalidatePath('/app/settle');
}
