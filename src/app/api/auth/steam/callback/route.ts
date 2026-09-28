import { NextRequest, NextResponse } from "next/server";
import { upsertSteamUser, createSessionToken, setSessionCookie } from "@/lib/auth";
import {
  STEAM_OPENID_URL,
  STEAM_STATE_COOKIE,
  stateCookieOptions,
  statesMatch,
  steamReturnUrl,
} from "@/lib/steam-openid";

const STEAM_ID_PATTERN = /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/;

/** Fields that must be covered by Steam's signature before we trust them. */
const REQUIRED_SIGNED_FIELDS = ["claimed_id", "identity", "return_to", "op_endpoint"];

function fail(req: NextRequest, reason: "failed" | "invalid" | "error") {
  const res = NextResponse.redirect(new URL(`/?auth=${reason}`, req.url));
  // The state is single-use whatever the outcome.
  res.cookies.set(STEAM_STATE_COOKIE, "", stateCookieOptions(0));
  return res;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Only accept a positive assertion.
  if (searchParams.get("openid.mode") !== "id_res") return fail(req, "failed");

  // The login must have been started by this browser (see steam-openid.ts).
  const state = searchParams.get("state");
  if (!statesMatch(state, req.cookies.get(STEAM_STATE_COOKIE)?.value)) {
    return fail(req, "invalid");
  }

  // Extract the claimed Steam ID.
  const claimedId = searchParams.get("openid.claimed_id") ?? "";
  const match = STEAM_ID_PATTERN.exec(claimedId);
  if (!match || searchParams.get("openid.identity") !== claimedId) {
    return fail(req, "failed");
  }

  // The assertion must have been issued by Steam, to us. Checking return_to
  // stops an assertion minted for another site (which Steam would still report
  // as valid) from being replayed here to log in as that Steam account.
  if (
    searchParams.get("openid.op_endpoint") !== STEAM_OPENID_URL ||
    searchParams.get("openid.return_to") !== steamReturnUrl(state!)
  ) {
    return fail(req, "invalid");
  }

  // Every field we rely on MUST be one Steam actually signed. Otherwise an
  // attacker could keep a valid signature over a different field set and swap
  // in other values. `openid.signed` lists the signed field names (without
  // the "openid." prefix).
  const signedFields = (searchParams.get("openid.signed") ?? "").split(",");
  if (!REQUIRED_SIGNED_FIELDS.every((f) => signedFields.includes(f))) {
    return fail(req, "invalid");
  }

  // Confirm with Steam that the assertion is valid. The verification POST goes
  // to the hardcoded Steam endpoint (never one taken from the response), so a
  // forged op_endpoint can't redirect verification to an attacker server.
  // Only the openid.* fields are sent; `state` is ours.
  const verifyParams = new URLSearchParams(
    [...searchParams].filter(([k]) => k.startsWith("openid.")),
  );
  verifyParams.set("openid.mode", "check_authentication");

  let verifyText: string;
  try {
    const verifyRes = await fetch(STEAM_OPENID_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: verifyParams.toString(),
      signal: AbortSignal.timeout(10_000),
    });
    verifyText = await verifyRes.text();
  } catch (err) {
    console.error("[steam callback] verification request failed:", (err as Error).message);
    return fail(req, "error");
  }

  // Parse the key:value response strictly: require an exact `is_valid:true`
  // line rather than a loose substring match.
  const isValid = verifyText
    .split("\n")
    .some((line) => line.trim() === "is_valid:true");
  if (!isValid) return fail(req, "invalid");

  const steamId = match[1];

  let token: string;
  try {
    // Upsert the user (creating their wallet on first login), then sign a session.
    const user = await upsertSteamUser(steamId);
    if (user.isBanned) return fail(req, "invalid");
    token = await createSessionToken(user.id);
  } catch (err) {
    console.error("[steam callback] sign-in failed:", (err as Error).message);
    return fail(req, "error");
  }

  // Build the redirect response and attach the session cookie.
  const response = NextResponse.redirect(new URL("/inventory", req.url));
  setSessionCookie(response, token);
  response.cookies.set(STEAM_STATE_COOKIE, "", stateCookieOptions(0));

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
