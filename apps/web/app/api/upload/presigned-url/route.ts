import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const { phone, filenames } = await req.json();

    if (!phone || !filenames || !Array.isArray(filenames) || filenames.length === 0) {
      return NextResponse.json({ error: 'Phone and array of filenames are required' }, { status: 400 });
    }

    if (filenames.length > 20) {
      return NextResponse.json({ error: 'Maximum 20 files allowed' }, { status: 400 });
    }

    // Use Service Role Key to bypass RLS for generating upload URLs
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const bucket = 'order-attachments';
    
    // Create a unique folder for this batch to prevent collisions
    const batchId = uuidv4();
    const folderPath = `enquiries/${phone}/${batchId}`;

    const urls = [];

    for (const filename of filenames) {
      // Clean filename
      const safeFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '');
      const filePath = `${folderPath}/${safeFilename}`;

      const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(filePath);

      if (error) {
        console.error('Error generating signed URL:', error);
        return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
      }

      urls.push({
        filename,
        signedUrl: data.signedUrl,
        // The public URL that will be stored in the database once uploaded
        publicUrl: `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`
      });
    }

    return NextResponse.json({ urls });
  } catch (error) {
    console.error('Error in presigned-url route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
