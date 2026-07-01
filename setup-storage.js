require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createBucket() {
  const { data, error } = await supabase.storage.createBucket('order-attachments', {
    public: true,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'],
    fileSizeLimit: 5242880
  });
  
  if (error) {
    console.error('Failed to create bucket:', error);
  } else {
    console.log('Bucket created:', data);
  }
}

createBucket();
