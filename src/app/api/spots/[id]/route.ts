import { NextRequest, NextResponse } from 'next/server';
import { getSpotDetailUseCase } from '@/application/container';
import { MarineDataUnavailableError } from '@/domain/ports/MarineWeatherService';


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const detail = await getSpotDetailUseCase.execute(id);

    if (!detail) {
      return NextResponse.json(
        { success: false, error: 'Spot no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: detail,
    });
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith('NEXT_')) {
      throw error;
    }
    if (error instanceof MarineDataUnavailableError) {
      return NextResponse.json(
        { success: false, error: 'Open-Meteo no ofrece datos para este spot ahora mismo. Inténtalo en unos minutos.' },
        { status: 503 }
      );
    }
    console.error(`API /api/spots/[id] error:`, error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener detalle del spot' },
      { status: 500 }
    );
  }
}
