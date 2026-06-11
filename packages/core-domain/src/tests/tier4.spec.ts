import { describe, it, expect, vi } from 'vitest';
import { PublishService } from '../theme/services/PublishService';
import { RollbackService } from '../theme/services/RollbackService';

describe('Tier 4: Automated Validation (Milestone 5)', () => {
  describe('Publish E2E Flow & Transaction Atomicity', () => {
    it('should successfully execute the Publish E2E flow atomically', async () => {
      const mockTenantId = 'tenant-xyz';
      const mockThemeId = 'theme-abc';
      const mockActorId = 'user-123';
      
      const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: mockThemeId, tenantId: mockTenantId }])
      };

      const mockDb = {
        transaction: vi.fn(async (cb) => await cb(mockTx))
      };

      const mockThemeVersionRepository = {
        getTheme: vi.fn().mockResolvedValue({ id: mockThemeId, tenantId: mockTenantId }),
        getDraftConfig: vi.fn().mockResolvedValue({ config: { hero: { type: 'asset', assetId: 'img-1' } } }),
        getNextVersionNumber: vi.fn().mockResolvedValue(5),
        createVersion: vi.fn().mockResolvedValue('version-5'),
        addAssetReferences: vi.fn(),
        unsetCurrentForOthers: vi.fn(),
        updatePublication: vi.fn(),
        logEvent: vi.fn()
      };

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
        'v5.0.0',
        'Major release'
      );

      expect(result).toBe('version-5');
      
      // Verification of Atomicity Flow steps
      // 1. Validates assets
      expect(mockPublishValidator.validateConfigAssetsReady).toHaveBeenCalledWith(
        { hero: { type: 'asset', assetId: 'img-1' } }, mockTenantId
      );
      // 2. Extracts references
      expect(mockThemeVersionRepository.addAssetReferences).toHaveBeenCalledWith(
        mockTx, mockTenantId, 'version-5', ['img-1']
      );
      // 3. Swaps isCurrent
      expect(mockThemeVersionRepository.unsetCurrentForOthers).toHaveBeenCalledWith(
        mockTx, mockThemeId, 'version-5'
      );
      // 4. Updates publication
      expect(mockThemeVersionRepository.updatePublication).toHaveBeenCalledWith(
        mockTx, mockThemeId, 'version-5', mockActorId
      );
      // 5. Logs event
      expect(mockThemeVersionRepository.logEvent).toHaveBeenCalledWith(mockTx, expect.objectContaining({
        eventType: 'VERSION_PUBLISHED',
        metadata: { versionName: 'v5.0.0', versionNumber: 5 }
      }));
    });

    it('should rollback transaction (throw) if asset validation fails', async () => {
      const mockTenantId = 'tenant-xyz';
      const mockThemeId = 'theme-abc';
      
      const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: mockThemeId, tenantId: mockTenantId }])
      };

      const mockDb = {
        transaction: vi.fn(async (cb) => await cb(mockTx))
      };

      const mockThemeVersionRepository = {
        getTheme: vi.fn().mockResolvedValue({ id: mockThemeId, tenantId: mockTenantId }),
        getDraftConfig: vi.fn().mockResolvedValue({ config: { hero: { type: 'asset', assetId: 'img-broken' } } }),
        getNextVersionNumber: vi.fn(),
        createVersion: vi.fn(),
      };

      const mockPublishValidator = {
        validateConfigAssetsReady: vi.fn().mockRejectedValue(new Error('Asset not ready'))
      };

      const publishService = new PublishService(
        mockDb as any,
        mockThemeVersionRepository as any,
        mockPublishValidator as any
      );

      await expect(
        publishService.publishDraft(mockTenantId, mockThemeId, 'user-123', 'v5.0.0')
      ).rejects.toThrow('Asset not ready');

      // Verify that further steps weren't executed
      expect(mockThemeVersionRepository.createVersion).not.toHaveBeenCalled();
    });
  });

  describe('Rollback E2E Flow', () => {
    it('should revert a theme to a historical version linearly (creating a snapshot)', async () => {
      const mockThemeVersionRepository = {
        getTheme: vi.fn().mockResolvedValue({ id: 'theme-abc', tenantId: 'tenant-xyz' }),
        getVersionById: vi.fn().mockResolvedValue({
          id: 'version-1',
          themeId: 'theme-abc',
          versionNumber: 1,
          versionName: 'Initial Release',
          config: { some: 'old-config' }
        }),
        getLatestVersion: vi.fn().mockResolvedValue({
          id: 'version-5',
          versionNumber: 5
        }),
        createVersion: vi.fn().mockImplementation((dto) => Promise.resolve({ id: 'version-6', ...dto })),
        logEvent: vi.fn()
      };

      const rollbackService = new RollbackService(mockThemeVersionRepository as any);

      const result = await rollbackService.rollback(
        'tenant-xyz',
        'theme-abc',
        'version-1',
        'user-123'
      );

      // Verify new snapshot creation
      expect(result.versionNumber).toBe(6);
      expect(result.state).toBe('DRAFT');
      expect(result.isCurrent).toBe(false);
      expect(result.parentVersionId).toBe('version-5');
      expect(result.createdFromVersionId).toBe('version-1');
      expect(result.config).toEqual({ some: 'old-config' });

      // Verify logging
      expect(mockThemeVersionRepository.logEvent).toHaveBeenCalledWith(expect.objectContaining({
        eventType: 'VERSION_ROLLED_BACK',
        metadata: {
          rolledBackToVersionId: 'version-1',
          rolledBackToVersionNumber: 1,
          previousLatestVersionId: 'version-5'
        }
      }));
    });
  });
});
