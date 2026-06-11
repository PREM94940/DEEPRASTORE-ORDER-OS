import { describe, it, expect, vi } from 'vitest';
import { RollbackService } from './RollbackService';

describe('RollbackService', () => {
  it('should validate tenantId authorization and create a linear snapshot on rollback', async () => {
    const mockThemeId = 'theme-123';
    const mockTenantId = 'tenant-xyz';
    const targetVersionId = 'version-1';
    
    const mockRepository = {
      getTheme: vi.fn().mockResolvedValue({ id: mockThemeId, tenantId: mockTenantId }),
      getVersionById: vi.fn().mockResolvedValue({ id: targetVersionId, themeId: mockThemeId, versionName: 'v1.0', versionNumber: 1, config: {} }),
      getLatestVersion: vi.fn().mockResolvedValue({ id: 'version-2', versionNumber: 2 }),
      createVersion: vi.fn().mockResolvedValue({ id: 'version-3' }),
      logEvent: vi.fn()
    };

    const service = new RollbackService(mockRepository as any);
    const result = await service.rollback(mockTenantId, mockThemeId, targetVersionId, 'user-1');

    expect(result.id).toBe('version-3');
    expect(mockRepository.createVersion).toHaveBeenCalledWith(expect.objectContaining({
      versionNumber: 3,
      createdFromVersionId: targetVersionId,
      parentVersionId: 'version-2',
      state: 'DRAFT',
      isCurrent: false
    }));
  });

  it('should fail if tenantId does not match the theme', async () => {
    const mockThemeId = 'theme-123';
    
    const mockRepository = {
      getTheme: vi.fn().mockResolvedValue({ id: mockThemeId, tenantId: 'other-tenant' }),
      getVersionById: vi.fn(),
      getLatestVersion: vi.fn(),
      createVersion: vi.fn(),
      logEvent: vi.fn()
    };

    const service = new RollbackService(mockRepository as any);
    
    await expect(service.rollback('attacker-tenant', mockThemeId, 'version-1', 'user-1'))
      .rejects.toThrowError(/Authorization failed: Theme does not belong to the given tenant/);
  });
});
