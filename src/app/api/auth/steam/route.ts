import { NextResponse } from "next/server";
import {
  STEAM_OPENID_URL,
  STEAM_STATE_COOKIE,
  STEAM_STATE_MAX_AGE,
  appOrigin,
  newSteamState,
  stateCookieOptions,
  steamReturnUrl,
} from "@/lib/steam-openid";

export async function GET() {
  const state = newSteamState();
  const params = new URLSearchParams({
    "openid.ns":         "http://specs.openid.net/auth/2.0",
    "openid.mode":       "checkid_setup",
    "openid.return_to":  steamReturnUrl(state),
    "openid.realm":      appOrigin(),
    "openid.identity":   "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });

  const res = NextResponse.redirect(`${STEAM_OPENID_URL}?${params}`);
  res.cookies.set(STEAM_STATE_COOKIE, state, stateCookieOptions(STEAM_STATE_MAX_AGE));
  return res;
}
