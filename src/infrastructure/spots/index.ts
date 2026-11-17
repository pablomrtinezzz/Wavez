import { Spot } from '@/domain/models/Spot';
import { IslandId } from '@/domain/models/Island';
import { GRAN_CANARIA_SPOTS } from './granCanaria';
import { TENERIFE_SPOTS } from './tenerife';
import { LANZAROTE_SPOTS } from './lanzarote';
import { FUERTEVENTURA_SPOTS } from './fuerteventura';
import { LA_PALMA_SPOTS } from './laPalma';
import { LA_GOMERA_SPOTS } from './laGomera';
import { EL_HIERRO_SPOTS } from './elHierro';

/** Every spot in the archipelago. Ids and slugs are unique across islands. */
export const ALL_SPOTS: Spot[] = [
  ...GRAN_CANARIA_SPOTS,
  ...TENERIFE_SPOTS,
  ...LANZAROTE_SPOTS,
  ...FUERTEVENTURA_SPOTS,
  ...LA_PALMA_SPOTS,
  ...LA_GOMERA_SPOTS,
  ...EL_HIERRO_SPOTS,
];

export function spotsOfIsland(island: IslandId): Spot[] {
  return ALL_SPOTS.filter((s) => s.island === island);
}
