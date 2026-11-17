import { IslandId } from '@/domain/models/Island';
import { GRAN_CANARIA_COAST } from './granCanariaCoast';
import { GENERATED_COASTS } from './canaryCoasts';

/** [lat, lng] */
export type LatLng = [number, number];

/** Each island's outline: the main island first, then islets (Lobos, La Graciosa...). */
export const ISLAND_COASTS: Record<IslandId, LatLng[][]> = {
  'gran-canaria': [GRAN_CANARIA_COAST],
  tenerife: GENERATED_COASTS['tenerife'],
  lanzarote: GENERATED_COASTS['lanzarote'],
  fuerteventura: GENERATED_COASTS['fuerteventura'],
  'la-palma': GENERATED_COASTS['la-palma'],
  'la-gomera': GENERATED_COASTS['la-gomera'],
};

export interface Bounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export function boundsOf(rings: LatLng[][]): Bounds {
  const pts = rings.flat();
  return {
    minLat: Math.min(...pts.map((p) => p[0])),
    maxLat: Math.max(...pts.map((p) => p[0])),
    minLng: Math.min(...pts.map((p) => p[1])),
    maxLng: Math.max(...pts.map((p) => p[1])),
  };
}

/** Centre of an island's main outline, where its name is drawn. */
export function labelPointOf(island: IslandId): LatLng {
  const b = boundsOf([ISLAND_COASTS[island][0]]);
  return [(b.minLat + b.maxLat) / 2, (b.minLng + b.maxLng) / 2];
}
