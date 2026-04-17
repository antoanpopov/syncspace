export { auth as proxy } from "@/lib/auth";

export const config = {
  matcher: [
    // Protect all app routes except auth, api, and static files
    "/((?!api|_next/static|_next/image|favicon.ico|sign-in|invite).*)",
  ],
};
