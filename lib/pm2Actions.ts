"use server"
import { revalidatePath } from "next/cache";
import { exec, spawn } from 'child_process';

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

// Helper function to extract valid JSON from PM2 output
function extractJSON(output: string): any {
  try {
    // Find the first '[' and last ']' to extract the JSON array
    const start = output.indexOf('[');
    const end = output.lastIndexOf(']') + 1;
    
    if (start === -1 || end === 0) {
      throw new Error('No JSON array found in output');
    }
    
    const jsonStr = output.substring(start, end);
    return JSON.parse(jsonStr);
  } catch (error:any) {
    console.error('Raw PM2 output:', output);
    throw new Error(`Failed to extract JSON from PM2 output: ${error.message}`);
  }
}

// Server Actions
export async function listProcesses(): Promise<ProcessInfo[]> {
  return new Promise((resolve, reject) => {
    // Using --raw to get cleaner output
    exec('pm2 jlist', (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      
      try {
        const list = extractJSON(stdout);
        const processes = list.map((process: any) => ({
          name: process.name || '',
          id: process.pm_id || 0,
          status: process.pm2_env?.status || 'unknown',
          cpu: process.monit?.cpu || 0,
          memory: process.monit?.memory || 0,
          uptime: process.pm2_env?.pm_uptime || 0,
        }));
        resolve(processes);
      } catch (err) {
        console.error('Error processing PM2 output:', err);
        reject(err);
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
    exec(`pm2 logs ${processId} --lines 100 --nostream`, (error, stdout, stderr) => {
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
    // Using --raw to get cleaner output
    exec('pm2 jlist', (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      
      try {
        const list = extractJSON(stdout);
        const metrics = {
          totalProcesses: list.length,
          running: list.filter((p: any) => p.pm2_env?.status === 'online').length,
          errored: list.filter((p: any) => p.pm2_env?.status === 'errored').length,
          stopped: list.filter((p: any) => p.pm2_env?.status === 'stopped').length,
          totalMemory: list.reduce((acc: number, p: any) => acc + (p.monit?.memory || 0), 0),
          totalCPU: list.reduce((acc: number, p: any) => acc + (p.monit?.cpu || 0), 0),
        };
        resolve(metrics);
      } catch (err) {
        console.error('Error processing PM2 output:', err);
        reject(err);
      }
    });
  });
}

// Add this new function for real-time logs
export async function streamLogs(processId: number | string, onData: (data: { type: 'stdout' | 'stderr', data: string }) => void) {
    return new Promise((resolve, reject) => {
      try {
        // Using spawn instead of exec to handle streaming data
        const pm2Process = spawn('pm2', ['logs', `${processId}`, '--raw', '--lines', '0']);
        
        pm2Process.stdout.on('data', (data) => {
          onData({
            type: 'stdout',
            data: data.toString()
          });
        });
  
        pm2Process.stderr.on('data', (data) => {
          onData({
            type: 'stderr',
            data: data.toString()
          });
        });
  
        pm2Process.on('error', (error) => {
          reject(error);
        });
  
        // Optional: Handle process exit
        pm2Process.on('exit', (code) => {
          if (code !== 0) {
            reject(new Error(`Process exited with code ${code}`));
          }
        });
  
        // Return the process so it can be killed later if needed
        resolve(pm2Process);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  // Helper function to kill the log stream
  export async function stopLogStream(process: any) {
    if (process && typeof process.kill === 'function') {
      process.kill();
    }
  }