import { test, describe } from 'node:test';
import assert from 'node:assert';
import { GetSpotHourlyEvolutionUseCase } from './GetSpotHourlyEvolutionUseCase';
import { StaticSpotRepository } from '@/infrastructure/repositories/StaticSpotRepository';
import { MarineWeatherService, HourlyMarineForecast, Daylight } from '@/domain/ports/MarineWeatherService';
import { MarineConditions } from '@/domain/models/MarineConditions';

class MockMarineWeatherService implements MarineWeatherService {
  async getCurrentConditions(spotId: string): Promise<MarineConditions> {
    return {
      spotId,
      timestamp: '2026-11-13T10:00:00',
      totalWaveHeightM: 1.5,
      primarySwell: { heightM: 1.5, periodSec: 12, directionDeg: 330, compassDir: 'NNW' },
      wind: { speedKmh: 10, gustsKmh: 14, directionDeg: 180, compassDir: 'S' },
    };
  }

  async getConditionsForTimestamp(spotId: string, lat: number, lng: number, targetIso: string): Promise<MarineConditions> {
    return {
      spotId,
      timestamp: targetIso,
      totalWaveHeightM: 1.8,
      primarySwell: { heightM: 1.8, periodSec: 14, directionDeg: 320, compassDir: 'NW' },
      wind: { speedKmh: 8, gustsKmh: 12, directionDeg: 160, compassDir: 'SSE' },
    };
  }

  async getHourlyForecast(): Promise<HourlyMarineForecast[]> {
    return [];
  }

  async getDaylight(spotId: string, lat: number, lng: number, dateStr: string): Promise<Daylight | null> {
    return { sunrise: `${dateStr}T07:23`, sunset: `${dateStr}T18:08` };
  }

  async getHourlyForecastForDate(
    spotId: string,
    lat: number,
    lng: number,
    dateStr: string
  ): Promise<HourlyMarineForecast[]> {
    const hours: HourlyMarineForecast[] = [];
    for (let h = 0; h < 24; h++) {
      const hh = String(h).padStart(2, '0');
      // Peak conditions around 09:00
      const isPeak = h >= 8 && h <= 10;
      hours.push({
        spotId,
        timestamp: `${dateStr}T${hh}:00:00`,
        totalWaveHeightM: isPeak ? 2.0 : 1.2,
        primarySwell: {
          heightM: isPeak ? 2.0 : 1.2,
          periodSec: isPeak ? 14 : 10,
          directionDeg: 320,
          compassDir: 'NW',
        },
        wind: {
          speedKmh: isPeak ? 8 : 22,
          gustsKmh: isPeak ? 12 : 30,
          directionDeg: isPeak ? 170 : 45, // SSE offshore at peak, NE onshore later
          compassDir: isPeak ? 'SSE' : 'NE',
        },
      });
    }
    return hours;
  }
}

describe('GetSpotHourlyEvolutionUseCase', () => {
  const spotRepo = new StaticSpotRepository();
  const mockMarine = new MockMarineWeatherService();
  const useCase = new GetSpotHourlyEvolutionUseCase(spotRepo, mockMarine);

  test('calculates 24-hour timeline and identifies best daylight window', async () => {
    const result = await useCase.execute('la-cicer', '2026-11-13');

    assert.ok(result, 'Result should not be null');
    assert.strictEqual(result.spotId, 'la-cicer');
    assert.strictEqual(result.hourlyPoints.length, 24);

    // Verify hourly points have proper structure
    const hour9 = result.hourlyPoints.find((p) => p.hour === 9);
    assert.ok(hour9);
    assert.strictEqual(hour9.timeLabel, '09:00');
    assert.strictEqual(hour9.waveHeightM, 2.0);
    assert.strictEqual(hour9.periodSec, 14);
    assert.strictEqual(hour9.energyKj, Math.round(40 * 4 * 14));
    assert.ok(hour9.score.overallScore > 70, 'Peak morning hour should have high score');

    // Verify best window was calculated
    assert.ok(result.bestWindow, 'Best window should be defined');
    assert.ok(result.bestWindow.summary.includes('Ventana óptima'));
    // Peak conditions span 08:00-10:59 in the mock
    assert.strictEqual(result.bestWindow.startHour, 8);
    assert.strictEqual(result.bestWindow.endHour, 11);

    assert.strictEqual(result.daylight?.sunrise, '2026-11-13T07:23');

    // Daily summary
    assert.strictEqual(result.dailySummary.maxWaveHeightM, 2.0);
    assert.strictEqual(result.dailySummary.minWaveHeightM, 1.2);
  });

  test('returns null if spot does not exist', async () => {
    const result = await useCase.execute('non-existent-spot', '2026-11-13');
    assert.strictEqual(result, null);
  });
});
