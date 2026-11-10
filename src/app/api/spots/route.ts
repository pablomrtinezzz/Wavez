import { NextRequest, NextResponse } from 'next/server';
import { getSpotsWithForecastUseCase } from '@/application/container';
import { ZoneId } from '@/domain/models/Spot';


export async function GET(request: NextRequest) {
  try {
    const zone = request.nextUrl.searchParams.get('zone') as ZoneId | null;

    const spots = await getSpotsWithForecastUseCase.execute(zone || undefined);

    // Sort by overallScore descending (best conditions first)
    const sorted = [...spots].sort((a, b) => b.score.overallScore - a.score.overallScore);

    return NextResponse.json({
      success: true,
      data: sorted,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith('NEXT_')) {
      throw error;
    }
    console.error('API /api/spots error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener condiciones de los spots' },
      { status: 500 }
    );
  }
}
