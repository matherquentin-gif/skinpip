import { NextResponse } from "next/server";
import { STEAM_OPENID_URL, appOrigin, steamReturnUrl } from "@/lib/steam-openid";

export async function GET() {
  const params = new URLSearchParams({
    "openid.ns":         "http://specs.openid.net/auth/2.0",
    "openid.mode":       "checkid_setup",
    "openid.return_to":  steamReturnUrl(),
    "openid.realm":      appOrigin(),
    "openid.identity":   "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });

  return NextResponse.redirect(`${STEAM_OPENID_URL}?${params}`);
}
