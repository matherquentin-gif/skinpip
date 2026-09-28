/**
 * Steam OpenID 2.0 helpers shared by the login and callback routes.
 *
 * Two checks protect the callback:
 *
 * - `openid.return_to` must be exactly our callback URL, so a Steam login
 *   assertion issued to a different site can't be replayed here.
 * - That URL carries a one-time `state` that must match a cookie set when
 *   this browser started the login. Without it, an attacker could send a
 *   victim their own callback URL and sign the victim into the attacker's
 *   account (login CSRF), capturing anything the victim then deposits.
 */

import { randomBytes, timingSafeEqual } from "node:crypto";
import { appOrigin } from "@/lib/site";

export { appOrigin };

export const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";

/** Cookie holding the login `state`; scoped to the callback and short-lived. */
export const STEAM_STATE_COOKIE = "sp_steam_state";
export const STEAM_STATE_MAX_AGE = 60 * 10;

export function newSteamState(): string {
  return randomBytes(24).toString("base64url");
}

/** Where Steam sends the user back after login, carrying the login state. */
export function steamReturnUrl(state: string): string {
  return `${appOrigin()}/api/auth/steam/callback?state=${encodeURIComponent(state)}`;
}

/** Constant-time comparison of the state from the URL and from the cookie. */
export function statesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function stateCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // Lax still sends the cookie on Steam's top-level redirect back to us.
    sameSite: "lax" as const,
    path: "/api/auth/steam/callback",
    maxAge,
  };
}
