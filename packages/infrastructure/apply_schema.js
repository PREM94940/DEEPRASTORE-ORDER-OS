require('dotenv').config({path: '../../.env'});
const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS bug_registry (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id VARCHAR(50) NOT NULL UNIQUE,
        date TIMESTAMP NOT NULL DEFAULT NOW(),
        reported_by VARCHAR(255) NOT NULL,
        source VARCHAR(50) NOT NULL,
        severity VARCHAR(10) NOT NULL,
        module VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
        fixed_date TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS exceptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id),
        type VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
        description TEXT NOT NULL,
        raised_by_staff_id VARCHAR(255) REFERENCES approved_staff(email),
        resolved_by_staff_id VARCHAR(255) REFERENCES approved_staff(email),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Schema created successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}
run();
