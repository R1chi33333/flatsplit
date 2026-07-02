'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/app', label: 'Overview' },
  { href: '/app/expenses', label: 'Expenses' },
  { href: '/app/settle', label: 'Settle up' },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition-colors ${
              active
                ? 'border-accent font-medium text-fg'
                : 'border-transparent text-fg-muted hover:text-fg'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
