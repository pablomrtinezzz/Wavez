import { SpotReport } from '@/domain/models/SpotReport';
import {
  NewSpotReport,
  PhotoUpload,
  REPORT_RETENTION,
  SpotReportRepository,
} from '@/domain/ports/SpotReportRepository';

interface StoredReport {
  report: SpotReport;
  clientKey: string;
}

/**
 * Process-local storage, used for tests and local development without
 * Supabase. On serverless hosting it is NOT persistent: each instance has
 * its own copy and it is lost when the instance stops.
 */
export class InMemorySpotReportRepository implements SpotReportRepository {
  private items: StoredReport[] = [];

  public async getRecentReports(spotId: string, limit: number = 10): Promise<SpotReport[]> {
    const threshold = Date.now() - REPORT_RETENTION.ttlHours * 3600_000;
    return this.items
      .map((i) => i.report)
      .filter((r) => r.spotId === spotId && Date.parse(r.capturedAt) > threshold)
      .sort((a, b) => Date.parse(b.capturedAt) - Date.parse(a.capturedAt))
      .slice(0, limit);
  }

  public async saveReport(report: NewSpotReport, photo: PhotoUpload, clientKey: string): Promise<SpotReport> {
    await this.deleteExpiredReports(REPORT_RETENTION.ttlHours);
    const stored: SpotReport = {
      ...report,
      photoUrl: `data:${photo.contentType};base64,${Buffer.from(photo.bytes).toString('base64')}`,
    };
    this.items.unshift({ report: stored, clientKey });
    const forSpot = this.items.filter((i) => i.report.spotId === report.spotId);
    if (forSpot.length > REPORT_RETENTION.maxPerSpot) {
      const evicted = new Set(forSpot.slice(REPORT_RETENTION.maxPerSpot).map((i) => i.report.id));
      this.items = this.items.filter((i) => !evicted.has(i.report.id));
    }
    return stored;
  }

  public async countRecentUploads(clientKey: string, sinceIso: string): Promise<number> {
    const since = Date.parse(sinceIso);
    return this.items.filter((i) => i.clientKey === clientKey && Date.parse(i.report.uploadedAt) >= since).length;
  }

  public async deleteExpiredReports(maxAgeHours: number = REPORT_RETENTION.ttlHours): Promise<number> {
    const threshold = Date.now() - maxAgeHours * 3600_000;
    const before = this.items.length;
    this.items = this.items.filter((i) => Date.parse(i.report.capturedAt) > threshold);
    return before - this.items.length;
  }
}
