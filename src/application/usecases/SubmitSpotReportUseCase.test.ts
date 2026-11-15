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

describe('SubmitSpotReportUseCase', () => {
  const reports = new InMemorySpotReportRepository();
  const useCase = new SubmitSpotReportUseCase(new StaticSpotRepository(), unavailableMarine, reports);

  test('rejects remote URLs and non-raster data URLs', async () => {
    for (const photoUrl of ['https://evil.example/x.jpg', 'data:image/svg+xml;base64,PHN2Zz4=', 'javascript:alert(1)']) {
      await assert.rejects(
        useCase.execute({ spotId: 'la-cicer', photoUrl, captureMethod: 'camera_direct' }),
        /JPEG, PNG o WebP/
      );
    }
  });

  test('stores a valid report and sanitizes the note', async () => {
    const report = await useCase.execute({
      spotId: 'la-cicer',
      photoUrl: TINY_JPEG,
      captureMethod: 'camera_direct',
      userNote: '   ',
    });
    assert.equal(report.userNote, undefined);
    assert.equal(report.isRealtimeVerified, true);
    assert.equal((await reports.getRecentReports('la-cicer')).length, 1);
  });
});
