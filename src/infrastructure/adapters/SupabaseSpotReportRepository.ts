import { SupabaseClient } from '@supabase/supabase-js';
import { SpotReport } from '@/domain/models/SpotReport';
import {
  NewSpotReport,
  PhotoUpload,
  REPORT_RETENTION,
  SpotReportRepository,
} from '@/domain/ports/SpotReportRepository';

const TABLE = 'spot_reports';
export const PHOTO_BUCKET = 'spot-photos';

interface ReportRow {
  id: string;
  spot_id: string;
  photo_path: string;
  captured_at: string;
  uploaded_at: string;
  user_note: string | null;
  is_realtime_verified: boolean;
  capture_method: SpotReport['captureMethod'];
  distance_to_spot_m: number | null;
  verification_flags: string[];
  condition_snapshot: SpotReport['conditionSnapshot'] | null;
  client_key: string;
}

const EXTENSION: Record<PhotoUpload['contentType'], string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Community photos in Supabase: the image goes to a public Storage bucket,
 * its metadata to the `spot_reports` table (RLS on, no public policies, so
 * only this server, using the secret key, can read or write rows).
 * See supabase/migrations for the schema.
 */
export class SupabaseSpotReportRepository implements SpotReportRepository {
  constructor(private readonly db: SupabaseClient) {}

  public async getRecentReports(spotId: string, limit: number = 10): Promise<SpotReport[]> {
    const { data, error } = await this.db
      .from(TABLE)
      .select('*')
      .eq('spot_id', spotId)
      .gt('captured_at', this.expiryThreshold())
      .order('captured_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(`Supabase: no se pudieron leer los reportes (${error.message})`);
    return (data as ReportRow[]).map((row) => this.toReport(row));
  }

  public async saveReport(report: NewSpotReport, photo: PhotoUpload, clientKey: string): Promise<SpotReport> {
    const path = `${report.spotId}/${report.id}.${EXTENSION[photo.contentType]}`;
    const upload = await this.db.storage.from(PHOTO_BUCKET).upload(path, photo.bytes, {
      contentType: photo.contentType,
      cacheControl: '86400',
      upsert: false,
    });
    if (upload.error) throw new Error(`Supabase: no se pudo guardar la foto (${upload.error.message})`);

    const row: ReportRow = {
      id: report.id,
      spot_id: report.spotId,
      photo_path: path,
      captured_at: report.capturedAt,
      uploaded_at: report.uploadedAt,
      user_note: report.userNote ?? null,
      is_realtime_verified: report.isRealtimeVerified,
      capture_method: report.captureMethod,
      distance_to_spot_m: report.distanceToSpotMeters ?? null,
      verification_flags: report.verificationFlags,
      condition_snapshot: report.conditionSnapshot ?? null,
      client_key: clientKey,
    };
    const insert = await this.db.from(TABLE).insert(row);
    if (insert.error) {
      // Do not leave an orphan photo behind
      await this.db.storage.from(PHOTO_BUCKET).remove([path]);
      throw new Error(`Supabase: no se pudo guardar el reporte (${insert.error.message})`);
    }

    // Retention runs on writes; failures here must not lose the upload
    await this.enforceRetention(report.spotId).catch((e) => console.warn('[Supabase] Retention failed:', e));
    return this.toReport(row);
  }

  public async countRecentUploads(clientKey: string, sinceIso: string): Promise<number> {
    const { count, error } = await this.db
      .from(TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('client_key', clientKey)
      .gte('uploaded_at', sinceIso);
    if (error) throw new Error(`Supabase: no se pudo comprobar el límite (${error.message})`);
    return count ?? 0;
  }

  public async deleteExpiredReports(maxAgeHours: number = REPORT_RETENTION.ttlHours): Promise<number> {
    const threshold = new Date(Date.now() - maxAgeHours * 3600_000).toISOString();
    const { data, error } = await this.db.from(TABLE).select('id, photo_path').lte('captured_at', threshold).limit(500);
    if (error) throw new Error(error.message);
    return this.deleteRows(data as Pick<ReportRow, 'id' | 'photo_path'>[]);
  }

  private async enforceRetention(spotId: string) {
    await this.deleteExpiredReports(REPORT_RETENTION.ttlHours);
    const { data, error } = await this.db
      .from(TABLE)
      .select('id, photo_path')
      .eq('spot_id', spotId)
      .order('captured_at', { ascending: false })
      .range(REPORT_RETENTION.maxPerSpot, REPORT_RETENTION.maxPerSpot + 100);
    if (error) throw new Error(error.message);
    await this.deleteRows(data as Pick<ReportRow, 'id' | 'photo_path'>[]);
  }

  private async deleteRows(rows: Pick<ReportRow, 'id' | 'photo_path'>[]): Promise<number> {
    if (!rows.length) return 0;
    await this.db.storage.from(PHOTO_BUCKET).remove(rows.map((r) => r.photo_path));
    const { error } = await this.db.from(TABLE).delete().in('id', rows.map((r) => r.id));
    if (error) throw new Error(error.message);
    return rows.length;
  }

  private expiryThreshold(): string {
    return new Date(Date.now() - REPORT_RETENTION.ttlHours * 3600_000).toISOString();
  }

  private toReport(row: ReportRow): SpotReport {
    return {
      id: row.id,
      spotId: row.spot_id,
      photoUrl: this.db.storage.from(PHOTO_BUCKET).getPublicUrl(row.photo_path).data.publicUrl,
      capturedAt: row.captured_at,
      uploadedAt: row.uploaded_at,
      userNote: row.user_note ?? undefined,
      isRealtimeVerified: row.is_realtime_verified,
      captureMethod: row.capture_method,
      distanceToSpotMeters: row.distance_to_spot_m ?? undefined,
      verificationFlags: row.verification_flags ?? [],
      conditionSnapshot: row.condition_snapshot ?? undefined,
    };
  }
}
