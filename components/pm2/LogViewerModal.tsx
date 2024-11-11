"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2Icon } from "lucide-react";
import Pusher from "pusher-js";

// Initialize Pusher client
const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
});

interface LogEntry {
  type: "stdout" | "stderr";
  data: string;
  timestamp: string;
}

interface LogViewerModalProps {
  processId: string | number;
  processName?: string;
}

export default function LogViewerModal({
  processId,
  processName,
}: LogViewerModalProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  /**
   * Client-side code to subscribe to the log stream
   */
  function subscribeToLogs(
    pusherClient: any,
    channelName: string,
    onLogReceived: (log: any) => void
  ) {
    const channel = pusherClient.subscribe(channelName);

    channel.bind("log-output", (data: any) => {
      onLogReceived(data);
    });

    channel.bind("log-error", (data: any) => {
      console.error("Log streaming error:", data);
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
    };
  }
  // Start streaming logs when modal opens
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function startLogStream() {
      if (!isOpen) return;

      setIsLoading(true);
      try {
        // Start the log stream on the server
        const response = await fetch(`/api/logs/${processId}`, {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("Failed to start log stream");
        }

        const { channel } = await response.json();

        // Subscribe to the Pusher channel
        cleanup = await subscribeToLogs(
          pusherClient,
          channel,
          (logEntry: LogEntry) => {
            setLogs((prevLogs) => [...prevLogs, logEntry].slice(-1000)); // Keep last 1000 lines
          }
        );
      } catch (error) {
        console.error("Error streaming logs:", error);
      } finally {
        setIsLoading(false);
      }
    }

    startLogStream();

    // Cleanup function
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [isOpen, processId]);

  // Clear logs when modal closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setLogs([]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Get Realtime Logs
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            Logs for {processName || `Process ${processId}`}
          </DialogTitle>
        </DialogHeader>
        <div className="relative flex-1 min-h-0">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-50">
              <Loader2Icon className="h-8 w-8 animate-spin" />
            </div>
          )}
          <ScrollArea className="h-[calc(80vh-8rem)] rounded-md border bg-muted p-4">
            <div className="font-mono text-sm whitespace-pre-wrap">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`py-0.5 ${
                    log.type === "stderr" ? "text-red-500" : ""
                  }`}
                >
                  <span className="text-muted-foreground">
                    {new Date(log.timestamp).toLocaleTimeString()} -{" "}
                  </span>
                  {log.data}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
