require('dotenv').config({ path: '../../apps/web/.env' });
const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  console.log('Connecting to database...');
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS exceptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id VARCHAR(50) NOT NULL UNIQUE,
        order_id UUID NOT NULL,
        type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
        status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
        description TEXT NOT NULL,
        raised_by_staff_id UUID,
        resolved_by_staff_id UUID,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        resolved_at TIMESTAMP
      );
    `);
    console.log('exceptions table created');

    await client.query(`
      CREATE TABLE IF NOT EXISTS notification_queue (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        channel VARCHAR(20) NOT NULL,
        recipient VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20),
        message_template_id VARCHAR(100),
        message_body TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        error_details TEXT,
        scheduled_for TIMESTAMP NOT NULL DEFAULT NOW(),
        sent_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('notification_queue table created');

    console.log('All tables created successfully.');
  } catch (e) {
    console.error('Error creating tables:', e);
  } finally {
    await client.end();
  }
}

main();
