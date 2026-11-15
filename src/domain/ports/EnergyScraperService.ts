import { SurfForecastEnergy } from '../models/SurfForecastEnergy';

export interface EnergyScraperService {
  getSpotEnergy(spotSlug: string, fallbackWaveHeightM?: number, fallbackPeriodSec?: number): Promise<SurfForecastEnergy>;
}
