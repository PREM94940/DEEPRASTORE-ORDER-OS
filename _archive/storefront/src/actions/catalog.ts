import { CatalogReadModel } from '../../../../packages/infrastructure/src/read-models/CatalogReadModel';
import { InventoryReadModel } from '../../../../packages/infrastructure/src/read-models/InventoryReadModel';

// Next.js Server Action
export async function fetchCatalogPage() {
  const catalog = new CatalogReadModel();
  const inventory = new InventoryReadModel();

  const products = await catalog.getAvailableProducts();
  const stock = await inventory.getAvailability('PROD-1');

  // No Domain Mutations. Pure CQRS Data Fetching.
  return { products, stock };
}
