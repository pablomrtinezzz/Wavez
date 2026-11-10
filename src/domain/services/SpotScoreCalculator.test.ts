import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { SpotScoreCalculator } from './SpotScoreCalculator';
import { Spot } from '../models/Spot';
import { MarineConditions } from '../models/MarineConditions';

const mockPlayaDelHombre: Spot = {
  id: 'playa-del-hombre',
  slug: 'playa-del-hombre',
  name: 'Playa del Hombre',
  zone: 'telde-este',
  location: { lat: 28.006, lng: -15.378, municipality: 'Telde' },
  breakType: 'beach-break',
  skillLevel: 'all-levels',
  description: 'Picos de arena consistentes.',
  idealConditions: {
    minSwellHeightM: 1.0,
    maxSwellHeightM: 2.5,
    minPeriodSec: 10,
    optimalSwellDegrees: { min: 0, max: 90 }, // N to E
    favorableWindDegrees: { min: 240, max: 320 }, // W/NW offshore
    maxFavorableWindKmh: 25,
    preferredTide: 'mid',
  },
};

describe('SpotScoreCalculator', () => {
  test('returns "firing" when swell, wind and period are optimal', () => {
    const perfectConditions: MarineConditions = {
      spotId: 'playa-del-hombre',
      timestamp: '2026-11-10T12:00:00Z',
      totalWaveHeightM: 1.6,
      primarySwell: {
        heightM: 1.6,
        periodSec: 12,
        peakPeriodSec: 14,
        directionDeg: 45, // NE
        compassDir: 'NE',
      },
      wind: {
        speedKmh: 12,
        gustsKmh: 16,
        directionDeg: 270, // W (Offshore)
        compassDir: 'W',
      },
    };

    const result = SpotScoreCalculator.calculate(mockPlayaDelHombre, perfectConditions);

    assert.equal(result.spotId, 'playa-del-hombre');
    assert.ok(result.overallScore >= 80, `Expected score >= 80, got ${result.overallScore}`);
    assert.equal(result.quality, 'firing');
    assert.ok(result.pros.some((p) => p.includes('Offshore')));
    assert.ok(result.pros.some((p) => p.includes('Periodo oceánico')));
  });

  test('penalizes strong onshore wind and messy swell', () => {
    const onshoreConditions: MarineConditions = {
      spotId: 'playa-del-hombre',
      timestamp: '2026-11-10T12:00:00Z',
      totalWaveHeightM: 0.8,
      primarySwell: {
        heightM: 0.6,
        periodSec: 6,
        directionDeg: 180, // S (wrong angle for Telde)
        compassDir: 'S',
      },
      wind: {
        speedKmh: 35, // Strong onshore
        gustsKmh: 45,
        directionDeg: 70, // ENE
        compassDir: 'ENE',
      },
    };

    const result = SpotScoreCalculator.calculate(mockPlayaDelHombre, onshoreConditions);

    assert.ok(result.overallScore < 40, `Expected score < 40, got ${result.overallScore}`);
    assert.ok(['poor', 'flat'].includes(result.quality));
    assert.ok(result.cons.some((c) => c.includes('Onshore deshecho')));
  });
});
