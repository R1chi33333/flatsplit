import { Users } from 'lucide-react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getFlatContext, getFlatExpenses } from '@/db/queries';
import { formatCents } from '@/lib/money';
import { Onboarding } from './onboarding';

export const metadata = {
  title: 'Overview — FlatSplit',
};

export default async function OverviewPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const context = await getFlatContext(session.user.id);
  if (!context) {
    return (
      <div className="flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Welcome to FlatSplit</h1>
          <p className="mt-2 text-sm text-fg-muted">
            Create a flat or join one to start tracking shared expenses.
          </p>
        </div>
        <Onboarding />
      </div>
    );
  }

  const { flat, members } = context;
  const expenses = await getFlatExpenses(flat.id);
  const totalCents = expenses.reduce((sum, e) => sum + e.amountCents, 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{flat.name}</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {members.length} member{members.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="rounded-md border border-border bg-surface-1 px-3 py-2 text-sm">
          <span className="text-fg-muted">Invite code </span>
          <span className="font-mono font-medium tracking-wider">{flat.inviteCode}</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-lg border border-border bg-surface-1 p-5">
          <p className="text-xs text-fg-muted">Expenses recorded</p>
          <p className="mt-1 font-mono text-2xl font-semibold">{expenses.length}</p>
        </section>
        <section className="rounded-lg border border-border bg-surface-1 p-5">
          <p className="text-xs text-fg-muted">Total tracked</p>
          <p className="mt-1 font-mono text-2xl font-semibold">{formatCents(totalCents)}</p>
        </section>
      </div>

      <section className="rounded-lg border border-border bg-surface-1">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <Users className="size-4 text-fg-muted" strokeWidth={1.5} />
          <h2 className="text-sm font-medium">Members</h2>
        </div>
        <ul className="divide-y divide-border">
          {members.map((member) => (
            <li key={member.id} className="flex items-center justify-between px-5 py-3">
              <span className="text-sm">{member.displayName}</span>
              <span className="text-xs text-fg-muted">
                joined{' '}
                {member.joinedAt.toLocaleDateString('en-NZ', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
