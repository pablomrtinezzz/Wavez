import { StaticSpotRepository } from '@/infrastructure/repositories/StaticSpotRepository';
import { OpenMeteoMarineAdapter } from '@/infrastructure/adapters/OpenMeteoMarineAdapter';
import { SurfForecastScraperAdapter } from '@/infrastructure/adapters/SurfForecastScraperAdapter';
import { spotReportRepository } from '@/infrastructure/adapters/InMemorySpotReportRepository';
import { StaticClimatologyRepository } from '@/infrastructure/repositories/StaticClimatologyRepository';
import { GetSpotsWithForecastUseCase } from './usecases/GetSpotsWithForecastUseCase';
import { GetSpotDetailUseCase } from './usecases/GetSpotDetailUseCase';
import { SubmitSpotReportUseCase } from './usecases/SubmitSpotReportUseCase';
import { GetSpotHourlyEvolutionUseCase } from './usecases/GetSpotHourlyEvolutionUseCase';
import { GetSpotClimatologyUseCase } from './usecases/GetSpotClimatologyUseCase';

// Singletons for infrastructure
const spotRepo = new StaticSpotRepository();
const marineService = new OpenMeteoMarineAdapter();
const energyService = new SurfForecastScraperAdapter();
const reportRepo = spotReportRepository;
const climatologyRepo = new StaticClimatologyRepository();

// Use case instances
export const getSpotsWithForecastUseCase = new GetSpotsWithForecastUseCase(
  spotRepo,
  marineService,
  energyService,
  reportRepo
);

export const getSpotDetailUseCase = new GetSpotDetailUseCase(
  spotRepo,
  marineService,
  energyService,
  reportRepo
);

export const submitSpotReportUseCase = new SubmitSpotReportUseCase(
  spotRepo,
  marineService,
  reportRepo
);

export const getSpotHourlyEvolutionUseCase = new GetSpotHourlyEvolutionUseCase(
  spotRepo,
  marineService
);

export const getSpotClimatologyUseCase = new GetSpotClimatologyUseCase(
  climatologyRepo
);
