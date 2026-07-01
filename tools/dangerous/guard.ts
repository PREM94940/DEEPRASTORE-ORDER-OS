import * as readline from 'readline/promises';
import { validateDatabaseEnvironment } from '@deeprastore/infrastructure/src/db/protection';
import { db } from '@deeprastore/infrastructure/src/db/client';

export async function runDangerousGuard(scriptName: string) {
  console.log(`\n======================================================`);
  console.log(`⚠️  DANGEROUS OPERATION: ${scriptName} ⚠️`);
  console.log(`======================================================\n`);

  // 1. APP_ENV must be development
  if (process.env.APP_ENV !== 'development') {
    throw new Error('Guard Failed: APP_ENV is not development.');
  }

  // 2. ALLOW_DANGEROUS_OPERATIONS must be true
  if (process.env.ALLOW_DANGEROUS_OPERATIONS !== 'true') {
    throw new Error('Guard Failed: ALLOW_DANGEROUS_OPERATIONS is not true.');
  }

  // 3. Dry run mode logic is enforced by the caller (they should implement dry run first)
  if (process.argv.includes('--no-dry-run') === false) {
    console.log('DRY RUN MODE. Pass --no-dry-run to actually execute.');
  }

  // 4 & 5. Repo & DB fingerprint are checked by the standard validateDatabaseEnvironment
  // which will throw if connected to Production from this non-production context.
  validateDatabaseEnvironment(process.env.DATABASE_URL || '');

  // 6 & 7. Interactive Confirmations
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer1 = await rl.question('Type "DELETE DEEPRASTORE PRODUCTION" to proceed: ');
  if (answer1 !== 'DELETE DEEPRASTORE PRODUCTION') {
    rl.close();
    throw new Error('Guard Failed: Incorrect confirmation token.');
  }

  const answer2 = await rl.question('Are you absolutely sure? (yes/no): ');
  if (answer2 !== 'yes') {
    rl.close();
    throw new Error('Guard Failed: Aborted by user.');
  }

  rl.close();
  console.log('\n✅ Guard Passed. Executing dangerous script...\n');
  return db;
}
