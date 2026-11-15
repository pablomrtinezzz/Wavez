import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SubmitSpotReportUseCase } from './SubmitSpotReportUseCase';
import { StaticSpotRepository } from '@/infrastructure/repositories/StaticSpotRepository';
import { InMemorySpotReportRepository } from '@/infrastructure/adapters/InMemorySpotReportRepository';
import { MarineWeatherService } from '@/domain/ports/MarineWeatherService';

const unavailableMarine = {
  getCurrentConditions: async () => {
    throw new Error('offline');
  },
} as unknown as MarineWeatherService;

const TINY_JPEG = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAg=';
// La Cícer is at 28.134, -15.448
const ON_THE_BEACH = { lat: 28.1345, lng: -15.4485, accuracyM: 20 };

describe('SubmitSpotReportUseCase', () => {
  const reports = new InMemorySpotReportRepository();
  const useCase = new SubmitSpotReportUseCase(new StaticSpotRepository(), unavailableMarine, reports);

  test('rejects remote URLs and non-raster data URLs', async () => {
    for (const photoUrl of ['https://evil.example/x.jpg', 'data:image/svg+xml;base64,PHN2Zz4=', 'javascript:alert(1)']) {
      await assert.rejects(
        useCase.execute({ spotId: 'la-cicer', photoUrl, captureMethod: 'camera_direct', deviceLocation: ON_THE_BEACH }),
        /JPEG, PNG o WebP/
      );
    }
  });

  test('stores a valid report and sanitizes the note', async () => {
    const report = await useCase.execute({
      spotId: 'la-cicer',
      photoUrl: TINY_JPEG,
      captureMethod: 'camera_direct',
      deviceLocation: ON_THE_BEACH,
      userNote: '   ',
    });
    assert.equal(report.userNote, undefined);
    assert.equal(report.isRealtimeVerified, true);
    assert.equal((await reports.getRecentReports('la-cicer')).length, 1);
  });

  test('rejects gallery uploads, missing location and photos taken away from the spot', async () => {
    await assert.rejects(
      useCase.execute({ spotId: 'la-cicer', photoUrl: TINY_JPEG, captureMethod: 'gallery_upload', deviceLocation: ON_THE_BEACH }),
      /cámara/
    );
    await assert.rejects(
      useCase.execute({ spotId: 'la-cicer', photoUrl: TINY_JPEG, captureMethod: 'camera_direct' }),
      /ubicación/
    );
    // Maspalomas is ~45 km from La Cícer
    await assert.rejects(
      useCase.execute({
        spotId: 'la-cicer',
        photoUrl: TINY_JPEG,
        captureMethod: 'camera_direct',
        deviceLocation: { lat: 27.735, lng: -15.586, accuracyM: 15 },
      }),
      /km de La Cícer/
    );
  });
});
