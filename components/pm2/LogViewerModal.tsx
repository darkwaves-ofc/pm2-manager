"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
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
import { handleLogStreamRequest } from "@/lib/pusherPm2";

interface LogEntry {
  type: "stdout" | "stderr";
  data: string;
  timestamp: string;
}

interface LogViewerModalProps {
  processId: string | number;
  processName?: string;
  isLogViewerOpen: {
    open: boolean;
    openedID: string | number | null;
  };
  setLogViewerOpen: Dispatch<
    SetStateAction<{
      open: boolean;
      openedID: string | number | null;
    }>
  >;
}

export default function LogViewerModal({
  processId,
  processName,
  isLogViewerOpen,
  setLogViewerOpen,
}: LogViewerModalProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Start streaming logs when modal opens
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    /**
     * Client-side code to subscribe to the log stream
     */
    function subscribeToLogs(
      pusherClient: Pusher,
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
    async function startLogStream() {
      if (!isLogViewerOpen) return;

      setIsLoading(true);
      try {
        // Start the log stream on the server
        const response = await handleLogStreamRequest({
          processId,
        });

        if (!response.success) {
          throw new Error("Failed to start log stream");
        }

        const { channel } = response;
        if (!channel) {
          throw new Error("Channel not found in response");
        }
        // Initialize Pusher client
        const pusherClient = new Pusher(
          process.env.NEXT_PUBLIC_PUSHER_KEY || "d0f767f23f93d1dad19d",
          {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap1",
          }
        );
        // Subscribe to the Pusher channel
        cleanup = subscribeToLogs(
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
  }, [processId]);

  // Clear logs when modal closes
  const handleOpenChange = (open: boolean) => {
    setLogViewerOpen({
      openedID: processId,
      open,
    });
    if (!open) {
      setLogs([]);
    }
  };

  return (
    <Dialog
      open={isLogViewerOpen.openedID === processId && isLogViewerOpen.open}
      onOpenChange={handleOpenChange}
    >
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
