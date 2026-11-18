import { cacheLife } from 'next/cache';
import { getSpotHourlyEvolutionUseCase } from '@/application/container';
import { ALL_SPOTS } from '@/infrastructure/spots';
import { addDays, canaryNow } from '@/domain/models/LocalTime';
import { isDirectionInRange } from '@/domain/models/MarineConditions';
import { ConditionQuality } from '@/domain/models/SpotScore';
import { Spot } from '@/domain/models/Spot';

/** Days shown in the server-rendered forecast: today and the next two. */
const OUTLOOK_DAYS = 3;
/** Daylight hours sampled for each day's table. */
export const OUTLOOK_HOURS = [7, 10, 13, 16, 19];

/** Wind relative to the spot, without wording, so each language can name it. */
export type WindKind = 'calm' | 'offshore' | 'cross' | 'onshore';

export interface OutlookHour {
  hour: number;
  waveM: number;
  periodS: number;
  swellDir: string;
  windKmh: number;
  windDir: string;
  wind: WindKind;
  /** 0-10 */
  score: number;
  quality: ConditionQuality;
}

export interface OutlookDay {
  /** 'YYYY-MM-DD', Canary Islands date. */
  date: string;
  minWaveM: number;
  maxWaveM: number;
  /** Best stretch of daylight, absent when the day is flat. */
  best?: { startHour: number; endHour: number; score: number; quality: ConditionQuality };
  hours: OutlookHour[];
}

export interface SpotOutlook {
  /** When this forecast was rendered (ISO). */
  renderedAt: string;
  /** When the marine data was downloaded from Open-Meteo (ISO), if known. */
  dataUpdatedAt: string | null;
  days: OutlookDay[];
}

/** Same thresholds as describeWind in presentation/lib/format. */
function windKind(spot: Spot, speedKmh: number, directionDeg: number): WindKind {
  if (speedKmh <= 8) return 'calm';
  const { min, max } = spot.idealConditions.favorableWindDegrees;
  if (isDirectionInRange(directionDeg, min, max)) return 'offshore';
  return speedKmh > 25 ? 'onshore' : 'cross';
}

/**
 * The next days of forecast for a spot, as plain data for the spot pages.
 * Cached for an hour so the pages carry a real forecast in their HTML for
 * search engines and link previews, without asking for data on every visit.
 * The live, interactive forecast stays in the island page.
 */
export async function getSpotOutlook(spotId: string): Promise<SpotOutlook | null> {
  'use cache';
  const spot = ALL_SPOTS.find((s) => s.id === spotId);
  const today = canaryNow().dateStr;
  const dates = Array.from({ length: OUTLOOK_DAYS }, (_, i) => addDays(today, i));

  try {
    const evolutions = await Promise.all(dates.map((date) => getSpotHourlyEvolutionUseCase.execute(spotId, date)));
    const days: OutlookDay[] = [];
    for (const evolution of evolutions) {
      if (!spot || !evolution?.hourlyPoints.length) continue;
      const points = evolution.hourlyPoints;
      const peak = evolution.bestWindow
        ? points.find((p) => p.hour >= evolution.bestWindow!.startHour && p.hour < evolution.bestWindow!.endHour && p.score.scoreOutOfTen === evolution.bestWindow!.peakScore)
        : undefined;
      days.push({
        date: evolution.date,
        minWaveM: evolution.dailySummary.minWaveHeightM,
        maxWaveM: evolution.dailySummary.maxWaveHeightM,
        best: evolution.bestWindow && {
          startHour: evolution.bestWindow.startHour,
          endHour: evolution.bestWindow.endHour,
          score: evolution.bestWindow.peakScore,
          quality: peak?.score.quality ?? 'fair',
        },
        hours: points
          .filter((p) => OUTLOOK_HOURS.includes(p.hour))
          .map((p) => ({
            hour: p.hour,
            waveM: p.waveHeightM,
            periodS: p.periodSec,
            swellDir: p.compassDir,
            windKmh: p.windSpeedKmh,
            windDir: p.windCompassDir,
            wind: windKind(spot, p.windSpeedKmh, p.windDirectionDeg),
            score: p.score.scoreOutOfTen,
            quality: p.score.quality,
          })),
      });
    }
    if (!days.length) throw new Error('no forecast data');

    cacheLife('hours');
    return {
      renderedAt: new Date().toISOString(),
      dataUpdatedAt: await getSpotHourlyEvolutionUseCase.dataUpdatedAt(),
      days,
    };
  } catch (error) {
    // Without data the page still renders; try again in a few minutes instead of an hour
    console.warn(`[spotOutlook] No forecast for ${spotId}:`, (error as Error).message);
    cacheLife('minutes');
    return null;
  }
}
