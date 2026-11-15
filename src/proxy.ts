import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/infrastructure/auth/session';

/**
 * The access gate used to be purely client-side: every /api route answered
 * without a session. Require a valid signed session for the data API.
 */
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (await verifySessionToken(token)) return NextResponse.next();

  return NextResponse.json({ success: false, error: 'Sesión no válida o caducada' }, { status: 401 });
}

export const config = {
  // Everything under /api except the auth endpoint itself
  matcher: ['/api/((?!auth/).*)'],
};
