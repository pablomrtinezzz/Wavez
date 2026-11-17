import { Spot } from '@/domain/models/Spot';
import { IslandId } from '@/domain/models/Island';
import { GRAN_CANARIA_SPOTS } from './granCanaria';

/** Every spot in the archipelago. Ids and slugs are unique across islands. */
export const ALL_SPOTS: Spot[] = [...GRAN_CANARIA_SPOTS];

export function spotsOfIsland(island: IslandId): Spot[] {
  return ALL_SPOTS.filter((s) => s.island === island);
}
