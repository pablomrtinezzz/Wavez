import { NextRequest, NextResponse } from 'next/server';
import { getSpotHourlyEvolutionUseCase } from '@/application/container';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dateParam = request.nextUrl.searchParams.get('date');
    const todayStr = new Date().toISOString().split('T')[0];
    const targetDate = dateParam || todayStr;

    const timeline = await getSpotHourlyEvolutionUseCase.execute(id, targetDate);

    if (!timeline) {
      return NextResponse.json(
        { success: false, error: 'No se encontraron datos horarios para el spot en esta fecha' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: timeline,
    });
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith('NEXT_')) {
      throw error;
    }
    console.error(`API /api/spots/[id]/timeline error:`, error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener evolución horaria' },
      { status: 500 }
    );
  }
}
