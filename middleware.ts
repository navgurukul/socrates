import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Lightweight optimistic auth gate. Better Auth manages session lifecycle and
// refresh on its own (via /api/auth/*), so middleware only does a fast cookie
// presence check to keep unauthenticated users out of protected sections.
// Authoritative checks still happen server-side via getCurrentUser().
const PROTECTED_PREFIXES = ["/profile", "/versus", "/leaderboard"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (!isProtected) return NextResponse.next();

  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (Better Auth endpoints)
     * - _next/static, _next/image (build assets)
     * - favicon.ico and image files
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
