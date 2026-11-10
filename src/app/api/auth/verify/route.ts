import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { passkey } = await request.json();
    const expectedPasskey = process.env.APP_PASSKEY || 'grancanariasurf';

    if (passkey && passkey.trim() === expectedPasskey) {
      const response = NextResponse.json({ success: true, message: 'Acceso autorizado' });
      // Set secure cookie for 30 days
      response.cookies.set('wavez_session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      });
      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Clave de acceso privada incorrecta' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json({ success: false, error: 'Error de autenticación' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = request.cookies.get('wavez_session');
  return NextResponse.json({
    authenticated: Boolean(session && session.value === 'authenticated'),
  });
}
