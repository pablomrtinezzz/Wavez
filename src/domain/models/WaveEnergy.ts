export interface WaveEnergy {
  /** Local timestamp of the conditions the estimate refers to. */
  timestamp: string;
  /** Energy index in "kJ" on the scale popularised by Surf-Forecast. */
  energyKj: number;
}

/**
 * Wave energy index from significant height (m) and period (s).
 *
 * Deep-water wave power per metre of crest is P = ρ·g²·H²·T / (64·π)
 * ≈ 0.49·H²·T kW/m. Surfers are used to Surf-Forecast's "kJ" figure, which
 * grows with the same H²·T product; 40·H²·T reproduces that scale closely
 * (1.5 m @ 11 s → ~990 kJ, 2 m @ 14 s → 2240 kJ). It is an index for
 * comparing spots and hours, not a physical energy measurement.
 */
export function estimateWaveEnergyKj(waveHeightM: number, periodSec: number): number {
  if (waveHeightM <= 0 || periodSec <= 0) return 0;
  return Math.round(40 * Math.pow(waveHeightM, 2) * periodSec);
}
