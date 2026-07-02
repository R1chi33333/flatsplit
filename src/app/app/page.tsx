import { LogOut, Split } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signOut } from '@/auth';

export const metadata = {
  title: 'Dashboard — FlatSplit',
};

export default async function AppPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[1200px] flex-col px-6">
      <header className="flex items-center justify-between border-b border-border py-4">
        <Link href="/" className="flex items-center gap-2">
          <Split className="size-5 text-accent" strokeWidth={1.5} />
          <span className="text-sm font-semibold">FlatSplit</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-fg-muted">{session.user.name}</span>
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/' });
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
            >
              <LogOut className="size-4" strokeWidth={1.5} />
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
        <h1 className="text-xl font-semibold">Signed in as {session.user.name}</h1>
        <p className="max-w-sm text-sm leading-relaxed text-fg-muted">
          The flat dashboard lands in the next milestone: members, expenses and the settlement view.
        </p>
      </main>
    </div>
  );
}
