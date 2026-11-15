import { SpotRepository } from '@/domain/ports/SpotRepository';
import { MarineWeatherService } from '@/domain/ports/MarineWeatherService';
import { SpotReportRepository } from '@/domain/ports/SpotReportRepository';
import { SpotScoreCalculator } from '@/domain/services/SpotScoreCalculator';
import { SpotDetailDTO } from '../dtos/SpotSummaryDTO';
import { estimatedEnergy } from './GetSpotsWithForecastUseCase';
import { canaryNow } from '@/domain/models/LocalTime';

export class GetSpotDetailUseCase {
  constructor(
    private spotRepo: SpotRepository,
    private marineService: MarineWeatherService,
    private reportRepo: SpotReportRepository
  ) {}

  public async execute(spotId: string): Promise<SpotDetailDTO | null> {
    const spot = await this.spotRepo.getSpotById(spotId);
    if (!spot) return null;

    const [conditions, hourly, reports, daylight] = await Promise.all([
      this.marineService.getCurrentConditions(spot.id, spot.location.lat, spot.location.lng),
      this.marineService.getHourlyForecast(spot.id, spot.location.lat, spot.location.lng, 48),
      // Community photos are optional: a storage outage must not hide the forecast
      this.reportRepo.getRecentReports(spot.id, 10).catch(() => []),
      this.marineService.getDaylight(spot.id, spot.location.lat, spot.location.lng, canaryNow().dateStr),
    ]);

    const energy = estimatedEnergy(conditions);
    const score = SpotScoreCalculator.calculate(spot, conditions);

    return {
      spot,
      conditions,
      energy,
      score,
      recentReportCount: reports.length,
      latestReportAt: reports[0]?.capturedAt,
      hourlyForecast: hourly,
      reports,
      webcam: spot.webcam,
      daylight: daylight ?? undefined,
    };
  }
}
