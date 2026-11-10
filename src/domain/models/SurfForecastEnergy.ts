export interface SurfForecastEnergy {
  spotSlug: string;
  timestamp: string; // ISO-8601
  energyKj: number;
  starRating?: number; // 0 to 10 or 0 to 5
  source: 'scraped' | 'calculated_fallback';
  waveHeightM?: number;
  periodSec?: number;
}

/**
 * Fallback calculation of wave energy in kJ when scraper is unavailable.
 * In ocean physics, deep water wave power flux is approximately:
 * P = (rho * g^2 / (64 * pi)) * Hs^2 * Te
 * Surf-Forecast empirical energy in kJ roughly correlates to:
 * E ~ 0.5 * rho * g * (Hs/2)^2 * T / 1000 or simplified metric: ~ 40 * Hs^2 * T
 */
export function estimateWaveEnergyKj(waveHeightM: number, periodSec: number): number {
  if (waveHeightM <= 0 || periodSec <= 0) return 0;
  // Scaled empirical approximation matching Surf-Forecast kJ scale:
  // e.g. 1.5m at 11s -> 40 * 2.25 * 11 = 990 kJ (~1000 kJ)
  // e.g. 2.0m at 14s -> 40 * 4.0 * 14 = 2240 kJ
  return Math.round(40 * Math.pow(waveHeightM, 2) * periodSec);
}
