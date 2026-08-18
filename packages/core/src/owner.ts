/**
 * Owner write-gate.
 *
 * In private mode (DEMO_MODE !== "true"), if OWNER_PASSWORD is set, all
 * mutating API routes require the visitor to hold a valid `owner_session`
 * cookie — i.e. to have logged in via /login. Reads remain public; a random
 * visitor who stumbles on the URL can browse but not break anything.
 *
 * Stateless: the cookie stores sha256(OWNER_PASSWORD) at login time.
 * Rotation = change OWNER_PASSWORD → every existing cookie becomes invalid
 * automatically. No sessions table, no NextAuth, no dep.
 *
 * Skipped entirely in demo mode (visitors need writes for their sandbox) and
 * when OWNER_PASSWORD is unset (local dev).
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { isDemoMode } from "./demo";

const COOKIE_NAME = "owner_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/** True when a request should be gated by the owner cookie. */
export function isOwnerGateEnabled(): boolean {
  if (isDemoMode()) return false;
  return !!process.env.OWNER_PASSWORD;
}

/** The canonical token = sha256 of the current env password. */
export function getOwnerTokenFromEnv(): string {
  const pw = process.env.OWNER_PASSWORD;
  if (!pw) throw new Error("OWNER_PASSWORD not set");
  return sha256Hex(pw);
}

export async function isOwnerAuthenticated(): Promise<boolean> {
  if (!isOwnerGateEnabled()) return true;
  const jar = await cookies();
  const cookieToken = jar.get(COOKIE_NAME)?.value;
  if (!cookieToken) return false;

  const expected = getOwnerTokenFromEnv();
  // Constant-time compare: equal-length buffers only.
  if (cookieToken.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(cookieToken), Buffer.from(expected));
  } catch {
    return false;
  }
}

export class OwnerForbiddenError extends Error {
  constructor(message = "Owner authentication required") {
    super(message);
    this.name = "OwnerForbiddenError";
  }
}

export async function requireOwnerWrite(): Promise<void> {
  if (!isOwnerGateEnabled()) return;
  const authed = await isOwnerAuthenticated();
  if (!authed) throw new OwnerForbiddenError();
}

/**
 * Compact helper for route handlers: returns a 401 NextResponse if the
 * visitor is not the owner, or null if the request can proceed. Lets route
 * handlers stay flat instead of wrapping every mutation in try/catch.
 */
export async function ownerGateResponse(): Promise<NextResponse | null> {
  if (await isOwnerAuthenticated()) return null;
  return NextResponse.json(
    { error: "Authentication required" },
    { status: 401 },
  );
}

/** Set the owner cookie (called from /api/auth/login on successful match). */
export async function setOwnerCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, getOwnerTokenFromEnv(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function clearOwnerCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

/** Constant-time password check against the env var. */
export function verifyOwnerPassword(candidate: string): boolean {
  const expected = process.env.OWNER_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(sha256Hex(candidate));
  const b = Buffer.from(sha256Hex(expected));
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
