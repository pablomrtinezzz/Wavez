import { Spot } from '../models/Spot';
import { IslandId, ZoneId } from '../models/Island';

export interface SpotRepository {
  getAllSpots(): Promise<Spot[]>;
  getSpotsByIsland(island: IslandId): Promise<Spot[]>;
  getSpotsByZone(zone: ZoneId): Promise<Spot[]>;
  getSpotById(id: string): Promise<Spot | null>;
  getSpotBySlug(slug: string): Promise<Spot | null>;
}
