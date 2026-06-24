import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
const STEAM_ID_PATTERN = /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Verify the OpenID response
  const claimedId = searchParams.get("openid.claimed_id") ?? "";
  const match = STEAM_ID_PATTERN.exec(claimedId);
  if (!match) {
    return NextResponse.redirect(new URL("/?auth=failed", req.url));
  }

  // Verify with Steam (check_authentication)
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

  // TODO: upsert user in DB, create wallet, create signed session cookie
  // const user = await db.user.upsert({
  //   where: { steamId },
  //   update: { updatedAt: new Date() },
  //   create: { steamId, displayName: steamId, wallet: { create: {} } },
  // });
  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set("session_steam_id", steamId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return NextResponse.redirect(new URL("/inventory", req.url));
}
