import { AssetRepository } from './AssetRepository';
import { StorageAdapter } from './StorageAdapter';

export class AssetRegistryResolver {
  private storageAdapter: StorageAdapter;
  private defaultBucket: string;

  constructor(storageAdapter: StorageAdapter, defaultBucket: string = 'theme-assets') {
    this.storageAdapter = storageAdapter;
    this.defaultBucket = defaultBucket;
  }

  /**
   * Scans a Theme config object for asset references and dynamically injects `publicUrl`.
   * Assume asset references are stored as `{ type: 'asset', assetId: 'uuid', storageKey: 'some-key' }`
   */
  async resolveConfigAssets(config: any): Promise<any> {
    if (!config) return config;

    const resolvedConfig = JSON.parse(JSON.stringify(config)); // deep copy

    await this.traverseAndResolve(resolvedConfig);

    return resolvedConfig;
  }

  private async traverseAndResolve(node: any) {
    if (typeof node !== 'object' || node === null) return;

    if (Array.isArray(node)) {
      for (const item of node) {
        await this.traverseAndResolve(item);
      }
    } else {
      // Check if current node is an asset reference
      if (node.type === 'asset' && node.storageKey) {
        node.publicUrl = await this.storageAdapter.resolveUrl(this.defaultBucket, node.storageKey);
      }

      for (const key of Object.keys(node)) {
        await this.traverseAndResolve(node[key]);
      }
    }
  }

  /**
   * Strips transient URLs (like `publicUrl`) from a Theme config object
   * to guarantee they are never persisted back into the database.
   */
  stripTransientUrls(config: any): any {
    if (!config) return config;

    const strippedConfig = JSON.parse(JSON.stringify(config)); // deep copy
    this.traverseAndStrip(strippedConfig);

    return strippedConfig;
  }

  private traverseAndStrip(node: any) {
    if (typeof node !== 'object' || node === null) return;

    if (Array.isArray(node)) {
      for (const item of node) {
        this.traverseAndStrip(item);
      }
    } else {
      // Check if current node is an asset reference
      if (node.type === 'asset' && node.publicUrl !== undefined) {
        delete node.publicUrl;
      }

      for (const key of Object.keys(node)) {
        this.traverseAndStrip(node[key]);
      }
    }
  }
}
