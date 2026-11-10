import { StaticSpotRepository } from '@/infrastructure/repositories/StaticSpotRepository';
import { OpenMeteoMarineAdapter } from '@/infrastructure/adapters/OpenMeteoMarineAdapter';
import { SurfForecastScraperAdapter } from '@/infrastructure/adapters/SurfForecastScraperAdapter';
import { spotReportRepository } from '@/infrastructure/adapters/InMemorySpotReportRepository';
import { GetSpotsWithForecastUseCase } from './usecases/GetSpotsWithForecastUseCase';
import { GetSpotDetailUseCase } from './usecases/GetSpotDetailUseCase';
import { SubmitSpotReportUseCase } from './usecases/SubmitSpotReportUseCase';

// Singletons for infrastructure
const spotRepo = new StaticSpotRepository();
const marineService = new OpenMeteoMarineAdapter();
const energyService = new SurfForecastScraperAdapter();
const reportRepo = spotReportRepository;

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
