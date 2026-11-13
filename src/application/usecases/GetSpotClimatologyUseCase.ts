import { ClimatologyRepository } from '@/domain/ports/ClimatologyRepository';
import { SpotClimatology } from '@/domain/models/SeasonalClimatology';

export class GetSpotClimatologyUseCase {
  constructor(private climatologyRepo: ClimatologyRepository) {}

  public async execute(spotId: string): Promise<SpotClimatology | null> {
    return this.climatologyRepo.getClimatologyBySpotId(spotId);
  }

  public async getAll(): Promise<SpotClimatology[]> {
    return this.climatologyRepo.getAllClimatologies();
  }
}
