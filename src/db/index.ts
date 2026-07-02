import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.');
  }
  return drizzle(neon(url), { schema });
}

export type Database = ReturnType<typeof createDb>;

let instance: Database | undefined;

/**
 * Lazily initialised database client. Resolving the connection at
 * first query rather than import keeps DATABASE_URL out of build-time
 * page-data collection, where no database is available.
 */
export function getDb(): Database {
  instance ??= createDb();
  return instance;
}
