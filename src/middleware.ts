import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// This is a basic pass-through middleware.
// If Clerk was the only reason for this middleware, 
// and no other global request processing is needed,
// this file could potentially be removed, or you can add other middleware logic here.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // This default matcher from Next.js is usually a good starting point.
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
