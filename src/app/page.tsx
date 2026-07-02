import { ArrowRight, FileUp, Scale, Split } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import settleShot from '../../public/shots/settle.png';

const FEATURES = [
  {
    icon: Scale,
    title: 'Split the way your flat works',
    body: 'Evenly, by room-size ratio, or exact amounts. Everything is integer cents, so totals always add up.',
  },
  {
    icon: FileUp,
    title: 'Import straight from your bank',
    body: 'Drop a CSV export from ANZ, ASB, Westpac or Kiwibank. Tick the shared transactions, done.',
  },
  {
    icon: Split,
    title: 'Settle with the fewest transfers',
    body: 'One view of who owes whom, reduced to the minimum number of bank transfers.',
  },
];

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[1200px] flex-col px-6">
      <header className="flex items-center justify-between border-b border-border py-4">
        <div className="flex items-center gap-2">
          <Split className="size-5 text-accent" strokeWidth={1.5} />
          <span className="text-sm font-semibold">FlatSplit</span>
        </div>
        <a
          href="https://github.com/R1chi33333/flatsplit"
          className="text-sm text-fg-muted transition-colors hover:text-fg"
        >
          GitHub
        </a>
      </header>

      <main className="flex flex-1 flex-col items-center gap-12 py-16 text-center">
        <div className="flex flex-col items-center gap-6">
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Fair expenses for New Zealand flats
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-fg-muted sm:text-base">
            Rent, power, broadband and shared groceries, split the way your flat actually works. No
            spreadsheet, no awkward reminders.
          </p>
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Try the demo
            <ArrowRight className="size-4" strokeWidth={2} />
          </Link>
          <p className="text-xs text-fg-muted">
            One click, no signup. A real flat with three months of data.
          </p>
        </div>

        <div className="w-full max-w-4xl overflow-hidden rounded-lg border border-border">
          <Image
            src={settleShot}
            alt="FlatSplit settlement view: member balances and the minimum transfers to settle the flat"
            priority
            className="w-full"
          />
        </div>

        <div className="grid w-full max-w-4xl gap-4 text-left sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-lg border border-border bg-surface-1 p-5">
              <feature.icon className="size-5 text-accent" strokeWidth={1.5} />
              <h2 className="mt-3 text-sm font-medium">{feature.title}</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">{feature.body}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border py-4 text-xs text-fg-muted">
        <span>
          MIT licensed. Built with Next.js and{' '}
          <a
            href="https://github.com/R1chi33333/nz-bank-parser"
            className="underline decoration-border underline-offset-2 transition-colors hover:text-fg"
          >
            nz-bank-parser
          </a>
          .
        </span>
        <span className="font-mono">All demo data is synthetic</span>
      </footer>
    </div>
  );
}
