import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const sql = postgres(process.env.DATABASE_URL!);

async function seedUser(email: string, name: string, role: string, pass: string) {
  console.log(`\nCreating ${role} user: ${email}...`);
  
  // 1. Create Supabase Auth User
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: pass,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
        console.log(`Auth user ${email} already exists.`);
    } else {
        console.error(`Error creating auth user: ${authError.message}`);
        return;
    }
  } else {
    console.log(`Successfully created auth user: ${authData.user.id}`);
  }

  // 2. Insert into approved_staff
  try {
    await sql`
      INSERT INTO approved_staff (email, name, role, is_active)
      VALUES (${email}, ${name}, ${role}, true)
      ON CONFLICT (email) DO UPDATE SET role = ${role}, name = ${name}, is_active = true
    `;
    console.log(`Successfully inserted into approved_staff.`);
  } catch (dbError: any) {
    console.error(`Error inserting into approved_staff: ${dbError.message}`);
  }
}

async function run() {
  await seedUser('admin@deeprastore.com', 'Deeprastore Admin', 'ADMIN', 'deeprastore2026');
  await seedUser('pilot@deeprastore.com', 'Pilot Operations', 'OPERATIONS', 'pilot2026');
  
  console.log('\nSeed complete. Verifying approved_staff table:');
  const staff = await sql`SELECT * FROM approved_staff`;
  console.log(staff);
  
  await sql.end();
}

run();
