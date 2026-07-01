// @ts-nocheck
import { PublishValidator } from '../../assets/domain/PublishValidator';
import { IThemeVersionRepository } from '../repositories/IThemeVersionRepository';

export class PublishService {
  constructor(
    private readonly db: any,
    private readonly themeVersionRepository: IThemeVersionRepository,
    private readonly publishValidator: PublishValidator
  ) {}

  /**
   * Publishes the current draft of a theme as a new version.
   * Executed as a single Atomic Drizzle Transaction.
   */
  async publishDraft(tenantId: string, themeId: string, actorId: string, versionName: string, changeSummary: string = ''): Promise<string> {
    return await this.db.transaction(async (tx: any) => {
      // 0. Verify Tenant Authorization
      const themeRecord = await this.themeVersionRepository.getTheme(themeId);
      if (!themeRecord) {
        throw new Error('Theme not found.');
      }
      if (themeRecord.tenantId !== tenantId) {
        throw new Error('Authorization failed: Theme does not belong to the given tenant.');
      }

      // 1. Fetch Draft Config
      const draft = await this.themeVersionRepository.getDraftConfig(tx, themeId);
      if (!draft) {
        throw new Error('Theme draft not found.');
      }

      const config = draft.config || {};

      // 2. Validate Assets (blocks if any referenced asset is not READY)
      await this.publishValidator.validateConfigAssetsReady(config, tenantId);

      // 3. Freeze Config & Create ThemeVersion
      const nextVersionNumber = await this.themeVersionRepository.getNextVersionNumber(tx, themeId);
      
      const versionId = await this.themeVersionRepository.createVersion(tx, {
        themeId,
        versionName,
        versionNumber: nextVersionNumber,
        state: 'PUBLISHED',
        isCurrent: true,
        changeSummary,
        config,
        isPublished: true,
        createdBy: actorId
      });

      // 4. Add themeVersionAssetReferences
      const assetIds = this.extractAssetIds(config);
      await this.themeVersionRepository.addAssetReferences(tx, tenantId, versionId, assetIds);

      // 5. Swap isCurrent and Update Publication
      await this.themeVersionRepository.unsetCurrentForOthers(tx, themeId, versionId);
      await this.themeVersionRepository.updatePublication(tx, themeId, versionId, actorId);

      // 6. Log VERSION_PUBLISHED event
      await this.themeVersionRepository.logEvent(tx, {
        tenantId,
        themeId,
        versionId,
        eventType: 'VERSION_PUBLISHED',
        actorId,
        metadata: { versionName, versionNumber: nextVersionNumber }
      });

      return versionId; // Transaction commits here if no error occurred
    });
  }

  /**
   * Recursively extracts all referenced assetIds from the configuration tree.
   */
  private extractAssetIds(node: any, assetIds: Set<string> = new Set()): string[] {
    if (typeof node !== 'object' || node === null) {
      return Array.from(assetIds);
    }
    if (Array.isArray(node)) {
      for (const item of node) {
        this.extractAssetIds(item, assetIds);
      }
    } else {
      if (node.type === 'asset' && typeof node.assetId === 'string') {
        assetIds.add(node.assetId);
      }
      for (const key of Object.keys(node)) {
        this.extractAssetIds(node[key], assetIds);
      }
    }
    return Array.from(assetIds);
  }
}
