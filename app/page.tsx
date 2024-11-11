import PM2Manager from "@/components/PM2Manager";
import { getMetrics, listProcesses } from "@/lib/pm2Actions";

export default async function page() {
  const [processesData, metricsData] = await Promise.all([
    listProcesses(),
    getMetrics(),
  ]);
  return (
    <PM2Manager initialMetrics={metricsData} initialProcesses={processesData} />
  );
}
