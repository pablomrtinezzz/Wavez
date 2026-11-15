import { SpotReport } from '@/domain/models/SpotReport';
import { SpotReportRepository } from '@/domain/ports/SpotReportRepository';

/** Bound memory usage: photos are stored inline as data URLs. */
const MAX_REPORTS_PER_SPOT = 12;
const REPORT_TTL_HOURS = 48;

export class InMemorySpotReportRepository implements SpotReportRepository {
  private reports: SpotReport[] = [];

  public async getRecentReports(spotId: string, limit: number = 10): Promise<SpotReport[]> {
    return this.reports
      .filter((r) => r.spotId === spotId)
      .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime())
      .slice(0, limit);
  }

  public async saveReport(report: SpotReport): Promise<void> {
    await this.deleteExpiredReports(REPORT_TTL_HOURS);
    this.reports.unshift(report);
    const forSpot = this.reports.filter((r) => r.spotId === report.spotId);
    if (forSpot.length > MAX_REPORTS_PER_SPOT) {
      const evicted = new Set(forSpot.slice(MAX_REPORTS_PER_SPOT).map((r) => r.id));
      this.reports = this.reports.filter((r) => !evicted.has(r.id));
    }
  }

  public async deleteExpiredReports(maxAgeHours: number = 48): Promise<number> {
    const threshold = Date.now() - maxAgeHours * 60 * 60 * 1000;
    const initialCount = this.reports.length;
    this.reports = this.reports.filter((r) => new Date(r.capturedAt).getTime() > threshold);
    return initialCount - this.reports.length;
  }
}

// Global singleton instance for the serverless process
const globalForReports = global as unknown as { inMemoryReportsRepo?: InMemorySpotReportRepository };
export const spotReportRepository =
  globalForReports.inMemoryReportsRepo || new InMemorySpotReportRepository();

if (process.env.NODE_ENV !== 'production') {
  globalForReports.inMemoryReportsRepo = spotReportRepository;
}
