import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/pricing",
  "/forgetPassword",
  "/resetCode",
  "/resetPassword",
  "/2fa",
  "/legal/terms",
  "/legal/privacy",
  "/invite",
  "/store",
  "/trial-ended",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const useApi = process.env.NEXT_PUBLIC_REQUIRE_AUTH === "true";

  if (!useApi) return NextResponse.next();

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (isPublic) return NextResponse.next();

  const token = request.cookies.get("accessToken")?.value;
  const refresh = request.cookies.get("refreshToken")?.value;
  if (!token && !refresh) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|assets).*)"],
};
