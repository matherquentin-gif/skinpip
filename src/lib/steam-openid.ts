/**
 * Steam OpenID 2.0 constants shared by the login and callback routes.
 *
 * The login route and the callback MUST agree on the return URL: the callback
 * rejects any assertion whose signed `openid.return_to` is not exactly ours.
 * Without that check, a Steam login assertion issued to a different site could
 * be replayed against SkinPip to sign in as that Steam account.
 */

import { appOrigin } from "@/lib/site";

export { appOrigin };

export const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";

/** Where Steam sends the user back after login. */
export function steamReturnUrl(): string {
  return `${appOrigin()}/api/auth/steam/callback`;
}
