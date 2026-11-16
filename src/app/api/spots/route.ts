import { NextRequest, NextResponse } from 'next/server';
import { getSpotsWithForecastUseCase } from '@/application/container';
import { ZoneId } from '@/domain/models/Spot';
import { isValidDateStr, toLocalHourKey } from '@/domain/models/LocalTime';

const ZONES: ZoneId[] = ['las-palmas', 'costa-norte', 'telde-este', 'sur-sureste'];

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const zoneParam = params.get('zone');
    const date = params.get('date'); // 'YYYY-MM-DD' (Gran Canaria local date)
    const hourParam = params.get('hour'); // '0' to '23' (Gran Canaria local hour)

    const zone = ZONES.includes(zoneParam as ZoneId) ? (zoneParam as ZoneId) : undefined;
    if (zoneParam && !zone) {
      return NextResponse.json({ success: false, error: 'Zona no válida' }, { status: 400 });
    }

    let targetLocalHour: string | undefined;
    if (date) {
      const hour = hourParam === null ? 12 : Number(hourParam);
      if (!isValidDateStr(date) || !Number.isInteger(hour) || hour < 0 || hour > 23) {
        return NextResponse.json({ success: false, error: 'Fecha u hora no válidas' }, { status: 400 });
      }
      targetLocalHour = toLocalHourKey({ dateStr: date, hour });
    }

    const { summaries, unavailable, dataUpdatedAt } = await getSpotsWithForecastUseCase.execute(zone, targetLocalHour);

    // Sort by overallScore descending (best conditions first)
    const sorted = [...summaries].sort((a, b) => b.score.overallScore - a.score.overallScore);

    return NextResponse.json({
      success: true,
      data: sorted,
      unavailable,
      targetLocalHour: targetLocalHour || null,
      updatedAt: new Date().toISOString(),
      dataUpdatedAt,
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
