import { SpotRepository } from '@/domain/ports/SpotRepository';
import { MarineWeatherService } from '@/domain/ports/MarineWeatherService';
import { PhotoContentType, SpotReportRepository } from '@/domain/ports/SpotReportRepository';
import { ExifSecurityValidator } from '@/domain/services/ExifSecurityValidator';
import { DeviceLocation, ExifData, SpotReport } from '@/domain/models/SpotReport';

export interface SubmitReportCommand {
  spotId: string;
  photoUrl: string;
  captureMethod: 'camera_direct' | 'gallery_upload';
  exifData?: ExifData;
  deviceLocation?: DeviceLocation;
  userNote?: string;
}

/** Thrown when one uploader exceeds the allowed number of photos. */
export class ReportRateLimitError extends Error {
  constructor() {
    super('Has subido varias fotos seguidas. Espera unos minutos.');
    this.name = 'ReportRateLimitError';
  }
}

/** At most this many photos per uploader in the window below. */
const MAX_UPLOADS_PER_WINDOW = 5;
const UPLOAD_WINDOW_MS = 10 * 60 * 1000;

/** Photos must be taken on the beach: within this distance of the spot. */
const MAX_DISTANCE_METERS = 2500;

function sanitizeLocation(loc: unknown): DeviceLocation | undefined {
  if (!loc || typeof loc !== 'object') return undefined;
  const l = loc as Record<string, unknown>;
  const finite = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
  if (!finite(l.lat) || !finite(l.lng) || Math.abs(l.lat as number) > 90 || Math.abs(l.lng as number) > 180) return undefined;
  return {
    lat: l.lat as number,
    lng: l.lng as number,
    accuracyM: finite(l.accuracyM) && (l.accuracyM as number) >= 0 ? (l.accuracyM as number) : 1000,
  };
}

/** ~1.5 MB of base64, far above a 1280px JPEG at 80% (~150-300 KB). */
const MAX_PHOTO_DATA_URL_LENGTH = 1_500_000;
const PHOTO_DATA_URL_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;
const PHOTO_DATA_URL_PATTERN_WITH_DATA = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+=*)$/;
const MAX_NOTE_LENGTH = 300;

function sanitizeExif(exif: unknown): ExifData | undefined {
  if (!exif || typeof exif !== 'object') return undefined;
  const e = exif as Record<string, unknown>;
  const str = (v: unknown, max = 64) => (typeof v === 'string' ? v.slice(0, max) : undefined);
  const coord = (v: unknown, limit: number) =>
    typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= limit ? v : undefined;
  return {
    dateTimeOriginal: str(e.dateTimeOriginal),
    latitude: coord(e.latitude, 90),
    longitude: coord(e.longitude, 180),
    deviceMake: str(e.deviceMake),
    deviceModel: str(e.deviceModel),
  };
}

export class SubmitSpotReportUseCase {
  constructor(
    private spotRepo: SpotRepository,
    private marineService: MarineWeatherService,
    private reportRepo: SpotReportRepository
  ) {}

  /**
   * @param clientKey Opaque, hashed identifier of the uploader (never the raw IP),
   *   used to rate-limit uploads across all server instances.
   */
  public async execute(command: SubmitReportCommand, clientKey: string = 'anonymous'): Promise<SpotReport> {
    const spot = await this.spotRepo.getSpotById(command.spotId);
    if (!spot) {
      throw new Error(`Spot no encontrado con id: ${command.spotId}`);
    }

    // Only accept images compressed by our own client (no remote URLs, no SVG)
    if (typeof command.photoUrl !== 'string' || !PHOTO_DATA_URL_PATTERN.test(command.photoUrl)) {
      throw new Error('La foto debe ser una imagen JPEG, PNG o WebP');
    }
    if (command.photoUrl.length > MAX_PHOTO_DATA_URL_LENGTH) {
      throw new Error('La foto es demasiado pesada');
    }
    // Only live captures from the in-app camera, with the device's position
    if (command.captureMethod !== 'camera_direct') {
      throw new Error('Solo se aceptan fotos hechas en el momento con la cámara');
    }
    const deviceLocation = sanitizeLocation(command.deviceLocation);
    if (!deviceLocation) {
      throw new Error('Necesitamos tu ubicación para comprobar que estás en el spot');
    }
    const exifData = sanitizeExif(command.exifData);

    const since = new Date(Date.now() - UPLOAD_WINDOW_MS).toISOString();
    if ((await this.reportRepo.countRecentUploads(clientKey, since)) >= MAX_UPLOADS_PER_WINDOW) {
      throw new ReportRateLimitError();
    }

    // Run security and freshness validation
    const validation = ExifSecurityValidator.validate({
      captureMethod: command.captureMethod,
      exifData,
      deviceLocation,
      spotCoordinates: spot.location,
      maxAgeHours: 3,
      maxDistanceMeters: MAX_DISTANCE_METERS,
    });

    if (!validation.isValid) {
      throw new Error(validation.rejectionReason || 'La foto no cumple los criterios de validación temporal.');
    }
    if (validation.distanceToSpotMeters === undefined || validation.distanceToSpotMeters > MAX_DISTANCE_METERS) {
      const km = ((validation.distanceToSpotMeters ?? 0) / 1000).toFixed(1);
      throw new Error(`Estás a unos ${km} km de ${spot.name}. Las fotos tienen que hacerse desde el spot.`);
    }

    // Capture condition snapshot
    let snapshot: SpotReport['conditionSnapshot'] | undefined;
    try {
      const current = await this.marineService.getCurrentConditions(
        spot.id,
        spot.location.lat,
        spot.location.lng
      );
      snapshot = {
        waveHeightM: current.primarySwell.heightM,
        periodSec: current.primarySwell.periodSec,
        windSpeedKmh: current.wind.speedKmh,
        windCompass: current.wind.compassDir,
      };
    } catch {
      // Snapshot is optional enhancement
    }

    // Photos are taken live, so the server's clock is the capture time
    const now = new Date().toISOString();
    const [, mime, base64] = command.photoUrl.match(PHOTO_DATA_URL_PATTERN_WITH_DATA)!;

    return this.reportRepo.saveReport(
      {
        id: crypto.randomUUID(),
        spotId: spot.id,
        capturedAt: now,
        uploadedAt: now,
        userNote: typeof command.userNote === 'string' ? command.userNote.trim().slice(0, MAX_NOTE_LENGTH) || undefined : undefined,
        isRealtimeVerified: validation.isRealtimeVerified,
        captureMethod: command.captureMethod,
        distanceToSpotMeters: validation.distanceToSpotMeters,
        verificationFlags: validation.flags,
        conditionSnapshot: snapshot,
      },
      { bytes: Buffer.from(base64, 'base64'), contentType: `image/${mime}` as PhotoContentType },
      clientKey
    );
  }
}
