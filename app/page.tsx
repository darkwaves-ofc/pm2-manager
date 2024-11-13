'use client'

import { useState, useEffect } from "react";
import PM2Manager from "@/components/PM2Manager";
import { getMetrics, listProcesses, MetricData, ProcessInfo } from "@/lib/pm2Actions";

export default function Page() {
  const [isLoading, setIsLoading] = useState(true);
  const [processesData, setProcessesData] = useState<ProcessInfo[]>([]);
  const [metricsData, setMetricsData] = useState<MetricData>({
    totalProcesses: 0,
    running: 0,
    errored: 0,
    stopped: 0,
    totalMemory: 0,
    totalCPU: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [processes, metrics] = await Promise.all([
          listProcesses(),
          getMetrics(),
        ]);
        setProcessesData(processes);
        setMetricsData(metrics);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-white/80">
          <div className="animate-spin">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        </div>
      );
    }
  return (
    <PM2Manager initialMetrics={metricsData} initialProcesses={processesData} />
  );
}
