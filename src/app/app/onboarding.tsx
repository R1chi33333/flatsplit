'use client';

import { useActionState } from 'react';
import { createFlat, joinFlat, type ActionState } from './actions';

const INITIAL: ActionState = {};

function FieldError({ error }: { error?: string }) {
  if (!error) {
    return null;
  }
  return <p className="mt-2 text-xs text-red-400">{error}</p>;
}

export function Onboarding() {
  const [createState, createAction, creating] = useActionState(createFlat, INITIAL);
  const [joinState, joinAction, joining] = useActionState(joinFlat, INITIAL);

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-6 sm:grid-cols-2">
      <section className="rounded-lg border border-border bg-surface-1 p-6">
        <h2 className="text-base font-semibold">Start a flat</h2>
        <p className="mt-1 text-sm leading-relaxed text-fg-muted">
          Set it up, then share the invite code with your flatmates.
        </p>
        <form action={createAction} className="mt-4 flex flex-col gap-3">
          <label className="text-xs text-fg-muted" htmlFor="flat-name">
            Flat name
          </label>
          <input
            id="flat-name"
            name="name"
            placeholder="12 Kelburn Parade"
            required
            minLength={2}
            maxLength={60}
            className="rounded-md border border-border bg-surface-0 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {creating ? 'Creating...' : 'Create flat'}
          </button>
          <FieldError error={createState.error} />
        </form>
      </section>

      <section className="rounded-lg border border-border bg-surface-1 p-6">
        <h2 className="text-base font-semibold">Join a flat</h2>
        <p className="mt-1 text-sm leading-relaxed text-fg-muted">
          Got a code from a flatmate? Enter it here.
        </p>
        <form action={joinAction} className="mt-4 flex flex-col gap-3">
          <label className="text-xs text-fg-muted" htmlFor="invite-code">
            Invite code
          </label>
          <input
            id="invite-code"
            name="code"
            placeholder="XV7K2M"
            required
            className="rounded-md border border-border bg-surface-0 px-3 py-2 font-mono text-sm uppercase focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={joining}
            className="rounded-md border border-border bg-surface-2 px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-0 disabled:opacity-60"
          >
            {joining ? 'Joining...' : 'Join flat'}
          </button>
          <FieldError error={joinState.error} />
        </form>
      </section>
    </div>
  );
}
