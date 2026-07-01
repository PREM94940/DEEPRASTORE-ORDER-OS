const { Client } = require('pg');
require('dotenv').config({ path: './apps/web/.env' });

async function verifyLiveTest() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error("No DATABASE_URL found.");
        process.exit(1);
    }
    
    const client = new Client({ connectionString: dbUrl });
    await client.connect();

    console.log("--- DB VERIFICATION START ---");
    
    const res = await client.query(`
        SELECT id, customer_name, status, created_at FROM enquiries 
        ORDER BY "created_at" DESC LIMIT 10
    `);

    console.log("Latest 10 Enquiries:");
    res.rows.forEach(r => console.log(r));

    console.log("--- DB VERIFICATION END ---");
    await client.end();
}

verifyLiveTest().catch(console.error);
