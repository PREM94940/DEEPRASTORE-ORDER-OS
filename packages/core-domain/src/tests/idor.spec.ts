import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderRepository } from '../../../infrastructure/src/repositories/OrderRepository';
import { CustomerRepository } from '../../../infrastructure/src/repositories/CustomerRepository';

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  }
}));

vi.mock('uuid', () => ({
  v4: () => 'mock-uuid'
}));

vi.mock('../../../infrastructure/src/db/client', () => ({
  db: mockDb
}));

describe('Negative Security Tests: IDOR & Cross-Tenant Data Access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Repository Isolation Validation', () => {
    it('cross-tenant order access: should return null when reading an order belonging to another tenant', async () => {
      // Setup the mock DB to return an order belonging to tenant A
      mockDb.where.mockResolvedValueOnce([{
        id: 'order-123',
        tenantId: 'TENANT-A',
        status: 'PENDING',
        totalAmount: '100'
      }]);

      const repo = new OrderRepository();
      
      // Attacker from TENANT-B tries to read order-123
      const result = await repo.getOrderById('TENANT-B', 'order-123');

      // The repository MUST filter it out and return null, preventing IDOR
      expect(result).toBeNull();
    });

    it('cross-tenant customer access: should return null when reading a customer belonging to another tenant', async () => {
      mockDb.where.mockResolvedValueOnce([{
        id: 'customer-123',
        tenantId: 'TENANT-A',
        phone: '1234567890'
      }]);

      const repo = new CustomerRepository();
      
      // Attacker from TENANT-B tries to read customer-123
      const result = await repo.getCustomerById('TENANT-B', 'customer-123');

      // IDOR protection should return null
      expect(result).toBeNull();
    });

    it('cross-tenant order access: updateOrderStatus should throw or fail when updating another tenant order', async () => {
      // Mock db returns the order for TENANT-A when queried by TENANT-B (simulating the update attempt)
      // Since updateOrderStatus internally calls getOrderById which will return null, it should throw
      mockDb.update.mockReturnThis();
      mockDb.set.mockReturnThis();
      
      mockDb.where.mockResolvedValueOnce([{
        id: 'order-123',
        tenantId: 'TENANT-A',
        status: 'PENDING',
        totalAmount: '100'
      }]);

      const repo = new OrderRepository();
      
      await expect(repo.updateOrderStatus(null, 'TENANT-B', 'order-123', 'CONFIRMED'))
        .rejects
        .toThrow('Order not found');
    });
  });

  describe('Forged TenantId Payload Rejection', () => {
    it('forged tenantId payload rejection: should ignore forged tenantId in payload for line items and filter by authenticated tenantId', async () => {
      // Attacker injects line items with someone else's tenant ID
      // The getLineItemsByOrderId method should only return line items matching the authenticated tenant ID
      mockDb.where.mockResolvedValueOnce([
        { id: 'li-1', tenantId: 'TENANT-A', orderId: 'order-123', price: '50' },
        { id: 'li-2', tenantId: 'TENANT-B', orderId: 'order-123', price: '50' } // Forged payload created this
      ]);

      const repo = new OrderRepository();
      
      // Requesting as TENANT-A
      const result = await repo.getLineItemsByOrderId('TENANT-A', 'order-123');

      // Should only see TENANT-A items
      expect(result).toHaveLength(1);
      expect(result[0].tenantId).toBe('TENANT-A');
      expect(result.some((item: any) => item.tenantId === 'TENANT-B')).toBe(false);
    });

    it('forged tenantId payload rejection: customer addresses should be strictly isolated by authenticated tenantId', async () => {
      mockDb.where.mockResolvedValueOnce([
        { id: 'addr-1', tenantId: 'TENANT-A', customerId: 'cust-123' },
        { id: 'addr-2', tenantId: 'ATTACKER', customerId: 'cust-123' } // Forged injected address
      ]);

      const repo = new CustomerRepository();
      
      const result = await repo.getAddressesByCustomerId('TENANT-A', 'cust-123');

      expect(result).toHaveLength(1);
      expect(result[0].tenantId).toBe('TENANT-A');
    });
  });
});
