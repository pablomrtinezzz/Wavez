import { TideState } from './Tide';

export interface SwellComponent {
  heightM: number;
  periodSec: number;
  peakPeriodSec?: number;
  directionDeg: number;
  compassDir: string;
}

export interface WindCondition {
  speedKmh: number;
  gustsKmh: number;
  directionDeg: number;
  compassDir: string;
}

export interface MarineConditions {
  spotId: string;
  timestamp: string; // ISO-8601
  totalWaveHeightM: number;
  primarySwell: SwellComponent;
  secondarySwell?: SwellComponent;
  windWaveHeightM?: number;
  wind: WindCondition;
  seaSurfaceTemperatureC?: number;
  /** Estimated tide from Open-Meteo sea level (model data, not for navigation). */
  tide?: TideState;
}

export function degreesToCompass(degrees: number): string {
  const normalized = ((degrees % 360) + 360) % 360;
  const directions = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW',
  ];
  const index = Math.round(normalized / 22.5) % 16;
  return directions[index];
}

export function isDirectionInRange(deg: number, min: number, max: number): boolean {
  const norm = ((deg % 360) + 360) % 360;
  const normMin = ((min % 360) + 360) % 360;
  const normMax = ((max % 360) + 360) % 360;

  if (normMin <= normMax) {
    return norm >= normMin && norm <= normMax;
  }
  // Crossing 0 / 360 (e.g. 315 to 45)
  return norm >= normMin || norm <= normMax;
}
