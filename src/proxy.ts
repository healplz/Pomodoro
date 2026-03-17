export { auth as proxy } from "@/auth";

export const config = {
  matcher: [
    // Protect all routes except sign-in, auth API, static assets, and root
    "/((?!sign-in|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
