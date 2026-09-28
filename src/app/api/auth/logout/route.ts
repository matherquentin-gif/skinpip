import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

/**
 * Sign out: clear the session cookie and send the user home.
 *
 * POST only, and only from our own pages: a cross-site form that auto-submits
 * would otherwise still clear the cookie on its top-level navigation. 303
 * turns the form POST into a GET of the home page.
 */
export async function POST(req: NextRequest) {
  const fetchSite = req.headers.get("sec-fetch-site");
  const origin = req.headers.get("origin");
  // Modern browsers send Sec-Fetch-Site; fall back to Origin for older ones.
  const crossSite =
    fetchSite != null
      ? fetchSite !== "same-origin" && fetchSite !== "none"
      : origin != null && origin !== req.nextUrl.origin;
  if (crossSite) {
    return NextResponse.json({ error: "Cross-site request refused" }, { status: 403 });
  }

  const res = NextResponse.redirect(new URL("/", req.url), 303);
  clearSessionCookie(res);
  return res;
}
