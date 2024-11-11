"use server";
import { revalidatePath } from "next/cache";
import { exec, spawn } from "child_process";
import Pusher from "pusher";

// Initialize Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

/**
 * Streams PM2 logs for a specific process through Pusher.
 *
 * @param {number|string} processId - The ID or name of the process to stream logs for
 * @param {string} channelName - The Pusher channel name to stream logs to
 * @returns {Promise<any>} A promise that resolves to the spawned process
 */
export async function streamLogsWithPusher(
  processId: number | string,
  channelName: string
) {
  return new Promise((resolve, reject) => {
    try {
      const pm2Process = spawn("pm2", [
        "logs",
        `${processId}`,
        "--raw",
        "--lines",
        "0",
      ]);

      // Handle stdout logs
      pm2Process.stdout.on("data", (data) => {
        pusher.trigger(channelName, "log-output", {
          type: "stdout",
          data: data.toString(),
          timestamp: new Date().toISOString(),
        });
      });

      // Handle stderr logs
      pm2Process.stderr.on("data", (data) => {
        pusher.trigger(channelName, "log-output", {
          type: "stderr",
          data: data.toString(),
          timestamp: new Date().toISOString(),
        });
      });

      pm2Process.on("error", (error) => {
        pusher.trigger(channelName, "log-error", {
          error: error.message,
          timestamp: new Date().toISOString(),
        });
        reject(error);
      });

      pm2Process.on("exit", (code) => {
        if (code !== 0) {
          pusher.trigger(channelName, "log-error", {
            error: `Process exited with code ${code}`,
            timestamp: new Date().toISOString(),
          });
          reject(new Error(`Process exited with code ${code}`));
        }
      });

      resolve(pm2Process);
    } catch (error) {
      reject(error);
    }
  });
}

export async function handleLogStreamRequest({
  processId,
}: {
  processId: number | string;
}) {
  const channelName = `pm2-logs-${processId}`;

  try {
    // Start streaming logs
    await streamLogsWithPusher(processId, channelName);

    // Store the process reference somewhere if you need to stop it later
    // For example, you could store it in a Map using the channelName as a key

    return {
      success: true,
      channel: channelName,
      message: "Log streaming started",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Stops the log stream
 * @param {any} process - The process returned by streamLogsWithPusher
 * @param {string} channelName - The Pusher channel name to trigger the stop event on
 */
export async function stopLogStream(process: any, channelName: string) {
  if (process && typeof process.kill === "function") {
    // Notify clients that the stream is stopping
    await pusher.trigger(channelName, "log-stopped", {
      message: "Log streaming stopped",
      timestamp: new Date().toISOString(),
    });

    process.kill();
  }
}
