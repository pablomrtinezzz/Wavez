import { SpotReport } from '@/domain/models/SpotReport';
import { SpotReportRepository } from '@/domain/ports/SpotReportRepository';

export class InMemorySpotReportRepository implements SpotReportRepository {
  private reports: SpotReport[] = [];

  constructor() {
    // Seed with a verified recent report for Playa del Hombre for initial demo
    const oneHourAgo = new Date(Date.now() - 65 * 60 * 1000).toISOString();
    this.reports.push({
      id: 'seed-pdh-1',
      spotId: 'playa-del-hombre',
      photoUrl: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&auto=format&fit=crop&q=80',
      capturedAt: oneHourAgo,
      uploadedAt: oneHourAgo,
      userNote: 'Pico del medio rompiendo con fuerza. Marea media bajando, viento flojo terral.',
      isRealtimeVerified: true,
      captureMethod: 'camera_direct',
      verificationFlags: [
        'CAPTURA_EN_VIVO: Disparo directo desde cámara verificado.',
        'HORA_VALIDA: Foto tomada hace 65 min.',
        'GPS_VERIFICADO: Foto tomada a 120m de la playa.',
      ],
      conditionSnapshot: {
        waveHeightM: 1.4,
        periodSec: 11,
        windSpeedKmh: 14,
        windCompass: 'W',
      },
    });
  }

  public async getRecentReports(spotId: string, limit: number = 10): Promise<SpotReport[]> {
    return this.reports
      .filter((r) => r.spotId === spotId)
      .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime())
      .slice(0, limit);
  }

  public async saveReport(report: SpotReport): Promise<void> {
    this.reports.unshift(report);
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
