import { Spot, ZoneId, BreakType, SkillLevel, WebcamConfig } from '@/domain/models/Spot';
import { MarineConditions } from '@/domain/models/MarineConditions';
import { SurfForecastEnergy } from '@/domain/models/SurfForecastEnergy';
import { SpotScore } from '@/domain/models/SpotScore';
import { SpotReport } from '@/domain/models/SpotReport';

export interface SpotSummaryDTO {
  spot: Spot;
  conditions: MarineConditions;
  energy: SurfForecastEnergy;
  score: SpotScore;
  recentReportCount: number;
  latestReport?: SpotReport;
}

export interface SpotDetailDTO extends SpotSummaryDTO {
  hourlyForecast: MarineConditions[];
  reports: SpotReport[];
  webcam?: WebcamConfig;
}
