import { OrderRepository } from '../packages/infrastructure/src/repositories/OrderRepository';

async function runRedTeamTests() {
  console.log("--- RED TEAM VALIDATION: P0.1 GATEKEEPER ---");
  const repo = new OrderRepository();
  const tenantId = '11111111-1111-1111-1111-111111111111';
  
  // Test 1: DRAFT -> DELIVERED (Should fail)
  try {
    console.log("\n[TEST 1] Attempt: DRAFT -> DELIVERED");
    repo.getOrderById = async () => ({ id: '1', status: 'DRAFT', paymentStatus: 'PENDING' } as any);
    // @ts-ignore
    await repo.updateOrderProductionStatus(null, tenantId, '1', 'DELIVERED');
    console.log("❌ FAILED: Allowed!");
  } catch (e: any) {
    console.log(`✅ BLOCKED. Reason: ${e.message}`);
  }

  // Test 2: UNPAID -> QC (Should fail)
  try {
    console.log("\n[TEST 2] Attempt: UNPAID -> QC");
    repo.getOrderById = async () => ({ id: '1', status: 'CONFIRMED', paymentStatus: 'PENDING' } as any);
    // @ts-ignore
    await repo.updateOrderProductionStatus(null, tenantId, '1', 'QC');
    console.log("❌ FAILED: Allowed!");
  } catch (e: any) {
    console.log(`✅ BLOCKED. Reason: ${e.message}`);
  }

  // Test 3: UNPAID -> DISPATCHED (Should fail)
  try {
    console.log("\n[TEST 3] Attempt: UNPAID -> DISPATCHED");
    repo.getOrderById = async () => ({ id: '1', status: 'READY_TO_SHIP', paymentStatus: 'PENDING', balanceAmount: '1000' } as any);
    // @ts-ignore
    await repo.updateOrderDispatchStatusWithAudit(null, tenantId, '1', 'DISPATCHED', 'staff', { courierName: 'Test', trackingId: 'Test' });
    console.log("❌ FAILED: Allowed!");
  } catch (e: any) {
    console.log(`✅ BLOCKED. Reason: ${e.message}`);
  }
}

runRedTeamTests().catch(console.error);
