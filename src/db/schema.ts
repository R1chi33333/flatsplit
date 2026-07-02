import {
  date,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * All money columns are integer cents. See CONTRIBUTING.md: no
 * floating-point currency anywhere in the schema or the app.
 */

export const expenseCategory = pgEnum('expense_category', [
  'rent',
  'power',
  'internet',
  'groceries',
  'household',
  'other',
]);

export const splitMethod = pgEnum('split_method', ['equal', 'ratio', 'fixed']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  /** Nullable: magic-link users have no name until they set one. */
  name: text('name'),
  emailVerified: timestamp('email_verified', { withTimezone: true }),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Auth.js adapter tables. Sessions stay JWT so the sessions table is
 * unused at runtime, but the adapter contract expects all four.
 */
export const accounts = pgTable(
  'accounts',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (table) => [primaryKey({ columns: [table.provider, table.providerAccountId] })],
);

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })],
);

export const flats = pgTable('flats', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  /** Short human-typable code flatmates use to join. */
  inviteCode: text('invite_code').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const flatMembers = pgTable(
  'flat_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    flatId: uuid('flat_id')
      .notNull()
      .references(() => flats.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** Name shown inside the flat, defaults to the user's name. */
    displayName: text('display_name').notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('flat_members_flat_user_unique').on(table.flatId, table.userId)],
);

export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  flatId: uuid('flat_id')
    .notNull()
    .references(() => flats.id, { onDelete: 'cascade' }),
  paidByMemberId: uuid('paid_by_member_id')
    .notNull()
    .references(() => flatMembers.id, { onDelete: 'restrict' }),
  description: text('description').notNull(),
  category: expenseCategory('category').notNull().default('other'),
  splitMethod: splitMethod('split_method').notNull().default('equal'),
  /** Total in integer cents. Always equals the sum of its shares. */
  amountCents: integer('amount_cents').notNull(),
  /** Calendar date the cost was incurred, not when it was recorded. */
  incurredOn: date('incurred_on').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const expenseShares = pgTable(
  'expense_shares',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    expenseId: uuid('expense_id')
      .notNull()
      .references(() => expenses.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => flatMembers.id, { onDelete: 'restrict' }),
    /** This member's portion in integer cents. */
    cents: integer('cents').notNull(),
  },
  (table) => [
    uniqueIndex('expense_shares_expense_member_unique').on(table.expenseId, table.memberId),
  ],
);
