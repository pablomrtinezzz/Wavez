import { SpotRepository } from '@/domain/ports/SpotRepository';
import { MarineWeatherService } from '@/domain/ports/MarineWeatherService';
import { SpotScoreCalculator } from '@/domain/services/SpotScoreCalculator';

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
  score: {
    overallScore: number;
    scoreOutOfTen: number;
    badge: 'epic' | 'good' | 'fair' | 'poor';
    recommendation: string;
    pros: string[];
    cons: string[];
  };
}

export interface SpotHourlyEvolutionDTO {
  spotId: string;
  spotName: string;
  date: string;
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

  public async execute(spotId: string, dateStr: string): Promise<SpotHourlyEvolutionDTO | null> {
    const spot = await this.spotRepo.getSpotById(spotId);
    if (!spot) return null;

    const hourly = await this.marineService.getHourlyForecastForDate(
      spot.id,
      spot.location.lat,
      spot.location.lng,
      dateStr
    );

    if (!hourly || hourly.length === 0) {
      return null;
    }

    const hourlyPoints: HourlyEvolutionPoint[] = hourly.map((entry) => {
      const calculatedScore = SpotScoreCalculator.calculate(spot, entry);
      const height = entry.primarySwell.heightM;
      const period = entry.primarySwell.periodSec;
      const energyKj = Math.round(40 * Math.pow(height, 2) * period);

      const hourNumber = new Date(entry.timestamp).getHours();
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
        score: {
          overallScore: calculatedScore.overallScore,
          scoreOutOfTen: calculatedScore.scoreOutOfTen,
          badge: calculatedScore.badge,
          recommendation: calculatedScore.recommendation,
          pros: calculatedScore.pros,
          cons: calculatedScore.cons,
        },
      };
    });

    // Compute Best Window (consecutive 2-3 hours with top score during daylight 07:00 - 20:00)
    const daylight = hourlyPoints.filter((p) => p.hour >= 7 && p.hour <= 20);
    let bestWindow: SpotHourlyEvolutionDTO['bestWindow'] = undefined;

    if (daylight.length > 0) {
      let topPoint = daylight[0];
      for (const p of daylight) {
        if (p.score.overallScore > topPoint.score.overallScore) {
          topPoint = p;
        }
      }

      const start = Math.max(7, topPoint.hour - 1);
      const end = Math.min(20, topPoint.hour + 1);
      bestWindow = {
        startHour: start,
        endHour: end,
        peakScore: topPoint.score.scoreOutOfTen,
        summary: `Ventana óptima entre ${String(start).padStart(2, '0')}:00 y ${String(end).padStart(2, '0')}:00 con ola de ${topPoint.waveHeightM}m @ ${topPoint.periodSec}s y viento ${topPoint.windCompassDir} (${topPoint.windSpeedKmh} km/h).`,
      };
    }

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
}
