import { SpotRepository } from '@/domain/ports/SpotRepository';
import { MarineWeatherService, Daylight } from '@/domain/ports/MarineWeatherService';
import { TideState } from '@/domain/models/Tide';
import { SpotScoreCalculator } from '@/domain/services/SpotScoreCalculator';
import { ConditionQuality } from '@/domain/models/SpotScore';
import { estimateWaveEnergyKj } from '@/domain/models/WaveEnergy';
import { localHourOf } from '@/domain/models/LocalTime';

/** Daylight hours used when no sunrise/sunset data is available. */
const DEFAULT_FIRST_LIGHT_HOUR = 7;
const DEFAULT_LAST_LIGHT_HOUR = 19;
/** Hours within this many points of the peak count as part of the best window. */
const BEST_WINDOW_TOLERANCE = 5;

export interface HourlyEvolutionPoint {
  hour: number;
  timeLabel: string;
  timestamp: string;
  waveHeightM: number;
  periodSec: number;
  directionDeg: number;
  compassDir: string;
  windSpeedKmh: number;
  windGustsKmh: number;
  windDirectionDeg: number;
  windCompassDir: string;
  energyKj: number;
  tide?: TideState;
  waterTempC?: number;
  score: {
    overallScore: number;
    scoreOutOfTen: number;
    quality: ConditionQuality;
    recommendation: string;
    pros: string[];
    cons: string[];
  };
}

export interface SpotHourlyEvolutionDTO {
  spotId: string;
  spotName: string;
  date: string;
  daylight?: Daylight;
  hourlyPoints: HourlyEvolutionPoint[];
  bestWindow?: {
    startHour: number;
    endHour: number;
    peakScore: number;
    summary: string;
  };
  dailySummary: {
    maxWaveHeightM: number;
    minWaveHeightM: number;
    averagePeriodSec: number;
    predominantWindDir: string;
    averageScore: number;
  };
}

export class GetSpotHourlyEvolutionUseCase {
  constructor(
    private spotRepo: SpotRepository,
    private marineService: MarineWeatherService
  ) {}

  /** When the marine data being served was downloaded from the provider (ISO), if known. */
  public dataUpdatedAt(): Promise<string | null> {
    return this.marineService.getDataUpdatedAt();
  }

  public async execute(spotId: string, dateStr: string): Promise<SpotHourlyEvolutionDTO | null> {
    const spot = await this.spotRepo.getSpotById(spotId);
    if (!spot) return null;

    const [hourly, daylight] = await Promise.all([
      this.marineService.getHourlyForecastForDate(spot.id, spot.location.lat, spot.location.lng, dateStr),
      this.marineService.getDaylight(spot.id, spot.location.lat, spot.location.lng, dateStr),
    ]);

    if (!hourly || hourly.length === 0) {
      return null;
    }

    const hourlyPoints: HourlyEvolutionPoint[] = hourly.map((entry) => {
      const calculatedScore = SpotScoreCalculator.calculate(spot, entry);
      const height = entry.primarySwell.heightM;
      const period = entry.primarySwell.periodSec;
      const energyKj = estimateWaveEnergyKj(height, period);

      const hourNumber = localHourOf(entry.timestamp);
      const timeLabel = `${String(hourNumber).padStart(2, '0')}:00`;

      return {
        hour: hourNumber,
        timeLabel,
        timestamp: entry.timestamp,
        waveHeightM: Number(height.toFixed(1)),
        periodSec: Math.round(period),
        directionDeg: entry.primarySwell.directionDeg,
        compassDir: entry.primarySwell.compassDir,
        windSpeedKmh: Math.round(entry.wind.speedKmh),
        windGustsKmh: Math.round(entry.wind.gustsKmh),
        windDirectionDeg: entry.wind.directionDeg,
        windCompassDir: entry.wind.compassDir,
        energyKj,
        tide: entry.tide,
        waterTempC: entry.seaSurfaceTemperatureC,
        score: {
          overallScore: calculatedScore.overallScore,
          scoreOutOfTen: Number((calculatedScore.overallScore / 10).toFixed(1)),
          quality: calculatedScore.quality,
          recommendation: calculatedScore.recommendation,
          pros: calculatedScore.pros,
          cons: calculatedScore.cons,
        },
      };
    });

    const firstLightHour = daylight ? localHourOf(daylight.sunrise) : DEFAULT_FIRST_LIGHT_HOUR;
    // The last usable hour is the one that ends before (or close to) sunset
    const lastLightHour = daylight
      ? localHourOf(daylight.sunset) - (Number(daylight.sunset.slice(14, 16)) < 30 ? 1 : 0)
      : DEFAULT_LAST_LIGHT_HOUR;
    const bestWindow = this.findBestWindow(hourlyPoints, firstLightHour, lastLightHour);

    // Daily summary
    const heights = hourlyPoints.map((p) => p.waveHeightM);
    const periods = hourlyPoints.map((p) => p.periodSec);
    const scores = hourlyPoints.map((p) => p.score.overallScore);

    const maxWave = Math.max(...heights);
    const minWave = Math.min(...heights);
    const avgPeriod = Math.round(periods.reduce((a, b) => a + b, 0) / (periods.length || 1));
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / (scores.length || 1));

    // Predominant wind compass
    const windCounts: Record<string, number> = {};
    for (const p of hourlyPoints) {
      windCounts[p.windCompassDir] = (windCounts[p.windCompassDir] || 0) + 1;
    }
    const predominantWindDir =
      Object.entries(windCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'NE';

    return {
      spotId: spot.id,
      spotName: spot.name,
      date: dateStr,
      daylight: daylight ?? undefined,
      hourlyPoints,
      bestWindow,
      dailySummary: {
        maxWaveHeightM: maxWave,
        minWaveHeightM: minWave,
        averagePeriodSec: avgPeriod,
        predominantWindDir,
        averageScore: avgScore,
      },
    };
  }

  /**
   * Longest run of consecutive daylight hours whose score stays close to the
   * day's daylight peak. Returns undefined when the whole day is flat.
   */
  private findBestWindow(
    points: HourlyEvolutionPoint[],
    firstLightHour: number,
    lastLightHour: number
  ): SpotHourlyEvolutionDTO['bestWindow'] {
    const daylight = points.filter((p) => p.hour >= firstLightHour && p.hour <= lastLightHour);
    if (!daylight.length) return undefined;

    const peak = daylight.reduce((best, p) => (p.score.overallScore > best.score.overallScore ? p : best));
    if (peak.score.quality === 'flat') return undefined;

    const threshold = peak.score.overallScore - BEST_WINDOW_TOLERANCE;
    const peakIdx = daylight.indexOf(peak);
    let startIdx = peakIdx;
    let endIdx = peakIdx;
    while (startIdx > 0 && daylight[startIdx - 1].score.overallScore >= threshold &&
      daylight[startIdx - 1].hour === daylight[startIdx].hour - 1) startIdx--;
    while (endIdx < daylight.length - 1 && daylight[endIdx + 1].score.overallScore >= threshold &&
      daylight[endIdx + 1].hour === daylight[endIdx].hour + 1) endIdx++;

    const startHour = daylight[startIdx].hour;
    // The window covers the whole last hour, so it ends at the next o'clock
    const endHour = Math.min(24, daylight[endIdx].hour + 1);
    const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;

    return {
      startHour,
      endHour,
      peakScore: peak.score.scoreOutOfTen,
      summary: `Ventana óptima entre ${hh(startHour)} y ${hh(endHour)} con ola de ${peak.waveHeightM}m @ ${peak.periodSec}s y viento ${peak.windCompassDir} (${peak.windSpeedKmh} km/h).`,
    };
  }
}
