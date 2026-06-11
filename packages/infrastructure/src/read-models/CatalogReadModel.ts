export interface ProductReadDTO {
  id: string;
  name: string;
  price: number;
}

export class CatalogReadModel {
  async getAvailableProducts(): Promise<ProductReadDTO[]> {
    // Simulated direct raw SQL read without Drizzle ORM mutations
    return [
      { id: 'PROD-1', name: 'Luxury Handbag', price: 1500 }
    ];
  }
}
