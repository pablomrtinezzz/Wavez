import { NextRequest, NextResponse } from 'next/server';
import { submitSpotReportUseCase } from '@/application/container';
import { ReportRateLimitError, SubmitReportCommand } from '@/application/usecases/SubmitSpotReportUseCase';
import { clientIp, createRateLimiter, hashedClientKey } from '@/infrastructure/http/rateLimit';

// Cheap per-instance guard against bursts; the real limit is enforced in the
// database by the use case, so it holds across all server instances.
const isBursting = createRateLimiter(10, 60 * 1000);

export async function POST(request: NextRequest) {
  if (isBursting(clientIp(request.headers))) {
    return NextResponse.json(
      { success: false, error: 'Has subido varias fotos seguidas. Espera unos minutos.' },
      { status: 429 }
    );
  }

  try {
    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > 2_000_000) {
      return NextResponse.json({ success: false, error: 'La foto es demasiado pesada' }, { status: 413 });
    }

    const body = (await request.json()) as SubmitReportCommand;

    if (!body || typeof body.spotId !== 'string' || !body.photoUrl) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios (spotId, photoUrl)' },
        { status: 400 }
      );
    }

    const report = await submitSpotReportUseCase.execute(body, await hashedClientKey(request.headers));

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    if (error instanceof ReportRateLimitError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 429 });
    }
    const message = (error as Error).message || 'Error al procesar el reporte';
    // Storage failures are not the user's fault and must not leak internals
    if (message.startsWith('Supabase:')) {
      console.error('API /api/reports storage error:', message);
      return NextResponse.json(
        { success: false, error: 'No se pudo guardar la foto ahora mismo. Inténtalo de nuevo en unos minutos.' },
        { status: 503 }
      );
    }
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
