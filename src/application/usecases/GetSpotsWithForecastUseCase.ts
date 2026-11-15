import { SpotRepository } from '@/domain/ports/SpotRepository';
import { MarineWeatherService } from '@/domain/ports/MarineWeatherService';
import { EnergyScraperService } from '@/domain/ports/EnergyScraperService';
import { SpotReportRepository } from '@/domain/ports/SpotReportRepository';
import { SpotScoreCalculator } from '@/domain/services/SpotScoreCalculator';
import { Spot, ZoneId } from '@/domain/models/Spot';
import { MarineConditions } from '@/domain/models/MarineConditions';
import { SurfForecastEnergy, estimateWaveEnergyKj } from '@/domain/models/SurfForecastEnergy';
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
    private energyService: EnergyScraperService,
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
          this.reportRepo.getRecentReports(spot.id, 10),
        ]);

        // Surf-Forecast publishes a single "now" energy value, so it is only
        // meaningful for live mode. Any other hour uses the physical estimate
        // for that hour's swell instead of today's scraped figure.
        const energy = targetLocalHour
          ? estimatedEnergy(spot, conditions)
          : await this.resolveLiveEnergy(spot, conditions);

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

  private async resolveLiveEnergy(spot: Spot, conditions: MarineConditions): Promise<SurfForecastEnergy> {
    if (!spot.surfForecastSlug) return estimatedEnergy(spot, conditions);
    return this.energyService.getSpotEnergy(
      spot.surfForecastSlug,
      conditions.primarySwell.heightM,
      conditions.primarySwell.periodSec
    );
  }
}

export function estimatedEnergy(spot: Spot, conditions: MarineConditions): SurfForecastEnergy {
  return {
    spotSlug: spot.slug,
    timestamp: conditions.timestamp,
    energyKj: estimateWaveEnergyKj(conditions.primarySwell.heightM, conditions.primarySwell.periodSec),
    source: 'calculated_fallback',
    waveHeightM: conditions.primarySwell.heightM,
    periodSec: conditions.primarySwell.periodSec,
  };
}
