import { describe, it, expect, vi } from 'vitest';
import { PublishValidator } from './PublishValidator';
import { AssetRepository, Asset, AssetState, StorageProvider } from './AssetRepository';

describe('PublishValidator', () => {
  const mockTenantId = 'tenant-123';

  const createMockAsset = (id: string, state: AssetState): Asset => ({
    id,
    tenantId: mockTenantId,
    fileName: `${id}.png`,
    mimeType: 'image/png',
    sizeBytes: 1024,
    sha256Checksum: 'dummy-checksum',
    storageProvider: 'S3' as StorageProvider,
    storageKey: `dummy-key-${id}`,
    state,
    createdBy: 'user-1'
  });

  it('should allow publishing if config has no assets', async () => {
    const mockRepo: AssetRepository = {
      createAssetWithTracking: vi.fn(),
      findByChecksum: vi.fn(),
      findById: vi.fn(),
      updateState: vi.fn(),
      addReference: vi.fn(),
      countReferences: vi.fn(),
      logEvent: vi.fn(),
    };
    const validator = new PublishValidator(mockRepo);

    const config = { someField: 'value' };
    const result = await validator.validateConfigAssetsReady(config, mockTenantId);
    expect(result).toBe(true);
  });

  it('should allow publishing if all referenced assets are READY', async () => {
    const mockRepo: AssetRepository = {
      createAssetWithTracking: vi.fn(),
      findByChecksum: vi.fn(),
      findById: vi.fn().mockImplementation(async (tenantId, id) => {
        if (id === 'asset-1' || id === 'asset-2') {
          return createMockAsset(id, 'READY');
        }
        return null;
      }),
      updateState: vi.fn(),
      addReference: vi.fn(),
      countReferences: vi.fn(),
      logEvent: vi.fn(),
    };
    const validator = new PublishValidator(mockRepo);

    const config = {
      header: {
        logo: { type: 'asset', assetId: 'asset-1' }
      },
      footer: {
        background: { type: 'asset', assetId: 'asset-2' }
      }
    };
    const result = await validator.validateConfigAssetsReady(config, mockTenantId);
    expect(result).toBe(true);
    expect(mockRepo.findById).toHaveBeenCalledTimes(2);
  });

  it('should block publishing if any referenced asset is UPLOADING', async () => {
    const mockRepo: AssetRepository = {
      createAssetWithTracking: vi.fn(),
      findByChecksum: vi.fn(),
      findById: vi.fn().mockImplementation(async (tenantId, id) => {
        if (id === 'asset-1') return createMockAsset(id, 'READY');
        if (id === 'asset-2') return createMockAsset(id, 'UPLOADING');
        return null;
      }),
      updateState: vi.fn(),
      addReference: vi.fn(),
      countReferences: vi.fn(),
      logEvent: vi.fn(),
    };
    const validator = new PublishValidator(mockRepo);

    const config = {
      sections: [
        { type: 'asset', assetId: 'asset-1' },
        { type: 'asset', assetId: 'asset-2' }
      ]
    };
    
    await expect(validator.validateConfigAssetsReady(config, mockTenantId))
      .rejects.toThrowError(/Publish blocked: Asset asset-2 is not in READY state/);
  });

  it('should block publishing if a referenced asset is not found', async () => {
    const mockRepo: AssetRepository = {
      createAssetWithTracking: vi.fn(),
      findByChecksum: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      updateState: vi.fn(),
      addReference: vi.fn(),
      countReferences: vi.fn(),
      logEvent: vi.fn(),
    };
    const validator = new PublishValidator(mockRepo);

    const config = {
      content: { type: 'asset', assetId: 'missing-asset' }
    };
    
    await expect(validator.validateConfigAssetsReady(config, mockTenantId))
      .rejects.toThrowError(/Publish blocked: Asset missing-asset NOT FOUND/);
  });
});
