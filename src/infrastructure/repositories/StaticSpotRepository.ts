import { Spot } from '@/domain/models/Spot';
import { IslandId, ZoneId } from '@/domain/models/Island';
import { SpotRepository } from '@/domain/ports/SpotRepository';
import { ALL_SPOTS } from '@/infrastructure/spots';

export class StaticSpotRepository implements SpotRepository {
  public async getAllSpots(): Promise<Spot[]> {
    return ALL_SPOTS;
  }

  public async getSpotsByIsland(island: IslandId): Promise<Spot[]> {
    return ALL_SPOTS.filter((s) => s.island === island);
  }

  public async getSpotsByZone(zone: ZoneId): Promise<Spot[]> {
    return ALL_SPOTS.filter((s) => s.zone === zone);
  }

  public async getSpotById(id: string): Promise<Spot | null> {
    return ALL_SPOTS.find((s) => s.id === id) ?? null;
  }

  public async getSpotBySlug(slug: string): Promise<Spot | null> {
    return ALL_SPOTS.find((s) => s.slug === slug) ?? null;
  }
}
