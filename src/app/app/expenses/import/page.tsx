import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getFlatContext } from '@/db/queries';
import { ImportClient } from './import-client';

export const metadata = {
  title: 'Import from bank CSV — FlatSplit',
};

export default async function ImportPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  const context = await getFlatContext(session.user.id);
  if (!context) {
    redirect('/app');
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Import from bank CSV</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Export transactions from internet banking, tick the shared ones, and they land as evenly
          split expenses. Powered by nz-bank-parser.
        </p>
      </div>
      <ImportClient
        members={context.members.map((m) => ({ id: m.id, displayName: m.displayName }))}
        selfMemberId={context.membership.id}
      />
    </div>
  );
}
