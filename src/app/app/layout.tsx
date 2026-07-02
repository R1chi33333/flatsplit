import { LogOut, Split } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signOut } from '@/auth';
import { AppNav } from './nav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[1200px] flex-col px-4 sm:px-6">
      <header className="flex items-center justify-between py-4">
        <Link href="/app" className="flex items-center gap-2">
          <Split className="size-5 text-accent" strokeWidth={1.5} />
          <span className="text-sm font-semibold">FlatSplit</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-fg-muted sm:inline">{session.user.name}</span>
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/' });
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
              aria-label="Sign out"
            >
              <LogOut className="size-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </form>
        </div>
      </header>

      <AppNav />

      <main className="flex-1 py-8">{children}</main>
    </div>
  );
}
