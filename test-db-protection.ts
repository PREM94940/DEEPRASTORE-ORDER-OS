// test-db-protection.ts
async function run() {
  const dotenv = await import('dotenv');
  dotenv.config({ path: './apps/web/.env' });

  // Simulate local dev environment
  process.env.APP_ENV = 'development';
  process.env.NODE_ENV = 'development';

  console.log('Loaded DATABASE_URL:', process.env.DATABASE_URL);

  const { db } = await import('./packages/infrastructure/src/db/client');
  console.log('If you see this, the protection FAILED.');
}
run().catch(e => {
  console.error('Caught error during DB initialization:', e);
});
