import { MailCheck, Split } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Check your email — FlatSplit',
};

export default function VerifyPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[1200px] flex-col px-6">
      <header className="flex items-center justify-between border-b border-border py-4">
        <Link href="/" className="flex items-center gap-2">
          <Split className="size-5 text-accent" strokeWidth={1.5} />
          <span className="text-sm font-semibold">FlatSplit</span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center py-16">
        <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-lg border border-border bg-surface-1 p-8 text-center">
          <MailCheck className="size-6 text-accent" strokeWidth={1.5} />
          <h1 className="text-lg font-semibold">Check your email</h1>
          <p className="text-sm leading-relaxed text-fg-muted">
            A sign-in link is on its way. It expires in 24 hours; you can close this tab.
          </p>
        </div>
      </main>
    </div>
  );
}
