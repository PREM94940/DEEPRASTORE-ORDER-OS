export interface StorageAdapter {
  /**
   * Generates a pre-signed URL for uploading an asset.
   * This is part of the 'Upload intent flow'.
   * @param bucket The storage bucket.
   * @param storageKey The logical key or path for the asset.
   * @param contentType The MIME type.
   * @returns An object containing the uploadUrl.
   */
  generateUploadIntent(bucket: string, storageKey: string, contentType: string): Promise<{ uploadUrl: string }>;

  /**
   * Deletes an object from storage.
   * This handles the 'Object deletion flow'.
   * @param bucket The storage bucket.
   * @param storageKey The logical key of the object to delete.
   */
  deleteObject(bucket: string, storageKey: string): Promise<void>;

  /**
   * Resolves a logical storage key to a physical URL.
   * Rule 2: Physical URLs are NEVER persisted in JSON configurations.
   * @param bucket The storage bucket.
   * @param storageKey The logical key.
   */
  resolveUrl(bucket: string, storageKey: string): Promise<string>;
}
