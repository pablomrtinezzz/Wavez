import { SpotReport } from '../models/SpotReport';

export type PhotoContentType = 'image/jpeg' | 'image/png' | 'image/webp';

export interface PhotoUpload {
  bytes: Uint8Array;
  contentType: PhotoContentType;
}

/** A report before its photo has been stored (the repository assigns photoUrl). */
export type NewSpotReport = Omit<SpotReport, 'photoUrl'>;

/** How long community photos live and how many are kept per spot. */
export const REPORT_RETENTION = {
  ttlHours: 48,
  maxPerSpot: 12,
} as const;

export interface SpotReportRepository {
  /** Most recent non-expired reports for a spot, newest first. */
  getRecentReports(spotId: string, limit?: number): Promise<SpotReport[]>;
  /**
   * Stores the photo and the report, then applies REPORT_RETENTION.
   * `clientKey` is an opaque, hashed identifier of the uploader used for rate limiting.
   */
  saveReport(report: NewSpotReport, photo: PhotoUpload, clientKey: string): Promise<SpotReport>;
  /** Uploads by this client since the given instant (for rate limiting across server instances). */
  countRecentUploads(clientKey: string, sinceIso: string): Promise<number>;
  deleteExpiredReports(maxAgeHours: number): Promise<number>;
}
