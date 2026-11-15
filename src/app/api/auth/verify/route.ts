import { NextRequest, NextResponse } from 'next/server';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_S,
  createSessionToken,
  getExpectedPasskey,
  safeEqual,
  verifySessionToken,
} from '@/infrastructure/auth/session';

// Basic brute-force protection: a few attempts per IP and minute (per instance)
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { success: false, error: 'Demasiados intentos. Espera un minuto.' },
      { status: 429 }
    );
  }

  const expectedPasskey = getExpectedPasskey();
  if (!expectedPasskey) {
    console.error('APP_PASSKEY is not configured; refusing logins in production.');
    return NextResponse.json(
      { success: false, error: 'Acceso no configurado en el servidor' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const passkey = typeof body?.passkey === 'string' ? body.passkey.trim() : '';

    if (passkey && (await safeEqual(passkey, expectedPasskey))) {
      const token = await createSessionToken();
      const response = NextResponse.json({ success: true, message: 'Acceso autorizado' });
      response.cookies.set(SESSION_COOKIE, token!, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE_S,
        path: '/',
      });
      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Clave de acceso incorrecta' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json({ success: false, error: 'Error de autenticación' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return NextResponse.json({ authenticated: await verifySessionToken(token) });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
