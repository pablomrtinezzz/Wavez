import { SpotRepository } from '@/domain/ports/SpotRepository';
import { MarineWeatherService } from '@/domain/ports/MarineWeatherService';
import { SpotReportRepository } from '@/domain/ports/SpotReportRepository';
import { ExifSecurityValidator } from '@/domain/services/ExifSecurityValidator';
import { ExifData, SpotReport } from '@/domain/models/SpotReport';

export interface SubmitReportCommand {
  spotId: string;
  photoUrl: string;
  captureMethod: 'camera_direct' | 'gallery_upload';
  exifData?: ExifData;
  userNote?: string;
}

export class SubmitSpotReportUseCase {
  constructor(
    private spotRepo: SpotRepository,
    private marineService: MarineWeatherService,
    private reportRepo: SpotReportRepository
  ) {}

  public async execute(command: SubmitReportCommand): Promise<SpotReport> {
    const spot = await this.spotRepo.getSpotById(command.spotId);
    if (!spot) {
      throw new Error(`Spot no encontrado con id: ${command.spotId}`);
    }

    if (!command.photoUrl || command.photoUrl.trim() === '') {
      throw new Error('La URL de la foto es requerida');
    }

    // Run security and freshness validation
    const validation = ExifSecurityValidator.validate({
      captureMethod: command.captureMethod,
      exifData: command.exifData,
      spotCoordinates: spot.location,
      maxAgeHours: 3,
      maxDistanceMeters: 2500,
    });

    if (!validation.isValid) {
      throw new Error(validation.rejectionReason || 'La foto no cumple los criterios de validación temporal.');
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

    const report: SpotReport = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      spotId: spot.id,
      photoUrl: command.photoUrl,
      capturedAt: command.exifData?.dateTimeOriginal || new Date().toISOString(),
      uploadedAt: new Date().toISOString(),
      userNote: command.userNote?.trim().slice(0, 300), // sanitize max length
      isRealtimeVerified: validation.isRealtimeVerified,
      captureMethod: command.captureMethod,
      exifData: command.exifData,
      distanceToSpotMeters: validation.distanceToSpotMeters,
      verificationFlags: validation.flags,
      conditionSnapshot: snapshot,
    };

    await this.reportRepo.saveReport(report);
    return report;
  }
}
