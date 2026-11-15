import { SpotRepository } from '@/domain/ports/SpotRepository';
import { MarineWeatherService } from '@/domain/ports/MarineWeatherService';
import { SpotReportRepository } from '@/domain/ports/SpotReportRepository';
import { SpotScoreCalculator } from '@/domain/services/SpotScoreCalculator';
import { Spot, ZoneId } from '@/domain/models/Spot';
import { MarineConditions } from '@/domain/models/MarineConditions';
import { WaveEnergy, estimateWaveEnergyKj } from '@/domain/models/WaveEnergy';
import { SpotSummaryDTO } from '../dtos/SpotSummaryDTO';

export interface SpotsForecastResult {
  summaries: SpotSummaryDTO[];
  /** Spots for which no real marine data could be obtained. */
  unavailable: Pick<Spot, 'id' | 'name'>[];
}

export class GetSpotsWithForecastUseCase {
  constructor(
    private spotRepo: SpotRepository,
    private marineService: MarineWeatherService,
    private reportRepo: SpotReportRepository
  ) {}

  /**
   * @param targetLocalHour Gran Canaria wall-clock hour ('YYYY-MM-DDTHH:00').
   *   When omitted, current conditions are returned.
   */
  public async execute(zone?: ZoneId, targetLocalHour?: string): Promise<SpotsForecastResult> {
    const spots = zone
      ? await this.spotRepo.getSpotsByZone(zone)
      : await this.spotRepo.getAllSpots();

    const results = await Promise.allSettled(
      spots.map(async (spot): Promise<SpotSummaryDTO> => {
        const [conditions, reports] = await Promise.all([
          targetLocalHour
            ? this.marineService.getConditionsForTimestamp(spot.id, spot.location.lat, spot.location.lng, targetLocalHour)
            : this.marineService.getCurrentConditions(spot.id, spot.location.lat, spot.location.lng),
          // Community photos are optional: a storage outage must not hide the forecast
          this.reportRepo.getRecentReports(spot.id, 10).catch(() => []),
        ]);

        const energy = estimatedEnergy(conditions);

        return {
          spot,
          conditions,
          energy,
          score: SpotScoreCalculator.calculate(spot, conditions),
          recentReportCount: reports.length,
          latestReportAt: reports[0]?.capturedAt,
        };
      })
    );

    const summaries: SpotSummaryDTO[] = [];
    const unavailable: SpotsForecastResult['unavailable'] = [];
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') summaries.push(result.value);
      else unavailable.push({ id: spots[i].id, name: spots[i].name });
    });

    return { summaries, unavailable };
  }

}

export function estimatedEnergy(conditions: MarineConditions): WaveEnergy {
  return {
    timestamp: conditions.timestamp,
    energyKj: estimateWaveEnergyKj(conditions.primarySwell.heightM, conditions.primarySwell.periodSec),
  };
}
