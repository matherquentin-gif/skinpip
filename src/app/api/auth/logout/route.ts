import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

/**
 * Sign out: clear the session cookie and send the user home.
 *
 * POST only, so a cross-site <img> or link can't log people out. 303 turns the
 * form POST into a GET of the home page.
 */
export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/", req.url), 303);
  clearSessionCookie(res);
  return res;
}
