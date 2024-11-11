import { NextRequest, NextResponse } from "next/server";
import cors from "./middlewares/cors";
export async function middleware(request: NextRequest) {
  let response = NextResponse.next();
  const middlewareArray = [cors];
  for (const middleware of middlewareArray) {
    await middleware(request, response);
  }
  return response;
}

export const config = {
  matcher: '/:path*', // This will match all routes in the app
};