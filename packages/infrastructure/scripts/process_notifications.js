require('dotenv').config({ path: '../../apps/web/.env' });
const { Client } = require('pg');

async function processNotifications() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  try {
    console.log('Fetching pending notifications...');
    const result = await client.query(`
      SELECT * FROM notification_queue 
      WHERE status = 'PENDING' OR (status = 'FAILED' AND error_details LIKE '%retry%')
      LIMIT 10
    `);

    const pending = result.rows;
    console.log(`Found ${pending.length} notifications to process.`);

    for (const msg of pending) {
      try {
        console.log(`[Queue Worker] Sending ${msg.channel} to ${msg.recipient}: ${msg.message_body}`);
        
        // Simulate a failure for specific test cases
        if (msg.recipient === 'FAIL_RETRY') {
          throw new Error('Simulated network error (retry later)');
        }
        
        await client.query(`
          UPDATE notification_queue 
          SET status = 'SENT', sent_at = NOW() 
          WHERE id = $1
        `, [msg.id]);
        console.log(`[Queue Worker] -> Successfully sent msg ${msg.id}`);
        
      } catch (err) {
        console.error(`[Queue Worker] -> Failed msg ${msg.id}: ${err.message}`);
        await client.query(`
          UPDATE notification_queue 
          SET status = 'FAILED', error_details = $2 
          WHERE id = $1
        `, [msg.id, err.message]);
      }
    }
  } catch (e) {
    console.error('Error processing queue:', e);
  } finally {
    await client.end();
  }
}

processNotifications();
