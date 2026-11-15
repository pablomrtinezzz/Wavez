import { Spot, WebcamConfig } from '@/domain/models/Spot';
import { MarineConditions } from '@/domain/models/MarineConditions';
import { WaveEnergy } from '@/domain/models/WaveEnergy';
import { SpotScore } from '@/domain/models/SpotScore';
import { SpotReport } from '@/domain/models/SpotReport';
import { Daylight } from '@/domain/ports/MarineWeatherService';

export interface SpotSummaryDTO {
  spot: Spot;
  conditions: MarineConditions;
  energy: WaveEnergy;
  score: SpotScore;
  recentReportCount: number;
  /** Capture time of the latest community photo (the photo itself is only sent in the detail). */
  latestReportAt?: string;
}

export interface SpotDetailDTO extends SpotSummaryDTO {
  hourlyForecast: MarineConditions[];
  reports: SpotReport[];
  webcam?: WebcamConfig;
  daylight?: Daylight;
}
