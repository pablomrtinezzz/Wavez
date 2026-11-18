import { NextRequest, NextResponse } from 'next/server';
import { isUnknownPagePath } from '@/presentation/lib/routes';

/**
 * Answers a real 404 for islands and spots that do not exist. The pages are
 * partially prerendered, so their static shell would otherwise go out with a
 * 200 before the page itself decides the value is unknown.
 */
export function proxy(request: NextRequest) {
  if (isUnknownPagePath(request.nextUrl.pathname)) {
    return NextResponse.rewrite(new URL('/_not-found', request.url), { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  // Page paths only: no API routes, Next.js assets or files with an extension
  matcher: ['/((?!api/|_next/|_vercel/|.*\\.[a-z0-9]+$).+)'],
};
