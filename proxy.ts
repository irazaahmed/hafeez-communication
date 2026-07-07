import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";

/**
 * Next.js 16 route protection (proxy.ts replaces middleware.ts).
 *
 * Edge-safe: builds its own Auth.js instance from auth.config.ts only, so no
 * bcryptjs is bundled here. The `auth` wrapper decodes the session JWT and
 * exposes it on `req.auth`.
 *
 * Single-admin app: /admin/* requires the ADMIN session; there is no portal.
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const { pathname } = nextUrl;
  const isAdmin = req.auth?.user?.role === "ADMIN";

  // /admin/* → ADMIN only
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    return NextResponse.next();
  }

  // Already-authenticated admin has no business on /login
  if (pathname === "/login" && isAdmin) {
    return NextResponse.redirect(new URL("/admin", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
