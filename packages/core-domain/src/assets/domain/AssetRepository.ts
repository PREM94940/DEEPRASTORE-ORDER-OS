export type AssetState = 'UPLOADING' | 'READY' | 'ARCHIVED' | 'DELETED' | 'FAILED_UPLOAD';
export type StorageProvider = 'SUPABASE' | 'S3';

export interface Asset {
  id: string;
  tenantId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sha256Checksum: string;
  storageProvider: StorageProvider;
  storageKey: string;
  state: AssetState;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AssetRepository {
  createAssetWithTracking(asset: Asset, actorId: string, refType: string, refId: string): Promise<void>;
  findByChecksum(tenantId: string, checksum: string): Promise<Asset | null>;
  findById(tenantId: string, id: string): Promise<Asset | null>;
  updateState(tenantId: string, assetId: string, state: AssetState, actorId?: string): Promise<void>;
  addReference(tenantId: string, assetId: string, refType: string, refId: string): Promise<void>;
  countReferences(tenantId: string, assetId: string): Promise<number>;
  logEvent(tenantId: string, assetId: string, eventType: string, actorId: string, metadata?: object): Promise<void>;
}
