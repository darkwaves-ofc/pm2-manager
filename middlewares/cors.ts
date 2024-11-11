import { NextRequest, NextResponse } from "next/server";

const corsOptions = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};
/**
 * Middleware function that handles CORS (Cross-Origin Resource Sharing) for the Next.js application.
 * 
 * This middleware function is responsible for setting the appropriate CORS headers in the response, including
 * the `Access-Control-Allow-Origin` header and any additional CORS options specified in the `corsOptions` object.
 * 
 * The middleware first checks if the request is a preflight request (i.e., an `OPTIONS` request), and if so, it
 * returns a JSON response with the preflight headers. For all other requests, it sets the CORS headers on the
 * response and returns the response.
 */
export default async function cors(request: NextRequest,response: NextResponse) {
  // Handle preflighted requests
  const isPreflight = request.method === "OPTIONS";

  if (isPreflight) {
    const preflightHeaders = {
      ...{ "Access-Control-Allow-Origin": "*" },
      ...corsOptions,
    };
    return NextResponse.json({}, { headers: preflightHeaders });
  }


  response.headers.set("Access-Control-Allow-Origin", "*");

  Object.entries(corsOptions).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}
