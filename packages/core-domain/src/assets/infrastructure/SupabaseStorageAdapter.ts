// @ts-nocheck
import { StorageAdapter } from '../domain/StorageAdapter';
// Use standard fetch to interact with Supabase storage API or any supabase client available

export class SupabaseStorageAdapter implements StorageAdapter {
  private supabaseUrl: string;
  private serviceRoleKey: string;

  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.serviceRoleKey = serviceRoleKey;
  }

  async generateUploadIntent(bucket: string, storageKey: string, contentType: string, expirationSeconds: number = 3600): Promise<{ uploadUrl: string }> {
    const url = `${this.supabaseUrl}/storage/v1/object/sign/${bucket}/${storageKey}`;
    // Generate signed upload URL via Supabase REST API
    // Actually, creating a presigned URL in supabase usually requires calling their admin API or using SDK.
    // Assuming simple mock or direct API call:
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expiresIn: expirationSeconds }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate upload URL: ${response.statusText}`);
    }

    const data = await response.json();
    // Return the signed URL for upload
    return { uploadUrl: this.supabaseUrl + data.signedUrl };
  }

  async resolveUrl(bucket: string, storageKey: string): Promise<string> {
    return `${this.supabaseUrl}/storage/v1/object/public/${bucket}/${storageKey}`;
  }

  async deleteObject(bucket: string, storageKey: string): Promise<void> {
    const url = `${this.supabaseUrl}/storage/v1/object/${bucket}/${storageKey}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.serviceRoleKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete asset: ${response.statusText}`);
    }
  }
}
