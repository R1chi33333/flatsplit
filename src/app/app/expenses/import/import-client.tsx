'use client';

import { useMemo, useState, useTransition, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, FileUp, Landmark, ShieldCheck } from 'lucide-react';
import { parse, UnrecognisedFormatError, type ParseResult } from 'nz-bank-parser';
import { formatCents } from '@/lib/money';
import { importExpenses, type ImportItem } from './actions';

interface Member {
  id: string;
  displayName: string;
}

const BANK_LABELS: Record<string, string> = {
  anz: 'ANZ',
  asb: 'ASB',
  westpac: 'Westpac',
  kiwibank: 'Kiwibank',
};

type ParseState =
  { status: 'empty' } | { status: 'unrecognised' } | { status: 'parsed'; result: ParseResult };

function parseCsv(csv: string): ParseState {
  if (csv.trim() === '') {
    return { status: 'empty' };
  }
  try {
    return { status: 'parsed', result: parse(csv) };
  } catch (error) {
    if (error instanceof UnrecognisedFormatError) {
      return { status: 'unrecognised' };
    }
    throw error;
  }
}

export function ImportClient({
  members,
  selfMemberId,
}: {
  members: Member[];
  selfMemberId: string;
}) {
  const router = useRouter();
  const [csv, setCsv] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [paidBy, setPaidBy] = useState(selfMemberId);
  const [error, setError] = useState<string | undefined>();
  const [done, setDone] = useState<number | undefined>();
  const [pending, startTransition] = useTransition();

  const state = useMemo(() => parseCsv(csv), [csv]);

  // Outgoing transactions are the shareable ones; preselect them.
  const debits = useMemo(
    () =>
      state.status === 'parsed'
        ? state.result.transactions
            .map((tx, index) => ({ tx, index }))
            .filter(({ tx }) => tx.direction === 'debit')
        : [],
    [state],
  );

  function loadCsv(text: string): void {
    setCsv(text);
    setDone(undefined);
    setError(undefined);
    const parsed = parseCsv(text);
    if (parsed.status === 'parsed') {
      setSelected(
        new Set(
          parsed.result.transactions
            .map((tx, index) => ({ tx, index }))
            .filter(({ tx }) => tx.direction === 'debit')
            .map(({ index }) => index),
        ),
      );
    } else {
      setSelected(new Set());
    }
  }

  function onFilePicked(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    void file.text().then(loadCsv);
  }

  function toggle(index: number): void {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function submit(): void {
    if (state.status !== 'parsed') {
      return;
    }
    const items: ImportItem[] = [...selected]
      .sort((a, b) => a - b)
      .map((index) => state.result.transactions[index])
      .filter((tx) => tx !== undefined)
      .map((tx) => ({
        description: tx.description,
        amountCents: tx.amount,
        incurredOn: tx.date,
      }));
    startTransition(async () => {
      const result = await importExpenses(paidBy, items);
      if (result.error) {
        setError(result.error);
        return;
      }
      setDone(result.imported ?? 0);
      setError(undefined);
      router.refresh();
    });
  }

  if (done !== undefined) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface-1 p-10 text-center">
        <CheckCircle2 className="size-5 text-accent" strokeWidth={1.5} />
        <p className="text-sm">
          {done} expense{done === 1 ? '' : 's'} imported and split evenly.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setCsv('');
              setDone(undefined);
            }}
            className="rounded-md border border-border px-4 py-2 text-sm text-fg-muted transition-colors hover:text-fg"
          >
            Import another file
          </button>
          <a
            href="/app/expenses"
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            View expenses
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 text-xs text-fg-muted">
        <ShieldCheck className="size-4 shrink-0 text-accent" strokeWidth={1.5} />
        Your statement is parsed in your browser. Only the rows you choose are uploaded.
      </div>

      <label
        htmlFor="csv-file"
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface-1 px-6 py-8 text-center transition-colors hover:bg-surface-2"
      >
        <FileUp className="size-5 text-fg-muted" strokeWidth={1.5} />
        <span className="text-sm">Choose a CSV export from your bank</span>
        <span className="text-xs text-fg-muted">ANZ, ASB, Westpac or Kiwibank</span>
        <input
          id="csv-file"
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={onFilePicked}
        />
      </label>

      <textarea
        value={csv}
        onChange={(e) => {
          loadCsv(e.target.value);
        }}
        placeholder="Or paste CSV content here"
        spellCheck={false}
        rows={5}
        className="w-full resize-y rounded-md border border-border bg-surface-1 p-3 font-mono text-xs leading-relaxed placeholder:text-fg-muted focus:border-accent focus:outline-none"
        aria-label="CSV content"
      />

      {state.status === 'unrecognised' && (
        <p className="text-sm text-fg-muted">
          That does not look like a known bank export. Check the file is an unmodified CSV from
          internet banking.
        </p>
      )}

      {state.status === 'parsed' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Landmark className="size-4 text-accent" strokeWidth={1.5} />
              <span className="font-medium">{BANK_LABELS[state.result.bank]}</span>
              <span className="text-xs text-fg-muted">
                {state.result.transactions.length} transactions, {debits.length} outgoing
              </span>
            </div>
            <label className="flex items-center gap-2 text-sm text-fg-muted">
              Paid by
              <select
                value={paidBy}
                onChange={(e) => {
                  setPaidBy(e.target.value);
                }}
                className="rounded-md border border-border bg-surface-0 px-2 py-1.5 text-sm text-fg focus:border-accent focus:outline-none"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="max-h-96 overflow-auto rounded-md border border-border">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-surface-1">
                <tr className="border-b border-border text-xs text-fg-muted">
                  <th className="px-3 py-2 font-medium">Share</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Description</th>
                  <th className="px-3 py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {state.result.transactions.map((tx, index) => (
                  <tr
                    key={index}
                    className={tx.direction === 'credit' ? 'opacity-50' : 'hover:bg-surface-1'}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(index)}
                        disabled={tx.direction === 'credit'}
                        onChange={() => {
                          toggle(index);
                        }}
                        className="size-4 accent-[#6366f1]"
                        aria-label={`Include ${tx.description}`}
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-fg-muted">
                      {tx.date}
                    </td>
                    <td className="max-w-64 truncate px-3 py-2" title={tx.description}>
                      {tx.description}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-xs">
                      {tx.direction === 'debit' ? '-' : '+'}
                      {formatCents(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {state.result.errors.length > 0 && (
            <p className="text-xs text-fg-muted">
              {state.result.errors.length} row{state.result.errors.length === 1 ? '' : 's'} could
              not be parsed and {state.result.errors.length === 1 ? 'was' : 'were'} skipped.
            </p>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="button"
            onClick={submit}
            disabled={pending || selected.size === 0}
            className="self-start rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {pending
              ? 'Importing...'
              : `Add ${String(selected.size)} expense${selected.size === 1 ? '' : 's'} split evenly`}
          </button>
        </div>
      )}
    </div>
  );
}
