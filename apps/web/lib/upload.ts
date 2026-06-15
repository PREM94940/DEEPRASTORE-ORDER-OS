export interface UploadResult {
  filename: string;
  publicUrl: string;
}

export async function uploadFilesToSupabase(phone: string, files: File[]): Promise<UploadResult[]> {
  if (!files || files.length === 0) return [];

  // Step 1: Get presigned URLs
  const filenames = files.map(f => f.name);
  const response = await fetch('/api/upload/presigned-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, filenames }),
  });

  if (!response.ok) {
    throw new Error('Failed to get upload URLs');
  }

  const { urls } = await response.json();

  const results: UploadResult[] = [];

  // Step 2: Upload directly to Supabase using signed URLs
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const urlData = urls[i];

    // Supabase signed upload requires a PUT request
    const uploadRes = await fetch(urlData.signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error(`Failed to upload ${file.name}`);
    }

    results.push({
      filename: file.name,
      publicUrl: urlData.publicUrl,
    });
  }

  return results;
}
