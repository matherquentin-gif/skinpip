/**
 * Session management for SkinPip.
 *
 * Authentication flow:
 *   1. User authenticates via Steam OpenID.
 *   2. Callback calls upsertSteamUser() → gets/creates a User row.
 *   3. createSessionToken(user.id) returns a signed JWT.
 *   4. The JWT is stored in an httpOnly cookie named "sp_session".
 *   5. Subsequent requests use getUser() / requireUser() to resolve the caller.
 *
 * The SESSION_SECRET env var must be at least 32 characters.
 */

import { SignJWT, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import type { User } from "@prisma/client";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SESSION_COOKIE = "sp_session";
const SESSION_ALGORITHM = "HS256";
const SESSION_ISSUER = "skinpip";
const SESSION_AUDIENCE = "skinpip";
/** 7 days in seconds */
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

// ---------------------------------------------------------------------------
// Key helpers
// ---------------------------------------------------------------------------

function getSigningKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET env var is missing or shorter than 32 characters"
    );
  }
  return new TextEncoder().encode(secret);
}

// ---------------------------------------------------------------------------
// Token creation / verification
// ---------------------------------------------------------------------------

/**
 * Create a signed session JWT for the given userId.
 * Returns the compact JWT string synchronously by wrapping the async SignJWT.
 *
 * NOTE: This function is intentionally made sync-compatible by callers — but
 * jose's sign() is async, so use `await createSessionTokenAsync()` internally
 * and expose a thin sync wrapper only where the runtime allows it.
 *
 * In Next.js Route Handlers (all async), use await.
 */
export async function createSessionToken(userId: string): Promise<string> {
  const key = getSigningKey();
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: SESSION_ALGORITHM })
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key);
}

/**
 * Verify a session token and return the userId, or null if invalid/expired.
 */
export async function verifySessionToken(
  token: string
): Promise<{ userId: string } | null> {
  try {
    const key = getSigningKey();
    const { payload } = await jwtVerify(token, key, {
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE,
      algorithms: [SESSION_ALGORITHM],
    });

    const userId = payload.sub;
    if (typeof userId !== "string" || !userId) return null;

    return { userId };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

/** Build the cookie options shared between set and delete operations. */
function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/**
 * Attach the session cookie to a NextResponse.
 * Call this after creating a token in a Route Handler.
 */
export function setSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set(SESSION_COOKIE, token, cookieOptions(SESSION_MAX_AGE));
}

/**
 * Clear the session cookie (logout).
 */
export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, "", cookieOptions(0));
}

// ---------------------------------------------------------------------------
// Request resolution
// ---------------------------------------------------------------------------

/**
 * Extract and verify the session token from the incoming request.
 * Returns the User row, or null if the session is absent or invalid.
 */
export async function getUser(req: NextRequest): Promise<User | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const user = await db.user.findUnique({ where: { id: payload.userId } });
  return user ?? null;
}

/**
 * Like getUser(), but throws a 401 NextResponse if no valid session exists.
 * Designed for use in Route Handlers. Throw the response to exit the handler:
 *
 *   const user = await requireUser(req).catch((r) => { return r as NextResponse; });
 *
 * Or use the try/catch pattern:
 *   try {
 *     const user = await requireUser(req);
 *   } catch (e) {
 *     if (e instanceof NextResponse) return e;
 *     throw e;
 *   }
 *
 * This is a deliberate throw-response pattern so the call site reads as a
 * single line — the thrown NextResponse propagates up through the route handler.
 */
export async function requireUser(req: NextRequest): Promise<User> {
  const user = await getUser(req);
  if (!user) {
    // Throwing a NextResponse is intentional — callers catch it at the handler
    // boundary and return it directly.
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}

// ---------------------------------------------------------------------------
// User upsert after Steam OpenID verification
// ---------------------------------------------------------------------------

export interface SteamProfileData {
  avatarUrl?: string;
  displayName?: string;
}

/**
 * Upsert a User row from a verified Steam OpenID login.
 * Creates the WalletAccount at the same time if this is a new user.
 */
export async function upsertSteamUser(
  steamId: string,
  profileData?: SteamProfileData
): Promise<User> {
  const { avatarUrl, displayName } = profileData ?? {};

  const user = await db.user.upsert({
    where: { steamId },
    create: {
      steamId,
      displayName: displayName ?? steamId,
      avatarUrl: avatarUrl ?? null,
      wallet: {
        create: {
          balancePips: 0n,
          reservedPips: 0n,
        },
      },
    },
    update: {
      ...(displayName ? { displayName } : {}),
      ...(avatarUrl ? { avatarUrl } : {}),
      updatedAt: new Date(),
    },
  });

  return user;
}
