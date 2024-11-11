// app/api/restart/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { restartProcess } from "@/lib/pm2Actions";

interface ResponseData {
  success: boolean;
  message: string;
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Extract the `id` parameter from the URL
    const id = req.nextUrl.pathname.split("/").pop();
    console.log(id);
    // Validate process ID
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or missing Process ID",
        },
        { status: 400 }
      );
    }

    // Restart the process
    await restartProcess(id);

    return NextResponse.json(
      {
        success: true,
        message: `Successfully restarted process ${id}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error restarting process:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
