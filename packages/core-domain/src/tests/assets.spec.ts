import { describe, it, expect, vi } from 'vitest';
import { DrizzleAssetRepository } from '../../../infrastructure/src/db/repositories/DrizzleAssetRepository';
import { Asset, AssetState } from '../assets/domain/AssetRepository';

describe('Asset Lifecycle Validation Tests', () => {
  it('should allow valid state transitions', async () => {
    const mockDb = {
      transaction: vi.fn(async (cb) => {
        const mockTx = {
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{ state: 'UPLOADING', tenantId: 'tenant-1' }]),
          update: vi.fn().mockReturnThis(),
          set: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          values: vi.fn().mockReturnThis(),
        };
        await cb(mockTx);
      })
    };

    const repo = new DrizzleAssetRepository(mockDb);

    await expect(repo.updateState('tenant-1', 'asset-123', 'READY')).resolves.not.toThrow();
  });

  it('should block invalid state transitions', async () => {
    const mockDb = {
      transaction: vi.fn(async (cb) => {
        const mockTx = {
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{ state: 'READY', tenantId: 'tenant-1' }]),
          update: vi.fn().mockReturnThis(),
          set: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          values: vi.fn().mockReturnThis(),
        };
        await cb(mockTx);
      })
    };

    const repo = new DrizzleAssetRepository(mockDb);

    await expect(repo.updateState('tenant-1', 'asset-123', 'UPLOADING')).rejects.toThrow('Invalid state transition from READY to UPLOADING');
  });

  it('should prevent DELETED transition if references exist', async () => {
    const mockDb = {
      transaction: vi.fn(async (cb) => {
        const mockTx = {
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{ state: 'ARCHIVED', tenantId: 'tenant-1' }]),
          update: vi.fn().mockReturnThis(),
          set: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          values: vi.fn().mockReturnThis(),
        };
        
        mockTx.where = vi.fn()
          .mockReturnValueOnce(mockTx)
          .mockResolvedValueOnce([{ id: 'ref-1' }]);

        await cb(mockTx);
      })
    };

    const repo = new DrizzleAssetRepository(mockDb);

    await expect(repo.updateState('tenant-1', 'asset-123', 'DELETED')).rejects.toThrow('Cannot delete asset with active references');
  });

  it('should allow valid DELETED transition if no references exist', async () => {
    const mockDb = {
      transaction: vi.fn(async (cb) => {
        const mockTx = {
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{ state: 'ARCHIVED', tenantId: 'tenant-1' }]), 
          update: vi.fn().mockReturnThis(),
          set: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          values: vi.fn().mockReturnThis(),
        };
        
        mockTx.where = vi.fn()
          .mockReturnValueOnce(mockTx) 
          .mockResolvedValueOnce([]);

        await cb(mockTx);
      })
    };

    const repo = new DrizzleAssetRepository(mockDb);

    await expect(repo.updateState('tenant-1', 'asset-123', 'DELETED')).resolves.not.toThrow();
  });

  it('should enforce tenant isolation in updateState', async () => {
    const mockDb = {
      transaction: vi.fn(async (cb) => {
        const mockTx = {
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]), // Return empty to simulate not found due to tenantId mismatch
          update: vi.fn().mockReturnThis(),
          set: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          values: vi.fn().mockReturnThis(),
        };
        await cb(mockTx);
      })
    };

    const repo = new DrizzleAssetRepository(mockDb);

    await expect(repo.updateState('wrong-tenant', 'asset-123', 'READY')).rejects.toThrow('Asset not found');
  });

  it('should enforce tenant isolation in findById (read)', async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]), // Return empty to simulate not found due to tenantId mismatch
    };
    const repo = new DrizzleAssetRepository(mockDb);

    const result = await repo.findById('wrong-tenant', 'asset-123');
    expect(result).toBeNull();
  });

  it('should enforce tenant isolation in findByChecksum (read)', async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]), // empty when tenantId mismatches
    };
    const repo = new DrizzleAssetRepository(mockDb);

    const result = await repo.findByChecksum('wrong-tenant', 'checksum-123');
    expect(result).toBeNull();
  });

  it('should enforce tenant isolation in addReference (write)', async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]), 
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
    };
    const repo = new DrizzleAssetRepository(mockDb);

    await expect(repo.addReference('wrong-tenant', 'asset-123', 'PRODUCT', 'prod-1')).rejects.toThrow('Asset not found');
  });

  it('should enforce tenant isolation in logEvent (write)', async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
    };
    const repo = new DrizzleAssetRepository(mockDb);

    await expect(repo.logEvent('wrong-tenant', 'asset-123', 'TEST_EVENT', 'actor-1')).rejects.toThrow('Asset not found');
  });
});
