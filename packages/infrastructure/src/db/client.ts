import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { validateDatabaseEnvironment } from './protection';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres';

// Strictly validate the environment BEFORE attempting a connection
validateDatabaseEnvironment(connectionString);

// Disable prefetch as it is not supported for "Transaction" pool mode
export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client);
