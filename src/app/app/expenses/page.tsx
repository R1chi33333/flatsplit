import { FileUp, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getFlatContext, getFlatExpenses } from '@/db/queries';
import { formatCents } from '@/lib/money';
import { deleteExpense } from './actions';
import { ExpenseForm } from './expense-form';

export const metadata = {
  title: 'Expenses — FlatSplit',
};

const CATEGORY_LABELS: Record<string, string> = {
  rent: 'Rent',
  power: 'Power',
  internet: 'Internet',
  groceries: 'Groceries',
  household: 'Household',
  other: 'Other',
};

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default async function ExpensesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  const context = await getFlatContext(session.user.id);
  if (!context) {
    redirect('/app');
  }

  const { flat, members } = context;
  const rows = await getFlatExpenses(flat.id);
  const nameById = new Map(members.map((m) => [m.id, m.displayName]));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Expenses</h1>
        <div className="flex items-center gap-4">
          <Link
            href="/app/expenses/import"
            className="flex items-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
          >
            <FileUp className="size-4" strokeWidth={1.5} />
            Import CSV
          </Link>
          <span className="font-mono text-sm text-fg-muted">{rows.length} recorded</span>
        </div>
      </div>

      <ExpenseForm
        members={members.map((m) => ({ id: m.id, displayName: m.displayName }))}
        defaultDate={today}
      />

      {rows.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface-1 p-10 text-center">
          <p className="text-sm">No expenses yet</p>
          <p className="mt-1 text-xs text-fg-muted">
            Add the first one above, rent day is never far away.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-1 text-xs text-fg-muted">
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 font-medium">Description</th>
                <th className="px-4 py-2.5 font-medium">Category</th>
                <th className="px-4 py-2.5 font-medium">Paid by</th>
                <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-surface-1">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-fg-muted">
                    {formatDate(row.incurredOn)}
                  </td>
                  <td className="max-w-56 truncate px-4 py-3" title={row.description}>
                    {row.description}
                  </td>
                  <td className="px-4 py-3 text-xs text-fg-muted">
                    {CATEGORY_LABELS[row.category] ?? row.category}
                  </td>
                  <td className="px-4 py-3 text-xs text-fg-muted">
                    {nameById.get(row.paidByMemberId) ?? 'Former member'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono">
                    {formatCents(row.amountCents)}
                  </td>
                  <td className="px-2 py-3 text-right">
                    <form action={deleteExpense}>
                      <input type="hidden" name="expenseId" value={row.id} />
                      <button
                        type="submit"
                        className="rounded p-1.5 text-fg-muted transition-colors hover:bg-surface-2 hover:text-red-400"
                        aria-label={`Delete ${row.description}`}
                      >
                        <Trash2 className="size-4" strokeWidth={1.5} />
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
