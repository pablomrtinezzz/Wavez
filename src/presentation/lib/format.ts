import { ConditionQuality } from '@/domain/models/SpotScore';
import { BreakType, SkillLevel } from '@/domain/models/Spot';
import { ALL_ZONES, IslandId, ZoneId, getIsland } from '@/domain/models/Island';
import { TideState, TIDE_PHASE_LABEL, TIDE_TREND_LABEL } from '@/domain/models/Tide';
import { degreesToCompass } from '@/domain/models/MarineConditions';

/**
 * Quality bands come from the domain score, so UI and ranking never disagree.
 * `min` mirrors the thresholds in SpotScoreCalculator (on the 0-10 scale).
 */
export const QUALITY: Record<
  ConditionQuality,
  { label: string; color: string; onColor: string; tint: string; rank: number; min: number }
> = {
  firing: { label: 'Épico', color: 'var(--color-q-firing)', onColor: '#fff', tint: 'color-mix(in oklab, var(--color-q-firing) 13%, transparent)', rank: 4, min: 8.2 },
  good: { label: 'Muy bueno', color: 'var(--color-q-good)', onColor: '#fff', tint: 'color-mix(in oklab, var(--color-q-good) 13%, transparent)', rank: 3, min: 6.8 },
  fair: { label: 'Surfeable', color: 'var(--color-q-fair)', onColor: 'var(--color-ink)', tint: 'color-mix(in oklab, var(--color-q-fair) 16%, transparent)', rank: 2, min: 5 },
  poor: { label: 'Difícil', color: 'var(--color-q-poor)', onColor: '#fff', tint: 'color-mix(in oklab, var(--color-q-poor) 12%, transparent)', rank: 1, min: 3 },
  flat: { label: 'Plato', color: 'var(--color-q-flat)', onColor: '#fff', tint: 'color-mix(in oklab, var(--color-q-flat) 18%, transparent)', rank: 0, min: 0 },
};

export const QUALITY_ORDER: ConditionQuality[] = ['firing', 'good', 'fair', 'poor', 'flat'];

/** Gran Canaria's zones (the home page still covers this island only). */
export const ZONES = getIsland('gran-canaria').zones;

export const ZONE_LABEL: Record<ZoneId, string> = Object.fromEntries(
  ALL_ZONES.map((z) => [z.id, z.label])
) as Record<ZoneId, string>;

export function zonesOf(island: IslandId) {
  return getIsland(island).zones;
}

export const BREAK_LABEL: Record<BreakType, string> = {
  'beach-break': 'Beach break',
  'reef-break': 'Reef',
  'point-break': 'Point break',
  slab: 'Slab',
};

export const SKILL_LABEL: Record<SkillLevel, string> = {
  'all-levels': 'Todos los niveles',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
  expert: 'Experto',
};

export function formatScore(score100: number): string {
  return (Math.min(100, Math.max(0, score100)) / 10).toFixed(1);
}

export function formatMeters(m: number): string {
  return `${m.toFixed(1)} m`;
}

export function formatHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

/** '2026-11-15T07:23' → '07:23' */
export function formatLocalClock(localTimestamp: string): string {
  return localTimestamp.slice(11, 16);
}

export function formatTide(tide: TideState): string {
  return `${capitalize(TIDE_PHASE_LABEL[tide.phase])}, ${TIDE_TREND_LABEL[tide.trend]}`;
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** 'YYYY-MM-DD' → 'domingo 15 de noviembre' (date-only, no timezone shift). */
export function formatLongDate(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
}

export function formatDayParts(dateStr: string): { weekday: string; day: number; month: string } {
  const d = new Date(`${dateStr}T12:00:00Z`);
  const weekday = d.toLocaleDateString('es-ES', { weekday: 'short', timeZone: 'UTC' }).replace('.', '');
  const month = d.toLocaleDateString('es-ES', { month: 'short', timeZone: 'UTC' }).replace('.', '');
  return { weekday: capitalize(weekday), day: d.getUTCDate(), month };
}

export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const minutes = Math.round(Math.max(0, now - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'ahora mismo';
  if (minutes < 60) return `hace ${minutes} min`;
  return `hace ${Math.round(minutes / 60)} h`;
}

/**
 * Wind relative to the spot: offshore when it blows within the spot's
 * favourable sector, glassy when it is too light to matter.
 */
export function describeWind(
  speedKmh: number,
  isOffshore: boolean
): { label: string; tone: 'good' | 'neutral' | 'bad' } {
  if (speedKmh <= 8) return { label: 'Calma', tone: 'good' };
  if (isOffshore) return { label: 'Terral', tone: 'good' };
  if (speedKmh > 25) return { label: 'Onshore fuerte', tone: 'bad' };
  return { label: 'Cruzado', tone: 'neutral' };
}

/** { min: 290, max: 20 } → 'WNW – NNE' */
export function degreesToCompassRange(range: { min: number; max: number }): string {
  return `${degreesToCompass(range.min)} – ${degreesToCompass(range.max)}`;
}
