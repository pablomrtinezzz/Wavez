import { Spot, ZoneId } from '../models/Spot';

export interface SpotRepository {
  getAllSpots(): Promise<Spot[]>;
  getSpotsByZone(zone: ZoneId): Promise<Spot[]>;
  getSpotById(id: string): Promise<Spot | null>;
  getSpotBySlug(slug: string): Promise<Spot | null>;
}
