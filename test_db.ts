import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '.env') });

import { fetchAllOrdersAction } from './apps/admin-portal/src/app/actions/orders';
import { fetchCustomerOrdersAction } from './apps/storefront/src/app/actions/portal';

async function runTest() {
  console.log("=== STARTING EVIDENCE VALIDATION ===");
  const targetId = "f07c2c5a-4679-4153-8881-1edc25fc47d0";
  const phone = "9494026218";

  console.log("\\n[1] Testing Admin Dashboard fetchAllOrdersAction...");
  try {
    const adminRes = await fetchAllOrdersAction();
    if (adminRes.success) {
      console.log(`SUCCESS: Fetched ${adminRes.orders.length} orders.`);
      const found = adminRes.orders.find((o: any) => o.id === targetId);
      if (found) {
        console.log(`EVIDENCE: Order ${targetId} FOUND in Admin Dashboard data.`);
      } else {
        console.log(`FAIL: Order ${targetId} NOT FOUND in Admin Dashboard data.`);
      }
    } else {
      console.log(`FAIL: Admin Action returned false. Error: ${adminRes.error}`);
    }
  } catch (err: any) {
    console.log(`CRASH: Admin Action threw an exception: ${err.message}`);
  }

  console.log("\\n[2] Testing Customer Portal fetchCustomerOrdersAction...");
  try {
    const portalRes = await fetchCustomerOrdersAction(phone);
    if (portalRes.success) {
      console.log(`SUCCESS: Fetched ${portalRes.orders.length} orders for phone ${phone}.`);
      const found = portalRes.orders.find((o: any) => o.id === targetId);
      if (found) {
        console.log(`EVIDENCE: Order ${targetId} FOUND in Customer Portal data.`);
      } else {
        console.log(`FAIL: Order ${targetId} NOT FOUND in Customer Portal data.`);
      }
    } else {
      console.log(`FAIL: Portal Action returned false. Error: ${portalRes.error}`);
    }
  } catch (err: any) {
    console.log(`CRASH: Portal Action threw an exception: ${err.message}`);
  }
  process.exit(0);
}

runTest().catch(console.error);
