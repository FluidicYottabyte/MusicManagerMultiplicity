import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
    if (isAdminRoute && !req.nextauth.token?.isAdmin) {
      return NextResponse.redirect(new URL("/library", req.url));
    }
    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/login",
    },
    callbacks: {
      authorized: ({ token }) => token !== null,
    },
  }
);

// Every page/route in here requires a signed-in user. There is no
// self-registration route anywhere in this app — accounts are created by
// an admin via /admin/users or the one-time `npm run create-admin` script.
export const config = {
  matcher: [
    "/library/:path*",
    "/upload/:path*",
    "/settings/:path*",
    "/artists/:path*",
    "/albums/:path*",
    "/playlists/:path*",
    "/admin/:path*",
    "/api/stream/:path*",
    "/api/covers/:path*",
    "/api/playlist-covers/:path*",
    "/api/artist-photos/:path*",
    "/api/upload/:path*",
  ],
};
