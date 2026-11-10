import { NextRequest, NextResponse } from 'next/server';
import { submitSpotReportUseCase } from '@/application/container';
import { SubmitReportCommand } from '@/application/usecases/SubmitSpotReportUseCase';


export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SubmitReportCommand;

    if (!body.spotId || !body.photoUrl) {
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
