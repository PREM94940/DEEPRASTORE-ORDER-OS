import { describe, it, expect, vi } from 'vitest';
import { PublishService } from '../theme/services/PublishService';
import { RollbackService } from '../theme/services/RollbackService';

describe('Security Auditor: M5 Authorization & Abuse Tests', () => {
  describe('IDOR Protection — Publish', () => {
    it('should reject publish when tenantId does not match theme owner', async () => {
      const attackerTenantId = 'attacker-tenant';
      const victimThemeId = 'victim-theme';

      const mockDb = {
        transaction: vi.fn(async (cb) => await cb({}))
      };

      const mockRepo = {
        getTheme: vi.fn().mockResolvedValue({ id: victimThemeId, tenantId: 'legitimate-tenant' }),
        getDraftConfig: vi.fn(),
        getNextVersionNumber: vi.fn(),
        createVersion: vi.fn(),
        addAssetReferences: vi.fn(),
        unsetCurrentForOthers: vi.fn(),
        updatePublication: vi.fn(),
        logEvent: vi.fn(),
      };

      const mockValidator = {
        validateConfigAssetsReady: vi.fn(),
      };

      const service = new PublishService(mockDb as any, mockRepo as any, mockValidator as any);

      await expect(
        service.publishDraft(attackerTenantId, victimThemeId, 'attacker-user', 'Stolen Version')
      ).rejects.toThrow('Authorization failed');

      // Verify no version was created
      expect(mockRepo.createVersion).not.toHaveBeenCalled();
      expect(mockRepo.addAssetReferences).not.toHaveBeenCalled();
      expect(mockRepo.logEvent).not.toHaveBeenCalled();
    });

    it('should reject publish when theme does not exist', async () => {
      const mockDb = {
        transaction: vi.fn(async (cb) => await cb({}))
      };

      const mockRepo = {
        getTheme: vi.fn().mockResolvedValue(null),
        getDraftConfig: vi.fn(),
      };

      const mockValidator = { validateConfigAssetsReady: vi.fn() };

      const service = new PublishService(mockDb as any, mockRepo as any, mockValidator as any);

      await expect(
        service.publishDraft('any-tenant', 'nonexistent-theme', 'user', 'v1')
      ).rejects.toThrow('Theme not found');
    });
  });

  describe('IDOR Protection — Rollback', () => {
    it('should reject rollback when tenantId does not match theme owner', async () => {
      const mockRepo = {
        getTheme: vi.fn().mockResolvedValue({ id: 'theme-1', tenantId: 'legitimate-tenant' }),
        getVersionById: vi.fn(),
        getLatestVersion: vi.fn(),
        createVersion: vi.fn(),
        logEvent: vi.fn(),
      };

      const service = new RollbackService(mockRepo as any);

      await expect(
        service.rollback('attacker-tenant', 'theme-1', 'version-1', 'attacker-user')
      ).rejects.toThrow('Authorization failed');

      expect(mockRepo.createVersion).not.toHaveBeenCalled();
      expect(mockRepo.logEvent).not.toHaveBeenCalled();
    });

    it('should reject rollback when target version belongs to a different theme', async () => {
      const mockRepo = {
        getTheme: vi.fn().mockResolvedValue({ id: 'theme-1', tenantId: 'tenant-1' }),
        getVersionById: vi.fn().mockResolvedValue({
          id: 'version-from-other-theme',
          themeId: 'theme-OTHER',
          versionNumber: 3,
          config: {},
        }),
        getLatestVersion: vi.fn(),
        createVersion: vi.fn(),
        logEvent: vi.fn(),
      };

      const service = new RollbackService(mockRepo as any);

      await expect(
        service.rollback('tenant-1', 'theme-1', 'version-from-other-theme', 'user-1')
      ).rejects.toThrow('Target version does not belong to theme');

      expect(mockRepo.createVersion).not.toHaveBeenCalled();
    });
  });

  describe('Historical Version Immutability', () => {
    it('should create a NEW version on rollback, never mutating the original', async () => {
      const originalConfig = Object.freeze({ hero: { title: 'Original V1' } });

      const mockRepo = {
        getTheme: vi.fn().mockResolvedValue({ id: 'theme-1', tenantId: 'tenant-1' }),
        getVersionById: vi.fn().mockResolvedValue({
          id: 'version-1',
          themeId: 'theme-1',
          versionNumber: 1,
          versionName: 'V1',
          config: originalConfig,
        }),
        getLatestVersion: vi.fn().mockResolvedValue({
          id: 'version-3',
          versionNumber: 3,
        }),
        createVersion: vi.fn().mockImplementation((dto) => Promise.resolve({ id: 'version-4', ...dto })),
        logEvent: vi.fn(),
      };

      const service = new RollbackService(mockRepo as any);

      const result = await service.rollback('tenant-1', 'theme-1', 'version-1', 'user-1');

      // New version was created
      expect(result.id).toBe('version-4');
      expect(result.versionNumber).toBe(4);

      // Original version was NOT modified (getVersionById still returns original)
      const originalStillIntact = await mockRepo.getVersionById('version-1');
      expect(originalStillIntact.versionNumber).toBe(1);
      expect(originalStillIntact.config).toEqual({ hero: { title: 'Original V1' } });

      // Lineage is correctly tracked
      expect(result.parentVersionId).toBe('version-3');
      expect(result.createdFromVersionId).toBe('version-1');
    });
  });

  describe('Rollback Abuse Prevention', () => {
    it('should reject rollback to a nonexistent version', async () => {
      const mockRepo = {
        getTheme: vi.fn().mockResolvedValue({ id: 'theme-1', tenantId: 'tenant-1' }),
        getVersionById: vi.fn().mockResolvedValue(null),
        getLatestVersion: vi.fn(),
        createVersion: vi.fn(),
        logEvent: vi.fn(),
      };

      const service = new RollbackService(mockRepo as any);

      await expect(
        service.rollback('tenant-1', 'theme-1', 'nonexistent-version', 'user-1')
      ).rejects.toThrow('Target version');

      expect(mockRepo.createVersion).not.toHaveBeenCalled();
    });
  });
});
