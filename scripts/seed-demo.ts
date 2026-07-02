/**
 * Seed (or reset) the demo flat: four flatmates and three months of
 * realistic Wellington flat expenses, dated relative to today so the
 * demo always looks current. Idempotent: wipes the demo flat first.
 *
 * Run with: npm run db:seed
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, inArray } from 'drizzle-orm';
import * as schema from '../src/db/schema.ts';
import { splitEvenly } from '../src/lib/money.ts';
import { splitByRatio } from '../src/lib/split.ts';

const DEMO_EMAIL = 'demo@flatsplit.example';
const FLAT_NAME = '18 Aro Valley Road';
const INVITE_CODE = 'KEA242';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is not set');
}
const db = drizzle(neon(url), { schema });

const FLATMATES = [
  { email: DEMO_EMAIL, name: 'Demo Flatmate' },
  { email: 'demo-aroha@flatsplit.example', name: 'Aroha' },
  { email: 'demo-ben@flatsplit.example', name: 'Ben' },
  { email: 'demo-mia@flatsplit.example', name: 'Mia' },
];

/** Room-size weights used for rent: demo user has the big room. */
const RENT_WEIGHTS = [30, 25, 25, 20];

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

type Category = (typeof schema.expenseCategory.enumValues)[number];

interface SeedExpense {
  daysAgo: number;
  description: string;
  category: Category;
  amountCents: number;
  payerIndex: number;
  split: 'equal' | 'rent-ratio';
}

function monthlyPattern(offsetDays: number): SeedExpense[] {
  const monthLabel = new Date(`${isoDaysAgo(offsetDays + 27)}T00:00:00`).toLocaleDateString(
    'en-NZ',
    { month: 'long' },
  );
  return [
    {
      daysAgo: offsetDays + 27,
      description: `Rent ${monthLabel}`,
      category: 'rent',
      amountCents: 312000,
      payerIndex: 0,
      split: 'rent-ratio',
    },
    {
      daysAgo: offsetDays + 24,
      description: `Power bill ${monthLabel}`,
      category: 'power',
      amountCents: 14219 + offsetDays * 37,
      payerIndex: 1,
      split: 'equal',
    },
    {
      daysAgo: offsetDays + 22,
      description: 'Fibre broadband',
      category: 'internet',
      amountCents: 8999,
      payerIndex: 2,
      split: 'equal',
    },
    {
      daysAgo: offsetDays + 19,
      description: 'New World shop',
      category: 'groceries',
      amountCents: 18743 + offsetDays * 53,
      payerIndex: 3,
      split: 'equal',
    },
    {
      daysAgo: offsetDays + 12,
      description: 'Pak n Save shop',
      category: 'groceries',
      amountCents: 15210 + offsetDays * 41,
      payerIndex: 0,
      split: 'equal',
    },
    {
      daysAgo: offsetDays + 8,
      description: 'Cleaning supplies',
      category: 'household',
      amountCents: 4380,
      payerIndex: 1,
      split: 'equal',
    },
    {
      daysAgo: offsetDays + 3,
      description: 'Gas bottle refill',
      category: 'household',
      amountCents: 5499,
      payerIndex: 2,
      split: 'equal',
    },
  ];
}

async function main(): Promise<void> {
  // Upsert the four users.
  const userIds: string[] = [];
  for (const flatmate of FLATMATES) {
    const upserted = await db
      .insert(schema.users)
      .values(flatmate)
      .onConflictDoUpdate({ target: schema.users.email, set: { name: flatmate.name } })
      .returning({ id: schema.users.id });
    const id = upserted[0]?.id;
    if (!id) {
      throw new Error(`Failed to upsert ${flatmate.email}`);
    }
    userIds.push(id);
  }

  // Wipe any previous demo flat (cascades to members, expenses, shares).
  const memberships = await db
    .select({ flatId: schema.flatMembers.flatId })
    .from(schema.flatMembers)
    .where(inArray(schema.flatMembers.userId, userIds));
  const flatIds = [...new Set(memberships.map((m) => m.flatId))];
  if (flatIds.length > 0) {
    await db.delete(schema.flats).where(inArray(schema.flats.id, flatIds));
  }
  await db.delete(schema.flats).where(eq(schema.flats.inviteCode, INVITE_CODE));

  // Fresh flat and memberships.
  const flatRows = await db
    .insert(schema.flats)
    .values({ name: FLAT_NAME, inviteCode: INVITE_CODE })
    .returning({ id: schema.flats.id });
  const flatId = flatRows[0]?.id;
  if (!flatId) {
    throw new Error('Failed to create the demo flat');
  }

  const memberIds: string[] = [];
  for (let i = 0; i < FLATMATES.length; i++) {
    const inserted = await db
      .insert(schema.flatMembers)
      .values({ flatId, userId: userIds[i] ?? '', displayName: FLATMATES[i]?.name ?? '' })
      .returning({ id: schema.flatMembers.id });
    const id = inserted[0]?.id;
    if (!id) {
      throw new Error('Failed to create membership');
    }
    memberIds.push(id);
  }

  // Three months of expenses.
  const seedExpenses = [...monthlyPattern(0), ...monthlyPattern(30), ...monthlyPattern(60)];

  for (const item of seedExpenses) {
    const inserted = await db
      .insert(schema.expenses)
      .values({
        flatId,
        paidByMemberId: memberIds[item.payerIndex] ?? '',
        description: item.description,
        category: item.category,
        splitMethod: item.split === 'rent-ratio' ? 'ratio' : 'equal',
        amountCents: item.amountCents,
        incurredOn: isoDaysAgo(item.daysAgo),
      })
      .returning({ id: schema.expenses.id });
    const expenseId = inserted[0]?.id;
    if (!expenseId) {
      throw new Error(`Failed to insert ${item.description}`);
    }

    const parts =
      item.split === 'rent-ratio'
        ? splitByRatio(item.amountCents, RENT_WEIGHTS)
        : splitEvenly(item.amountCents, memberIds.length);
    await db.insert(schema.expenseShares).values(
      memberIds.map((memberId, i) => ({
        expenseId,
        memberId,
        cents: parts[i] ?? 0,
      })),
    );
  }

  console.log(
    `Seeded demo flat "${FLAT_NAME}" with ${String(FLATMATES.length)} members and ${String(seedExpenses.length)} expenses.`,
  );
}

await main();
