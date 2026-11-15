import { NextRequest, NextResponse } from 'next/server';
import { submitSpotReportUseCase } from '@/application/container';
import { SubmitReportCommand } from '@/application/usecases/SubmitSpotReportUseCase';
import { clientIp, createRateLimiter } from '@/infrastructure/http/rateLimit';

// Public endpoint: at most a handful of photos per person and 10 minutes
const isRateLimited = createRateLimiter(5, 10 * 60 * 1000);


export async function POST(request: NextRequest) {
  if (isRateLimited(clientIp(request.headers))) {
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

    const report = await submitSpotReportUseCase.execute(body);

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    const message = (error as Error).message || 'Error al procesar el reporte';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
