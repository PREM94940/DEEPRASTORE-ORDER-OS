class ProductionProtectionError extends Error {
  constructor(message: string) {
    super(`[PRODUCTION PROTECTION ERROR] ${message}`);
    this.name = 'ProductionProtectionError';
  }
}

export function validateDatabaseEnvironment(connectionString: string) {
  const isProductionDB = connectionString.includes('nctwwfpqdlyqddjdhkrk');
  
  const appEnv = process.env.APP_ENV;
  const vercelEnv = process.env.VERCEL_ENV;
  const nodeEnv = process.env.NODE_ENV;

  if (isProductionDB) {
    // If it's the production DB, we MUST be in a production environment
    if (appEnv !== 'production' && vercelEnv !== 'production' && nodeEnv !== 'production') {
      console.error('\n======================================================');
      console.error('🚫 CRITICAL SAFETY VIOLATION DETECTED 🚫');
      console.error('======================================================');
      console.error('You are attempting to connect to the LIVE PRODUCTION DATABASE');
      console.error('from a non-production environment (e.g., local development or tests).');
      console.error(`APP_ENV: ${appEnv}`);
      console.error(`VERCEL_ENV: ${vercelEnv}`);
      console.error(`NODE_ENV: ${nodeEnv}`);
      console.error('======================================================\n');
      
      throw new ProductionProtectionError(
        'Connection to production database blocked. Environment mismatch.'
      );
    }
  } else {
    // If it's NOT the production DB, but the environment claims to be production, that's also bad.
    if (appEnv === 'production' || vercelEnv === 'production') {
      console.warn('⚠️ WARNING: Running in production environment but not connected to production database.');
    }
  }
}
