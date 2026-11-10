import { SpotReport } from '../models/SpotReport';

export interface SpotReportRepository {
  getRecentReports(spotId: string, limit?: number): Promise<SpotReport[]>;
  saveReport(report: SpotReport): Promise<void>;
  deleteExpiredReports(maxAgeHours: number): Promise<number>;
}
