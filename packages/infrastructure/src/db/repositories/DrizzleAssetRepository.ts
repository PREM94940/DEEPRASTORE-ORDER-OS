import { eq, and } from 'drizzle-orm';
import { themeAssets, themeAssetEvents, themeAssetReferences } from '../../schema/theme';
import { AssetRepository, Asset, AssetState } from '../../../../core-domain/src/assets/domain/AssetRepository';

export class DrizzleAssetRepository implements AssetRepository {
  constructor(private readonly db: any) {}

  async createAssetWithTracking(asset: Asset, actorId: string, refType: string, refId: string): Promise<void> {
    await this.db.transaction(async (tx: any) => {
      await tx.insert(themeAssets).values({
        id: asset.id,
        tenantId: asset.tenantId,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes,
        sha256Checksum: asset.sha256Checksum,
        storageProvider: asset.storageProvider,
        storageKey: asset.storageKey,
        state: asset.state,
        createdBy: asset.createdBy,
        createdAt: asset.createdAt || new Date(),
        updatedAt: asset.updatedAt || new Date(),
      });

      await tx.insert(themeAssetReferences).values({
        tenantId: asset.tenantId,
        assetId: asset.id,
        referenceType: refType,
        referenceId: refId,
      });

      await tx.insert(themeAssetEvents).values({
        tenantId: asset.tenantId,
        assetId: asset.id,
        eventType: 'UPLOAD_INTENT',
        actorId: actorId,
        metadata: {
          assetId: asset.id,
          fileName: asset.fileName,
          checksum: asset.sha256Checksum
        }
      });
    });
  }

  async findByChecksum(tenantId: string, checksum: string): Promise<Asset | null> {
    const result = await this.db
      .select()
      .from(themeAssets)
      .where(and(eq(themeAssets.tenantId, tenantId), eq(themeAssets.sha256Checksum, checksum)))
      .limit(1);

    return result[0] ? (result[0] as Asset) : null;
  }

  async findById(tenantId: string, id: string): Promise<Asset | null> {
    const result = await this.db
      .select()
      .from(themeAssets)
      .where(and(eq(themeAssets.tenantId, tenantId), eq(themeAssets.id, id)))
      .limit(1);

    return result[0] ? (result[0] as Asset) : null;
  }

  async updateState(tenantId: string, assetId: string, newState: AssetState, actorId?: string): Promise<void> {
    await this.db.transaction(async (tx: any) => {
      const result = await tx
        .select({ state: themeAssets.state, tenantId: themeAssets.tenantId })
        .from(themeAssets)
        .where(and(eq(themeAssets.id, assetId), eq(themeAssets.tenantId, tenantId)))
        .limit(1);

      if (!result[0]) {
        throw new Error('Asset not found');
      }

      const currentState = result[0].state;

      const isValid = this.validateTransition(currentState, newState);
      if (!isValid) {
        throw new Error(`Invalid state transition from ${currentState} to ${newState}`);
      }

      if (newState === 'DELETED') {
        const refResult = await tx
          .select()
          .from(themeAssetReferences)
          .where(and(eq(themeAssetReferences.assetId, assetId), eq(themeAssetReferences.tenantId, tenantId)));
          
        if (refResult.length > 0) {
          throw new Error('Cannot delete asset with active references');
        }
      }

      await tx
        .update(themeAssets)
        .set({ state: newState, updatedAt: new Date() })
        .where(and(eq(themeAssets.id, assetId), eq(themeAssets.tenantId, tenantId)));

      await tx.insert(themeAssetEvents).values({
        tenantId: result[0].tenantId,
        assetId: assetId,
        eventType: `STATE_TRANSITION_${newState}`,
        actorId: actorId || '00000000-0000-0000-0000-000000000000',
        metadata: {
          previousState: currentState,
          newState: newState
        }
      });
    });
  }

  async addReference(tenantId: string, assetId: string, refType: string, refId: string): Promise<void> {
    const result = await this.db
      .select({ tenantId: themeAssets.tenantId })
      .from(themeAssets)
      .where(and(eq(themeAssets.id, assetId), eq(themeAssets.tenantId, tenantId)))
      .limit(1);

    if (!result[0]) throw new Error('Asset not found');

    await this.db.insert(themeAssetReferences).values({
      tenantId: result[0].tenantId,
      assetId,
      referenceType: refType,
      referenceId: refId,
    });
  }

  async countReferences(tenantId: string, assetId: string): Promise<number> {
    const results = await this.db
      .select()
      .from(themeAssetReferences)
      .where(and(eq(themeAssetReferences.assetId, assetId), eq(themeAssetReferences.tenantId, tenantId)));
    return results.length;
  }

  async logEvent(tenantId: string, assetId: string, eventType: string, actorId: string, metadata?: object): Promise<void> {
    const result = await this.db
      .select({ tenantId: themeAssets.tenantId })
      .from(themeAssets)
      .where(and(eq(themeAssets.id, assetId), eq(themeAssets.tenantId, tenantId)))
      .limit(1);

    if (!result[0]) throw new Error('Asset not found');

    await this.db.insert(themeAssetEvents).values({
      tenantId: result[0].tenantId,
      assetId,
      eventType,
      actorId,
      metadata: metadata || null,
    });
  }

  private validateTransition(current: string, next: string): boolean {
    if (current === 'UPLOADING' && (next === 'READY' || next === 'FAILED_UPLOAD')) return true;
    if (current === 'READY' && next === 'ARCHIVED') return true;
    if (current === 'ARCHIVED' && (next === 'READY' || next === 'DELETED')) return true;
    return false;
  }
}
