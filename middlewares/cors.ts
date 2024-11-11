import { NextRequest, NextResponse } from "next/server";

const corsOptions = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};
export default async function cors(request: NextRequest) {
  // Handle preflighted requests
  // console.log("Cors Middleware reacheed");
  const isPreflight = request.method === "OPTIONS";

  if (isPreflight) {
    const preflightHeaders = {
      ...{ "Access-Control-Allow-Origin": "*" },
      ...corsOptions,
    };
    return NextResponse.json({}, { headers: preflightHeaders });
  }

  // Handle simple requests
  const response = NextResponse.next();

  response.headers.set("Access-Control-Allow-Origin", "*");

  Object.entries(corsOptions).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}
