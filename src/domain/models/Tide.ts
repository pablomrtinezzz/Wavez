export type TideTrend = 'rising' | 'falling' | 'slack';
export type TidePhase = 'low' | 'mid' | 'high';

export interface TideState {
  /** Sea level relative to mean sea level, in metres. */
  heightM: number;
  trend: TideTrend;
  phase: TidePhase;
}

/** Half a tidal cycle (~6 h) on each side covers the surrounding high and low water. */
const PHASE_WINDOW_HOURS = 6;
/** Change over two hours below which the tide is considered slack. */
const SLACK_THRESHOLD_M = 0.06;

/**
 * Describes the tide at `index` of an hourly sea-level series by comparing it
 * with the surrounding high and low water.
 */
export function describeTide(series: (number | undefined)[], index: number): TideState | undefined {
  const heightM = series[index];
  if (heightM === undefined) return undefined;

  const window = series
    .slice(Math.max(0, index - PHASE_WINDOW_HOURS), index + PHASE_WINDOW_HOURS + 1)
    .filter((v): v is number => v !== undefined);
  const min = Math.min(...window);
  const max = Math.max(...window);
  const ratio = max - min > 0 ? (heightM - min) / (max - min) : 0.5;
  const phase: TidePhase = ratio < 0.33 ? 'low' : ratio > 0.67 ? 'high' : 'mid';

  const before = series[index - 1] ?? heightM;
  const after = series[index + 1] ?? heightM;
  const delta = after - before;
  const trend: TideTrend = Math.abs(delta) < SLACK_THRESHOLD_M ? 'slack' : delta > 0 ? 'rising' : 'falling';

  return { heightM, trend, phase };
}

export const TIDE_PHASE_LABEL: Record<TidePhase, string> = {
  low: 'baja',
  mid: 'media',
  high: 'alta',
};

export const TIDE_TREND_LABEL: Record<TideTrend, string> = {
  rising: 'subiendo',
  falling: 'bajando',
  slack: 'repunte',
};
