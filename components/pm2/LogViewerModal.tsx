'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { streamLogs, stopLogStream } from '@/lib/pm2Actions';
import { Loader2Icon } from 'lucide-react';

interface LogViewerModalProps {
  processId: string | number;
  processName?: string;
}

export default function LogViewerModal({ processId, processName }: LogViewerModalProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [logProcess, setLogProcess] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Start streaming logs when modal opens
  useEffect(() => {
    let mounted = true;

    async function startLogStream() {
      if (!isOpen) return;
      
      setIsLoading(true);
      try {
        const process = await streamLogs(processId, (logData) => {
          if (mounted) {
            setLogs(prevLogs => [...prevLogs, logData.data].slice(-1000)); // Keep last 1000 lines
          }
        });
        setLogProcess(process);
      } catch (error) {
        console.error('Error streaming logs:', error);
      } finally {
        setIsLoading(false);
      }
    }

    startLogStream();

    // Cleanup function
    return () => {
      mounted = false;
      if (logProcess) {
        stopLogStream(logProcess);
      }
    };
  }, [isOpen, processId]);

  // Clear logs and stop stream when modal closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setLogs([]);
      if (logProcess) {
        stopLogStream(logProcess);
        setLogProcess(null);
      }
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
                  className="py-0.5"
                >
                  {log}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}