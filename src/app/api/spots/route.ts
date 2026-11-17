import { NextRequest, NextResponse } from 'next/server';
import { getSpotsWithForecastUseCase } from '@/application/container';
import { IslandId, ZoneId, isIslandId, isZoneId } from '@/domain/models/Island';
import { isValidDateStr, toLocalHourKey } from '@/domain/models/LocalTime';

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const islandParam = params.get('island');
    const zoneParam = params.get('zone');
    const date = params.get('date'); // 'YYYY-MM-DD' (Canary Islands local date)
    const hourParam = params.get('hour'); // '0' to '23' (Canary Islands local hour)

    // Only known island ids are accepted: the value never reaches anything but a lookup
    const island: IslandId | undefined = isIslandId(islandParam) ? islandParam : undefined;
    if (islandParam && !island) {
      return NextResponse.json({ success: false, error: 'Isla no válida' }, { status: 400 });
    }

    const zone: ZoneId | undefined = isZoneId(zoneParam) ? zoneParam : undefined;
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

    const { summaries, unavailable, dataUpdatedAt } = await getSpotsWithForecastUseCase.execute({ island, zone }, targetLocalHour);

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
