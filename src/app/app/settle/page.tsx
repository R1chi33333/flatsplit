import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getFlatContext, getFlatExpenses } from '@/db/queries';
import { formatCents } from '@/lib/money';
import { netBalances, settle, type Expense } from '@/lib/settlement';

export const metadata = {
  title: 'Settle up — FlatSplit',
};

export default async function SettlePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  const context = await getFlatContext(session.user.id);
  if (!context) {
    redirect('/app');
  }

  const { flat, members, membership } = context;
  const rows = await getFlatExpenses(flat.id);
  const nameById = new Map(members.map((m) => [m.id, m.displayName]));

  const expenses: Expense[] = rows.map((row) => ({
    payerId: row.paidByMemberId,
    amountCents: row.amountCents,
    shares: row.shares,
  }));
  const balances = netBalances(expenses);
  for (const member of members) {
    if (!balances.has(member.id)) {
      balances.set(member.id, 0);
    }
  }
  const transfers = settle(balances);

  const balanceList = members
    .map((m) => ({ id: m.id, name: m.displayName, cents: balances.get(m.id) ?? 0 }))
    .sort((a, b) => b.cents - a.cents);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Settle up</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Net position per member, and the fewest transfers that square everyone away.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {balanceList.map((member) => (
          <div
            key={member.id}
            className={`rounded-lg border bg-surface-1 p-4 ${
              member.id === membership.id ? 'border-accent' : 'border-border'
            }`}
          >
            <p className="truncate text-xs text-fg-muted">
              {member.name}
              {member.id === membership.id ? ' (you)' : ''}
            </p>
            <p
              className={`mt-1 font-mono text-lg font-semibold ${
                member.cents > 0 ? 'text-accent' : member.cents < 0 ? 'text-fg' : 'text-fg-muted'
              }`}
            >
              {member.cents > 0 ? '+' : ''}
              {formatCents(member.cents)}
            </p>
            <p className="mt-0.5 text-xs text-fg-muted">
              {member.cents > 0 ? 'is owed' : member.cents < 0 ? 'owes the flat' : 'all square'}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-border bg-surface-1">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-medium">
            {transfers.length === 0
              ? 'Nothing to settle'
              : `${transfers.length} transfer${transfers.length === 1 ? '' : 's'} to settle everything`}
          </h2>
        </div>
        {transfers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
            <CheckCircle2 className="size-5 text-accent" strokeWidth={1.5} />
            <p className="text-sm text-fg-muted">
              Everyone is square. Record more expenses and come back.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {transfers.map((transfer, i) => (
              <li key={i} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="flex min-w-0 items-center gap-2 text-sm">
                  <span className="truncate">{nameById.get(transfer.fromId) ?? 'Member'}</span>
                  <ArrowRight className="size-4 shrink-0 text-fg-muted" strokeWidth={1.5} />
                  <span className="truncate">{nameById.get(transfer.toId) ?? 'Member'}</span>
                </div>
                <span className="font-mono text-sm font-medium">{formatCents(transfer.cents)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
