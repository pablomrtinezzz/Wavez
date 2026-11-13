import { SpotClimatology } from '../models/SeasonalClimatology';

export interface ClimatologyRepository {
  getClimatologyBySpotId(spotId: string): Promise<SpotClimatology | null>;
  getAllClimatologies(): Promise<SpotClimatology[]>;
}
