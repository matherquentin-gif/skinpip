import { NextRequest, NextResponse } from "next/server";
import { upsertSteamUser, createSessionToken, setSessionCookie, SESSION_COOKIE } from "@/lib/auth";

const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
const STEAM_ID_PATTERN = /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Verify the OpenID response — extract the claimed Steam ID.
  const claimedId = searchParams.get("openid.claimed_id") ?? "";
  const match = STEAM_ID_PATTERN.exec(claimedId);
  if (!match) {
    return NextResponse.redirect(new URL("/?auth=failed", req.url));
  }

  // Confirm with Steam that the assertion is valid.
  const verifyParams = new URLSearchParams(Object.fromEntries(searchParams));
  verifyParams.set("openid.mode", "check_authentication");

  const verifyRes = await fetch(STEAM_OPENID_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: verifyParams.toString(),
  });

  const verifyText = await verifyRes.text();
  if (!verifyText.includes("is_valid:true")) {
    return NextResponse.redirect(new URL("/?auth=invalid", req.url));
  }

  const steamId = match[1];

  // Upsert the user and create/verify their wallet.
  const user = await upsertSteamUser(steamId);

  // Issue a signed JWT session token.
  const token = await createSessionToken(user.id);

  // Build the redirect response and attach the session cookie.
  const response = NextResponse.redirect(new URL("/inventory", req.url));
  setSessionCookie(response, token);

  // Remove the legacy raw-steamId cookie if it is still present.
  response.cookies.set("session_steam_id", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
