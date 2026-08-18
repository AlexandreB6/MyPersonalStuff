/**
 * Next 16 proxy (ex-middleware) partagé : en mode démo, garantit que chaque
 * visiteur possède un cookie `demo_session` avant l'exécution du moindre
 * server component. Ceux-ci ne peuvent pas écrire de cookie au rendu, on le
 * pose donc ici, dès la première requête.
 *
 *   // apps/<app>/src/proxy.ts
 *   export const proxy = createDemoProxy();
 *   export const config = { matcher: […] };  // littéral statique exigé par Next
 */

import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "demo_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function createDemoProxy() {
  return function proxy(req: NextRequest) {
    if (process.env.DEMO_MODE !== "true") return NextResponse.next();

    if (req.cookies.get(COOKIE_NAME)) return NextResponse.next();

    const sid = crypto.randomUUID();
    const res = NextResponse.next();
    res.cookies.set(COOKIE_NAME, sid, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
    // Expose aussi au request sortant pour que les RSC de cette même passe le lisent.
    req.cookies.set(COOKIE_NAME, sid);
    return res;
  };
}
