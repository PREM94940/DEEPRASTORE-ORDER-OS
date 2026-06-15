import { Client } from 'pg';

async function run() {
  const client = new Client({
    connectionString: "postgresql://postgres.nctwwfpqdlyqddjdhkrk:Prem%409494026218@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres"
  });

  try {
    await client.connect();
    console.log('Connected to Supabase');
    
    // Create the bucket if it doesn't exist
    const createBucketSql = `
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('order-attachments', 'order-attachments', true)
      ON CONFLICT (id) DO NOTHING;
    `;
    await client.query(createBucketSql);
    console.log('Created bucket: order-attachments');
    
    // Create RLS policies for unauthenticated uploads using presigned URLs
    // Note: If we use Supabase Service Role Key to generate presigned URLs,
    // the upload bypasses RLS. But just to be safe, we'll allow public reads, 
    // and let the service role handle writes.
    const createPolicySql = `
      CREATE POLICY "Public Access" ON storage.objects
      FOR SELECT
      USING (bucket_id = 'order-attachments');
    `;
    try {
      await client.query(createPolicySql);
      console.log('Created RLS policy: Public Access');
    } catch (e: any) {
      if (e.message && e.message.includes('already exists')) {
        console.log('RLS policy already exists');
      } else {
        throw e;
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
