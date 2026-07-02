import { Split } from 'lucide-react';

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

      <main className="flex flex-1 flex-col items-center justify-center gap-6 py-16 text-center">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight">
          Fair expenses for New Zealand flats
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-fg-muted">
          Rent, power, broadband and shared groceries, split the way your flat actually works.
          Import your bank CSV, settle up with the fewest transfers. Under construction.
        </p>
      </main>

      <footer className="border-t border-border py-4 text-xs text-fg-muted">
        MIT licensed. Built with Next.js and nz-bank-parser.
      </footer>
    </div>
  );
}
