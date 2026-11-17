import { Spot } from '@/domain/models/Spot';
import { IslandId } from '@/domain/models/Island';

/** Spot data as written in the per-island files: the island is added here. */
export type SpotInput = Omit<Spot, 'island'>;

export function defineSpots(island: IslandId, spots: SpotInput[]): Spot[] {
  return spots.map((spot) => ({ ...spot, island }));
}

const EARTH_RADIUS_KM = 6371;

/**
 * Point `km` kilometres out to sea from a spot, towards `bearingDeg` (the
 * direction the spot faces). Used as the spot's ocean model point so the wave
 * data is read in open water on the right side of the island, not in a model
 * cell that touches land or faces another coast.
 */
export function offshore(lat: number, lng: number, bearingDeg: number, km = 8): { lat: number; lng: number } {
  const d = km / EARTH_RADIUS_KM;
  const b = (bearingDeg * Math.PI) / 180;
  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lng * Math.PI) / 180;
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(d) + Math.cos(φ1) * Math.sin(d) * Math.cos(b));
  const λ2 = λ1 + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(φ1), Math.cos(d) - Math.sin(φ1) * Math.sin(φ2));
  return { lat: +((φ2 * 180) / Math.PI).toFixed(3), lng: +((λ2 * 180) / Math.PI).toFixed(3) };
}
