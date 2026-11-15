import { SpotRepository } from '@/domain/ports/SpotRepository';
import { MarineWeatherService } from '@/domain/ports/MarineWeatherService';
import { EnergyScraperService } from '@/domain/ports/EnergyScraperService';
import { SpotReportRepository } from '@/domain/ports/SpotReportRepository';
import { SpotScoreCalculator } from '@/domain/services/SpotScoreCalculator';
import { SpotDetailDTO } from '../dtos/SpotSummaryDTO';
import { estimatedEnergy } from './GetSpotsWithForecastUseCase';
import { canaryNow } from '@/domain/models/LocalTime';

export class GetSpotDetailUseCase {
  constructor(
    private spotRepo: SpotRepository,
    private marineService: MarineWeatherService,
    private energyService: EnergyScraperService,
    private reportRepo: SpotReportRepository
  ) {}

  public async execute(spotId: string): Promise<SpotDetailDTO | null> {
    const spot = await this.spotRepo.getSpotById(spotId);
    if (!spot) return null;

    const [conditions, hourly, reports, daylight] = await Promise.all([
      this.marineService.getCurrentConditions(spot.id, spot.location.lat, spot.location.lng),
      this.marineService.getHourlyForecast(spot.id, spot.location.lat, spot.location.lng, 48),
      this.reportRepo.getRecentReports(spot.id, 10),
      this.marineService.getDaylight(spot.location.lat, spot.location.lng, canaryNow().dateStr),
    ]);

    const energy = spot.surfForecastSlug
      ? await this.energyService.getSpotEnergy(
          spot.surfForecastSlug,
          conditions.primarySwell.heightM,
          conditions.primarySwell.periodSec
        )
      : estimatedEnergy(spot, conditions);

    const score = SpotScoreCalculator.calculate(spot, conditions);

    return {
      spot,
      conditions,
      energy,
      score,
      recentReportCount: reports.length,
      latestReport: reports[0],
      hourlyForecast: hourly,
      reports,
      webcam: spot.webcam,
      daylight: daylight ?? undefined,
    };
  }
}
