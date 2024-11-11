import { NextRequest, NextResponse } from "next/server";


/**
 * Middleware function that extracts the user's IP address from the request headers and sets it in the response headers.
 *
 * @param request - The incoming Next.js request object.
 * @param response - The Next.js response object to be modified.
 * @returns The modified response object with the user's IP address set in the headers.
 */
export default async function ip(request: NextRequest, response: NextResponse) {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || request.ip;

    response.headers.set('x-user-ip', ip || 'Unknown IP');

    return response;
}
