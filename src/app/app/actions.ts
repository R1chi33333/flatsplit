'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getDb } from '@/db';
import { flatMembers, flats, users } from '@/db/schema';
import { generateInviteCode, isValidInviteCode, normaliseInviteCode } from '@/lib/invite';

async function requireUser(): Promise<{ id: string; name: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  const db = getDb();
  const user = await db.query.users.findFirst({ where: eq(users.id, session.user.id) });
  if (!user) {
    redirect('/login');
  }
  // Magic-link users have no name yet; fall back to the email handle.
  return { id: user.id, name: user.name ?? user.email.split('@')[0] ?? 'Flatmate' };
}

export interface ActionState {
  error?: string;
}

export async function createFlat(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const name = String(formData.get('name') ?? '').trim();
  if (name.length < 2 || name.length > 60) {
    return { error: 'Flat name must be between 2 and 60 characters.' };
  }

  const db = getDb();
  const inserted = await db
    .insert(flats)
    .values({ name, inviteCode: generateInviteCode() })
    .returning();
  const flat = inserted[0];
  if (!flat) {
    return { error: 'Could not create the flat. Try again.' };
  }
  await db.insert(flatMembers).values({ flatId: flat.id, userId: user.id, displayName: user.name });

  revalidatePath('/app');
  redirect('/app');
}

export async function joinFlat(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const raw = String(formData.get('code') ?? '');
  if (!isValidInviteCode(raw)) {
    return { error: 'That does not look like a valid invite code.' };
  }
  const code = normaliseInviteCode(raw);

  const db = getDb();
  const flat = await db.query.flats.findFirst({ where: eq(flats.inviteCode, code) });
  if (!flat) {
    return { error: 'No flat found for that code. Check it with your flatmate.' };
  }

  await db
    .insert(flatMembers)
    .values({ flatId: flat.id, userId: user.id, displayName: user.name })
    .onConflictDoNothing();

  revalidatePath('/app');
  redirect('/app');
}
