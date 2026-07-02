import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Resend from 'next-auth/providers/resend';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { accounts, sessions, users, verificationTokens } from '@/db/schema';

export const DEMO_EMAIL = 'demo@flatsplit.example';
const DEMO_NAME = 'Demo Flatmate';

/**
 * Find or create the shared demo user. The demo account is the
 * first-priority product feature: reviewers must reach a populated
 * dashboard in one click, no signup.
 */
async function ensureDemoUser(): Promise<{ id: string; email: string; name: string }> {
  const db = getDb();
  const existing = await db.query.users.findFirst({ where: eq(users.email, DEMO_EMAIL) });
  if (existing) {
    return { id: existing.id, email: existing.email, name: existing.name ?? DEMO_NAME };
  }
  const inserted = await db
    .insert(users)
    .values({ email: DEMO_EMAIL, name: DEMO_NAME })
    .onConflictDoUpdate({ target: users.email, set: { name: DEMO_NAME } })
    .returning();
  const user = inserted[0];
  if (!user) {
    throw new Error('Failed to provision the demo user');
  }
  return { id: user.id, email: user.email, name: user.name ?? DEMO_NAME };
}

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const db = getDb();
  return {
    adapter: DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    }),
    session: { strategy: 'jwt' },
    providers: [
      Credentials({
        id: 'demo',
        name: 'Demo account',
        credentials: {},
        authorize: async () => ensureDemoUser(),
      }),
      Resend({
        from: 'FlatSplit <onboarding@resend.dev>',
      }),
    ],
    pages: {
      signIn: '/login',
      verifyRequest: '/login/verify',
    },
    callbacks: {
      jwt({ token, user }) {
        if (user?.id) {
          token.userId = user.id;
        }
        return token;
      },
      session({ session, token }) {
        if (typeof token.userId === 'string') {
          session.user.id = token.userId;
        }
        return session;
      },
    },
  };
});
