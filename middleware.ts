import { NextResponse, type NextRequest } from "next/server";

// Opt-in shared-password gate. With APP_PASSWORD unset the app is open, which
// is what you want locally; set it in Vercel before the URL is reachable.
const COOKIE = "spanish_auth";

export function middleware(request: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next();

  if (request.cookies.get(COOKIE)?.value === password) {
    return NextResponse.next();
  }

  const supplied = request.nextUrl.searchParams.get("p");
  if (supplied === password) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("p");
    const response = NextResponse.redirect(url);
    response.cookies.set(COOKIE, password, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  }

  return new NextResponse("No autorizado", { status: 401 });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
