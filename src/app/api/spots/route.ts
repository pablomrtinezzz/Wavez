import { NextRequest, NextResponse } from 'next/server';
import { getSpotsWithForecastUseCase } from '@/application/container';
import { ZoneId } from '@/domain/models/Spot';

export async function GET(request: NextRequest) {
  try {
    const zone = request.nextUrl.searchParams.get('zone') as ZoneId | null;
    const date = request.nextUrl.searchParams.get('date'); // 'YYYY-MM-DD'
    const hour = request.nextUrl.searchParams.get('hour'); // '00' to '23'

    let targetIso: string | undefined = undefined;
    if (date) {
      const parsedHour = hour ? String(parseInt(hour, 10)).padStart(2, '0') : '12';
      targetIso = `${date}T${parsedHour}:00:00`;
    }

    const spots = await getSpotsWithForecastUseCase.execute(zone || undefined, targetIso);

    // Sort by overallScore descending (best conditions first)
    const sorted = [...spots].sort((a, b) => b.score.overallScore - a.score.overallScore);

    return NextResponse.json({
      success: true,
      data: sorted,
      targetIso: targetIso || null,
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
