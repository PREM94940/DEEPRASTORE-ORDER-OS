import { StorageAdapter } from '@deeprastore/core-domain/src/assets/domain/StorageAdapter';

export class SupabaseStorageAdapter implements StorageAdapter {
  private supabaseClient: any; // Using 'any' here for outline purposes; would be SupabaseClient

  constructor(supabaseClient: any) {
    this.supabaseClient = supabaseClient;
  }

  /**
   * Upload intent flow
   * Requests a pre-signed URL from Supabase Storage allowing direct client upload
   */
  async generateUploadIntent(bucket: string, storageKey: string, contentType: string): Promise<{ uploadUrl: string }> {
    const { data, error } = await this.supabaseClient.storage
      .from(bucket)
      .createSignedUploadUrl(storageKey);

    if (error) {
      throw new Error(`Failed to generate upload intent: ${error.message}`);
    }

    return { uploadUrl: data.signedUrl };
  }

  /**
   * Object deletion flow
   * Deletes an object directly from Supabase Storage
   */
  async deleteObject(bucket: string, storageKey: string): Promise<void> {
    const { error } = await this.supabaseClient.storage
      .from(bucket)
      .remove([storageKey]);

    if (error) {
      throw new Error(`Failed to delete object: ${error.message}`);
    }
  }

  /**
   * Resolves URL at runtime
   * Enforces Rule 2: Physical URLs NEVER persisted
   */
  async resolveUrl(bucket: string, storageKey: string): Promise<string> {
    const { data } = this.supabaseClient.storage
      .from(bucket)
      .getPublicUrl(storageKey);
      
    return data.publicUrl;
  }
}
