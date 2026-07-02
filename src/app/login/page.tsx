import { ArrowRight, Split } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signIn } from '@/auth';

export const metadata = {
  title: 'Sign in — FlatSplit',
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect('/app');
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[1200px] flex-col px-6">
      <header className="flex items-center justify-between border-b border-border py-4">
        <Link href="/" className="flex items-center gap-2">
          <Split className="size-5 text-accent" strokeWidth={1.5} />
          <span className="text-sm font-semibold">FlatSplit</span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center py-16">
        <div className="w-full max-w-sm rounded-lg border border-border bg-surface-1 p-8">
          <h1 className="text-lg font-semibold">Sign in</h1>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">
            Try the demo flat: four flatmates and three months of bills, ready to explore. No signup
            needed.
          </p>

          <form
            action={async () => {
              'use server';
              await signIn('demo', { redirectTo: '/app' });
            }}
            className="mt-6"
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Open the demo flat
              <ArrowRight className="size-4" strokeWidth={2} />
            </button>
          </form>

          <div className="mt-6 border-t border-border pt-5">
            <p className="text-xs text-fg-muted">Or sign in with email for your own flat</p>
            <form
              action={async (formData) => {
                'use server';
                await signIn('resend', {
                  email: String(formData.get('email') ?? ''),
                  redirectTo: '/app',
                });
              }}
              className="mt-3 flex flex-col gap-3"
            >
              <input
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                aria-label="Email address"
                className="rounded-md border border-border bg-surface-0 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-md border border-border bg-surface-2 px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-0"
              >
                Email me a sign-in link
              </button>
            </form>
            <p className="mt-4 text-xs leading-relaxed text-fg-muted">
              The demo account is shared and resets periodically.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
