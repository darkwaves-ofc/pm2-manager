"use server"
import { revalidatePath } from "next/cache";
import { exec } from 'child_process';

// Types
interface ProcessInfo {
  name: string;
  id: number;
  status: string;
  cpu: number;
  memory: number;
  uptime: number;
}

interface LogData {
  stdout: string[];
  stderr: string[];
}

// Helper function to clean PM2 output
function cleanPM2Output(output: string): string {
  // Remove ANSI color codes
  output = output.replace(/\u001b\[\d+m/g, '');
  
  // Remove PM2 log prefixes like ">>>> In-memory PM2 is serving..."
  output = output.split('\n')
    .filter(line => line.trim() && !line.startsWith('>>>>'))
    .join('\n');
    
  return output;
}

// Server Actions
export async function listProcesses(): Promise<ProcessInfo[]> {
  return new Promise((resolve, reject) => {
    exec('pm2 jlist', (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      
      try {
        const cleanedOutput = cleanPM2Output(stdout);
        const list = JSON.parse(cleanedOutput);
        
        const processes = list.map((process: any) => ({
          name: process.name || '',
          id: process.pm_id || 0,
          status: process.pm2_env?.status || 'unknown',
          cpu: process.monit?.cpu || 0,
          memory: process.monit?.memory || 0,
          uptime: process.pm2_env?.pm_uptime || 0,
        }));
        resolve(processes);
      } catch (err:any) {
        console.error('Error parsing PM2 output:', stdout);
        reject(new Error(`Failed to parse PM2 output: ${err.message}`));
      }
    });
  });
}

export async function restartProcess(processId: number | string) {
  return new Promise((resolve, reject) => {
    exec(`pm2 restart ${processId}`, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ success: true, message: `Process ${processId} restarted successfully` });
      revalidatePath('/');
    });
  });
}

export async function getLogs(processId: number | string): Promise<LogData> {
  return new Promise((resolve, reject) => {
    exec(`pm2 logs ${processId} --lines 100 --nostream --raw`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({
        stdout: stdout.split('\n'),
        stderr: stderr.split('\n')
      });
    });
  });
}

export async function restartRemoteProcess(host: string, processId: string, sshKey?: string) {
  const sshCommand = `ssh ${sshKey ? `-i ${sshKey}` : ''} ${host} "pm2 restart ${processId}"`;
  
  return new Promise((resolve, reject) => {
    exec(sshCommand, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ 
        success: true,
        message: `Process ${processId} restarted on ${host}`,
        output: stdout
      });
    });
  });
}

export async function getMetrics(): Promise<{
  totalProcesses: number;
  running: number;
  errored: number;
  stopped: number;
  totalMemory: number;
  totalCPU: number;
}> {
  return new Promise((resolve, reject) => {
    exec('pm2 jlist', (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      
      try {
        const cleanedOutput = cleanPM2Output(stdout);
        const list = JSON.parse(cleanedOutput);
        
        const metrics = {
          totalProcesses: list.length,
          running: list.filter((p: any) => p.pm2_env?.status === 'online').length,
          errored: list.filter((p: any) => p.pm2_env?.status === 'errored').length,
          stopped: list.filter((p: any) => p.pm2_env?.status === 'stopped').length,
          totalMemory: list.reduce((acc: number, p: any) => acc + (p.monit?.memory || 0), 0),
          totalCPU: list.reduce((acc: number, p: any) => acc + (p.monit?.cpu || 0), 0),
        };
        resolve(metrics);
      } catch (err:any) {
        console.error('Error parsing PM2 output:', stdout);
        reject(new Error(`Failed to parse PM2 output: ${err.message}`));
      }
    });
  });
}