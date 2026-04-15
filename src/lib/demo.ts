/**
 * Demo mode helpers.
 *
 * Two Vercel projects share this repo : a private one (DEMO_MODE unset/false)
 * for personal use, and a public one (DEMO_MODE=true) shown in job interviews.
 * In demo mode each visitor gets an isolated sandbox keyed by a cookie UUID :
 * they can add / edit / delete, but only see their own writes + the shared seed
 * (rows where demoSessionId IS NULL).
 */

import { cookies } from "next/headers";
import { randomUUID } from "crypto";

const COOKIE_NAME = "demo_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

/**
 * Returns the current visitor's demo session id, creating + persisting a new
 * UUID on the fly if needed. In private mode returns null.
 */
export async function getDemoSessionId(): Promise<string | null> {
  if (!isDemoMode()) return null;
  const jar = await cookies();
  const existing = jar.get(COOKIE_NAME)?.value;
  if (existing) return existing;

  const fresh = randomUUID();
  try {
    jar.set(COOKIE_NAME, fresh, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
  } catch {
    // cookies().set() throws in server components rendered during a GET.
    // Middleware sets the cookie instead — see middleware.ts.
  }
  return fresh;
}

/**
 * Prisma where clause that scopes reads to seed (NULL) + current visitor.
 * Private mode → empty object (no filtering).
 */
export async function demoFilter(): Promise<
  { OR: [{ demoSessionId: null }, { demoSessionId: string }] } | Record<string, never>
> {
  if (!isDemoMode()) return {};
  const sid = await getDemoSessionId();
  if (!sid) return {};
  return { OR: [{ demoSessionId: null }, { demoSessionId: sid }] };
}

/**
 * Prisma create payload fragment that stamps writes with the visitor's sid.
 * Private mode → { demoSessionId: null } (always NULL → seed/prod rows).
 */
export async function demoWriteData(): Promise<{ demoSessionId: string | null }> {
  if (!isDemoMode()) return { demoSessionId: null };
  const sid = await getDemoSessionId();
  return { demoSessionId: sid };
}

/**
 * Throws a 403-style error if the targeted row doesn't belong to the current
 * visitor. In private mode the check is a no-op.
 */
export class DemoForbiddenError extends Error {
  constructor(message = "Action non autorisée en mode démo.") {
    super(message);
    this.name = "DemoForbiddenError";
  }
}

export type DemoEntityLabel = "film" | "manga" | "peinture";

const SHARED_LABEL: Record<DemoEntityLabel, string> = {
  film: "Ce film fait partie du catalogue partagé et ne peut pas être modifié.",
  manga: "Ce manga fait partie du catalogue partagé et ne peut pas être modifié.",
  peinture: "Cette peinture fait partie du catalogue partagé et ne peut pas être modifiée.",
};

export async function assertDemoOwnership(
  rowDemoSessionId: string | null | undefined,
  entity: DemoEntityLabel = "film",
): Promise<void> {
  if (!isDemoMode()) return;
  const sid = await getDemoSessionId();
  // Seed row (NULL) → friendly "shared catalog" wording.
  if (rowDemoSessionId == null) {
    throw new DemoForbiddenError(SHARED_LABEL[entity]);
  }
  // Another visitor's row → generic forbidden.
  if (rowDemoSessionId !== sid) {
    throw new DemoForbiddenError();
  }
}

/**
 * Dedupe a list of rows by natural key, preferring the visitor's own row
 * (demoSessionId != null) over the shared seed (demoSessionId == null).
 *
 * Needed because in demo mode a visitor can "override" a seed row by adding
 * their own copy: reads then see both the seed and the visitor's row, which
 * would show duplicates in list views.
 */
export function dedupBySid<
  T extends { demoSessionId: string | null },
>(rows: T[], keyOf: (row: T) => string | number): T[] {
  const byKey = new Map<string | number, T>();
  for (const row of rows) {
    const k = keyOf(row);
    const current = byKey.get(k);
    if (!current || (current.demoSessionId == null && row.demoSessionId != null)) {
      byKey.set(k, row);
    }
  }
  return Array.from(byKey.values());
}
