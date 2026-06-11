import { describe, it, expect, vi } from 'vitest';
import { PublishService } from './PublishService';
import { PublishValidator } from '../../assets/domain/PublishValidator';

describe('PublishService', () => {
  it('should validate assets and securely generate asset references during publication', async () => {
    const mockTenantId = 'tenant-123';
    const mockThemeId = 'theme-456';
    const mockActorId = 'user-789';
    const mockVersionName = 'v1.0';
    const mockVersionId = 'version-999';

    // Mock DB transaction
    // Mock DB transaction
    const mockTx = {};
    const mockDb = {
      transaction: vi.fn(async (callback) => {
        return await callback(mockTx);
      })
    };

    // Mock ThemeVersionRepository
    const mockThemeVersionRepository = {
      getTheme: vi.fn().mockResolvedValue({ id: mockThemeId, tenantId: mockTenantId }),
      getDraftConfig: vi.fn().mockResolvedValue({ config: { logo: { type: 'asset', assetId: 'asset-1' } } }),
      getNextVersionNumber: vi.fn().mockResolvedValue(2),
      createVersion: vi.fn().mockResolvedValue(mockVersionId),
      addAssetReferences: vi.fn(),
      unsetCurrentForOthers: vi.fn(),
      updatePublication: vi.fn(),
      logEvent: vi.fn(),
    };

    // Mock PublishValidator
    const mockPublishValidator = {
      validateConfigAssetsReady: vi.fn().mockResolvedValue(true)
    };

    const publishService = new PublishService(
      mockDb as any,
      mockThemeVersionRepository as any,
      mockPublishValidator as any
    );

    const result = await publishService.publishDraft(
      mockTenantId,
      mockThemeId,
      mockActorId,
      mockVersionName,
      'Initial release'
    );

    expect(result).toBe(mockVersionId);

    // 1. Verify PublishValidator is called with correct config
    expect(mockPublishValidator.validateConfigAssetsReady).toHaveBeenCalledWith(
      { logo: { type: 'asset', assetId: 'asset-1' } },
      mockTenantId
    );

    // 2. Verify asset references are extracted and generated
    expect(mockThemeVersionRepository.addAssetReferences).toHaveBeenCalledWith(
      mockTx,
      mockTenantId,
      mockVersionId,
      ['asset-1']
    );

    // 3. Verify event is logged
    expect(mockThemeVersionRepository.logEvent).toHaveBeenCalled();
  });

  it('should block publication if PublishValidator throws', async () => {
    const mockTx = {};
    const mockDb = {
      transaction: vi.fn(async (callback) => {
        return await callback(mockTx);
      })
    };

    const mockThemeVersionRepository = {
      getTheme: vi.fn().mockResolvedValue({ id: 'th1', tenantId: 't1' }),
      getDraftConfig: vi.fn().mockResolvedValue({ config: { logo: { type: 'asset', assetId: 'asset-1' } } }),
    };

    const mockPublishValidator = {
      validateConfigAssetsReady: vi.fn().mockRejectedValue(new Error('Publish blocked: Asset asset-1 is not in READY state'))
    };

    const publishService = new PublishService(
      mockDb as any,
      mockThemeVersionRepository as any,
      mockPublishValidator as any
    );

    await expect(publishService.publishDraft('t1', 'th1', 'u1', 'v1')).rejects.toThrowError(/Publish blocked/);
  });

  it('should fail if tenantId does not match the theme during publish', async () => {
    const mockTx = {};
    const mockDb = {
      transaction: vi.fn(async (callback) => {
        return await callback(mockTx);
      })
    };

    const mockThemeVersionRepository = {
      getTheme: vi.fn().mockResolvedValue({ id: 'th1', tenantId: 'real-tenant' }),
      getDraftConfig: vi.fn()
    };

    const mockPublishValidator = {
      validateConfigAssetsReady: vi.fn()
    };

    const publishService = new PublishService(
      mockDb as any,
      mockThemeVersionRepository as any,
      mockPublishValidator as any
    );

    await expect(publishService.publishDraft('attacker-tenant', 'th1', 'u1', 'v1'))
      .rejects.toThrowError(/Authorization failed: Theme does not belong to the given tenant/);
  });
});
