'use client';

import { useActionState, useState } from 'react';
import { Plus } from 'lucide-react';
import { addExpense, type ExpenseActionState } from './actions';

interface Member {
  id: string;
  displayName: string;
}

const CATEGORIES = [
  { value: 'rent', label: 'Rent' },
  { value: 'power', label: 'Power' },
  { value: 'internet', label: 'Internet' },
  { value: 'groceries', label: 'Groceries' },
  { value: 'household', label: 'Household' },
  { value: 'other', label: 'Other' },
];

const METHODS = [
  { value: 'equal', label: 'Split evenly' },
  { value: 'ratio', label: 'By ratio' },
  { value: 'fixed', label: 'Fixed amounts' },
];

const inputClass =
  'rounded-md border border-border bg-surface-0 px-3 py-2 text-sm focus:border-accent focus:outline-none';

export function ExpenseForm({ members, defaultDate }: { members: Member[]; defaultDate: string }) {
  const [state, action, pending] = useActionState<ExpenseActionState, FormData>(addExpense, {});
  const [method, setMethod] = useState('equal');
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
        className="flex items-center gap-2 self-start rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        <Plus className="size-4" strokeWidth={2} />
        Add expense
      </button>
    );
  }

  return (
    <form
      action={action}
      className="flex flex-col gap-4 rounded-lg border border-border bg-surface-1 p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-xs text-fg-muted">
            Description
          </label>
          <input
            id="description"
            name="description"
            required
            maxLength={100}
            placeholder="Power bill June"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="amount" className="text-xs text-fg-muted">
            Amount (NZD)
          </label>
          <input
            id="amount"
            name="amount"
            required
            inputMode="decimal"
            placeholder="142.19"
            className={`${inputClass} font-mono`}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="incurredOn" className="text-xs text-fg-muted">
            Date
          </label>
          <input
            id="incurredOn"
            name="incurredOn"
            type="date"
            required
            defaultValue={defaultDate}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="category" className="text-xs text-fg-muted">
            Category
          </label>
          <select id="category" name="category" className={inputClass} defaultValue="other">
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="paidBy" className="text-xs text-fg-muted">
            Paid by
          </label>
          <select id="paidBy" name="paidBy" className={inputClass}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.displayName}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="splitMethod" className="text-xs text-fg-muted">
            Split
          </label>
          <select
            id="splitMethod"
            name="splitMethod"
            value={method}
            onChange={(e) => {
              setMethod(e.target.value);
            }}
            className={inputClass}
          >
            {METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="rounded-md border border-border p-4">
        <legend className="px-1 text-xs text-fg-muted">
          {method === 'equal' && 'Who shares this expense?'}
          {method === 'ratio' && 'Ratio weights (e.g. room sizes)'}
          {method === 'fixed' && 'Exact amount per person (must add to the total)'}
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3">
              <span className="text-sm">{m.displayName}</span>
              {method === 'equal' && (
                <input
                  type="checkbox"
                  name={`include-${m.id}`}
                  defaultChecked
                  className="size-4 accent-[#6366f1]"
                  aria-label={`Include ${m.displayName}`}
                />
              )}
              {method === 'ratio' && (
                <input
                  name={`weight-${m.id}`}
                  inputMode="decimal"
                  defaultValue="1"
                  className={`${inputClass} w-20 text-right font-mono`}
                  aria-label={`Weight for ${m.displayName}`}
                />
              )}
              {method === 'fixed' && (
                <input
                  name={`fixed-${m.id}`}
                  inputMode="decimal"
                  placeholder="0.00"
                  className={`${inputClass} w-24 text-right font-mono`}
                  aria-label={`Amount for ${m.displayName}`}
                />
              )}
            </div>
          ))}
        </div>
      </fieldset>

      {state.error && <p className="text-xs text-red-400">{state.error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? 'Saving...' : 'Save expense'}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
          }}
          className="rounded-md border border-border px-4 py-2 text-sm text-fg-muted transition-colors hover:text-fg"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
