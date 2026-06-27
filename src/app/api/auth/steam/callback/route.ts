import { NextRequest, NextResponse } from "next/server";
import { upsertSteamUser, createSessionToken, setSessionCookie, SESSION_COOKIE } from "@/lib/auth";

const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
const STEAM_ID_PATTERN = /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Only accept a positive assertion.
  if (searchParams.get("openid.mode") !== "id_res") {
    return NextResponse.redirect(new URL("/?auth=failed", req.url));
  }

  // Extract the claimed Steam ID.
  const claimedId = searchParams.get("openid.claimed_id") ?? "";
  const match = STEAM_ID_PATTERN.exec(claimedId);
  if (!match) {
    return NextResponse.redirect(new URL("/?auth=failed", req.url));
  }

  // Defence-in-depth: the steamid we trust (claimed_id) MUST be one of the
  // fields Steam actually signed. Otherwise an attacker could keep a valid
  // signature over a different field set and swap in a victim's claimed_id —
  // check_authentication would still report is_valid:true. `openid.signed` is a
  // comma-separated list of the signed field names (without the "openid." prefix).
  const signedFields = (searchParams.get("openid.signed") ?? "").split(",");
  if (!signedFields.includes("claimed_id") || !signedFields.includes("identity")) {
    return NextResponse.redirect(new URL("/?auth=invalid", req.url));
  }

  // Confirm with Steam that the assertion is valid. The verification POST goes
  // to the hardcoded Steam endpoint (never one taken from the response), so a
  // forged op_endpoint can't redirect verification to an attacker server.
  const verifyParams = new URLSearchParams(Object.fromEntries(searchParams));
  verifyParams.set("openid.mode", "check_authentication");

  const verifyRes = await fetch(STEAM_OPENID_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: verifyParams.toString(),
  });

  // Parse the key:value response strictly — require an exact `is_valid:true`
  // line rather than a loose substring match.
  const verifyText = await verifyRes.text();
  const isValid = verifyText
    .split("\n")
    .some((line) => line.trim() === "is_valid:true");
  if (!isValid) {
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
