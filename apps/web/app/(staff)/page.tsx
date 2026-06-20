import { getPilotMetrics } from '@/app/(staff)/actions/pilot';
import DashboardClient from './dashboard-client';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const metrics = await getPilotMetrics();
  return <DashboardClient metrics={metrics} />;
}
