import { NextRequest, NextResponse } from 'next/server';
import { isIslandId } from '@/domain/models/Island';
import { ALL_SPOTS } from '@/infrastructure/spots';

const SPOT_SLUGS = new Set(ALL_SPOTS.map((s) => s.slug));

/**
 * Answers a real 404 for islands and spots that do not exist. The pages are
 * partially prerendered, so their static shell would otherwise go out with a
 * 200 before the page itself decides the value is unknown.
 */
export function proxy(request: NextRequest) {
  const segments = request.nextUrl.pathname.split('/').filter(Boolean);
  const unknownIsland = segments.length === 1 && !isIslandId(segments[0]);
  const unknownSpot = segments.length === 2 && segments[0] === 'spots' && !SPOT_SLUGS.has(segments[1]);
  if (unknownIsland || unknownSpot) {
    return NextResponse.rewrite(new URL('/_not-found', request.url), { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  // Page paths only: no API routes, Next.js assets or files with an extension
  matcher: ['/((?!api/|_next/|_vercel/|.*\\.[a-z0-9]+$).+)'],
};
