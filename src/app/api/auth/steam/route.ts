import { NextRequest, NextResponse } from "next/server";

const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
const RETURN_URL = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/auth/steam/callback`;

export async function GET(_req: NextRequest) {
  const params = new URLSearchParams({
    "openid.ns":         "http://specs.openid.net/auth/2.0",
    "openid.mode":       "checkid_setup",
    "openid.return_to":  RETURN_URL,
    "openid.realm":      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    "openid.identity":   "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });

  return NextResponse.redirect(`${STEAM_OPENID_URL}?${params}`);
}
