import { SpotRepository } from '@/domain/ports/SpotRepository';
import { MarineWeatherService } from '@/domain/ports/MarineWeatherService';
import { EnergyScraperService } from '@/domain/ports/EnergyScraperService';
import { SpotReportRepository } from '@/domain/ports/SpotReportRepository';
import { SpotScoreCalculator } from '@/domain/services/SpotScoreCalculator';
import { ZoneId } from '@/domain/models/Spot';
import { SpotSummaryDTO } from '../dtos/SpotSummaryDTO';

export class GetSpotsWithForecastUseCase {
  constructor(
    private spotRepo: SpotRepository,
    private marineService: MarineWeatherService,
    private energyService: EnergyScraperService,
    private reportRepo: SpotReportRepository
  ) {}

  public async execute(zone?: ZoneId, targetIso?: string): Promise<SpotSummaryDTO[]> {
    const spots = zone
      ? await this.spotRepo.getSpotsByZone(zone)
      : await this.spotRepo.getAllSpots();

    // Fetch conditions & reports in parallel
    const summaries = await Promise.all(
      spots.map(async (spot) => {
        const [conditions, reports] = await Promise.all([
          targetIso
            ? this.marineService.getConditionsForTimestamp(spot.id, spot.location.lat, spot.location.lng, targetIso)
            : this.marineService.getCurrentConditions(spot.id, spot.location.lat, spot.location.lng),
          this.reportRepo.getRecentReports(spot.id, 1),
        ]);

        const energy = spot.surfForecastSlug
          ? await this.energyService.getSpotEnergy(
              spot.surfForecastSlug,
              conditions.primarySwell.heightM,
              conditions.primarySwell.periodSec
            )
          : {
              spotSlug: spot.slug,
              timestamp: conditions.timestamp,
              energyKj: Math.round(
                40 * Math.pow(conditions.primarySwell.heightM, 2) * conditions.primarySwell.periodSec
              ),
              source: 'calculated_fallback' as const,
            };

        const score = SpotScoreCalculator.calculate(spot, conditions);

        return {
          spot,
          conditions,
          energy,
          score,
          recentReportCount: reports.length,
          latestReport: reports[0],
        };
      })
    );

    return summaries;
  }
}
