// app/components/PM2Manager.tsx
"use client";

import { useState, useEffect } from "react";
import {
  listProcesses,
  restartProcess,
  getLogs,
  getMetrics,
} from "../lib/pm2Actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
// import LogViewerModal from "@/components/pm2/LogViewerModal";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { CircleIcon } from "lucide-react";
interface ProcessInfo {
  id: number;
  name: string;
  status: string;
  cpu: number;
  memory: number;
}

interface LogData {
  stdout: string[];
  stderr: string[];
}

interface MetricsData {
  totalProcesses: number;
  running: number;
  errored: number;
}

export default function PM2Manager({
  initialProcesses,
  initialMetrics,
}: {
  initialProcesses: ProcessInfo[];
  initialMetrics: MetricsData;
}) {
  const [processes, setProcesses] = useState<ProcessInfo[]>(initialProcesses || []);
  const [selectedProcess, setSelectedProcess] = useState<number | null>(null);
  const [logs, setLogs] = useState<LogData>({ stdout: [], stderr: [] });
  const [metrics, setMetrics] = useState<MetricsData | null>(initialMetrics || null);
  const [error, setError] = useState<string>("");

  //   useEffect(() => {
  //     fetchData();
  //   }, []);

  async function fetchData() {
    try {
      const [processesData, metricsData] = await Promise.all([
        listProcesses(),
        getMetrics(),
      ]);
      setProcesses(processesData);
      setMetrics(metricsData);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  }

  async function handleRestart(processId: number) {
    try {
      await restartProcess(processId);
      fetchData(); // Refresh the data
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  }

  async function handleViewLogs(processId: number) {
    try {
      const logData = await getLogs(processId);
      setLogs(logData);
      setSelectedProcess(processId);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  }

  return (
    <div className="container mx-auto p-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Metrics Overview */}
      {metrics && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>System Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Processes</p>
                <p className="text-2xl font-bold">{metrics.totalProcesses}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Running</p>
                <p className="text-2xl font-bold">{metrics.running}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Errored</p>
                <p className="text-2xl font-bold">{metrics.errored}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Process List */}
      <Card>
        <CardHeader>
          <CardTitle>Processes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {processes.map((process) => (
              <div
                key={process.id}
                className="flex items-center justify-between p-4 border rounded"
              >
                <HoverCard>
                  <HoverCardTrigger>
                    <div className="flex items-center">
                      <CircleIcon
                        className={`h-4 w-4 mr-2 ${
                          process.status === "running"
                            ? "text-green-500"
                            : process.status === "errored"
                            ? "text-red-500"
                            : "text-yellow-500"
                        }`}
                      />
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-auto space-x-2">
                    <p className="text-sm">Process ID: {process.id}</p>
                  </HoverCardContent>
                </HoverCard>
                <div>
                  <h3 className="font-medium">{process.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Status: {process.status} | CPU: {process.cpu.toFixed(1)}% |
                    Memory: {(process.memory / 1024 / 1024).toFixed(2)}MB
                  </p>
                </div>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => handleViewLogs(process.id)}
                  >
                    View Logs
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => handleRestart(process.id)}
                  >
                    Restart
                  </Button>
                  {/* <LogViewerModal
                    processId={process.id}
                    processName={process.name}
                  /> */}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Logs View */}
      {selectedProcess && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Logs for Process {selectedProcess}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Standard Output</h4>
                <pre className="bg-secondary p-4 rounded overflow-x-auto">
                  {logs.stdout.join("\n")}
                </pre>
              </div>
              <div>
                <h4 className="font-medium mb-2">Standard Error</h4>
                <pre className="bg-secondary p-4 rounded overflow-x-auto">
                  {logs.stderr.join("\n")}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
