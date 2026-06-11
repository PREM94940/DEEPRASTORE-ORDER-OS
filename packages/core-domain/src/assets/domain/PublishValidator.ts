import { AssetRepository } from './AssetRepository';

export class PublishValidator {
  constructor(private readonly assetRepository: AssetRepository) {}

  /**
   * Validates if a theme config can be published.
   * Blocks publishing if any referenced asset is not in the 'READY' state.
   */
  async validateConfigAssetsReady(config: any, tenantId: string): Promise<boolean> {
    if (!config) {
      return true;
    }

    const assetIds = this.extractAssetIds(config);
    if (assetIds.length === 0) {
      return true;
    }

    for (const assetId of assetIds) {
      const asset = await this.assetRepository.findById(tenantId, assetId);
      if (!asset) {
        throw new Error(`Publish blocked: Asset ${assetId} NOT FOUND.`);
      }
      if (asset.state !== 'READY') {
        throw new Error(`Publish blocked: Asset ${assetId} is not in READY state (current state: ${asset.state}).`);
      }
    }

    return true;
  }

  /**
   * Extracts all referenced assetIds from the given configuration tree.
   * Looks for objects with type === 'asset' and an 'assetId' property.
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
      // Reference enforcement logic looks for type: 'asset' objects.
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
