// app/restart/page.tsx

"use client";

import { Button } from "@/components/ui/button";
import axios from "axios";
import { useState } from "react";

export default function RestartService() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleRestart = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await axios.get(
        "https://pm2-manager.noerror.studio/api/restart/8",
        {
          method: "GET",
        }
      );
      console.log(response);

      if (!response.data) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.data.json();
      setMessage(data.message || "Service restarted successfully.");
    } catch (error: any) {
      setMessage(error.message || "Failed to restart service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-semibold mb-4">Restart Service</h1>
      <Button onClick={handleRestart} disabled={loading}>
        {loading ? "Restarting..." : "Restart Service"}
      </Button>
      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
}
