import { StaticSpotRepository } from '@/infrastructure/repositories/StaticSpotRepository';
import { OpenMeteoMarineAdapter } from '@/infrastructure/adapters/OpenMeteoMarineAdapter';
import { SnapshotMarineAdapter } from '@/infrastructure/adapters/SnapshotMarineAdapter';
import { spotReportRepository } from '@/infrastructure/adapters/InMemorySpotReportRepository';
import { StaticClimatologyRepository } from '@/infrastructure/repositories/StaticClimatologyRepository';
import { GetSpotsWithForecastUseCase } from './usecases/GetSpotsWithForecastUseCase';
import { GetSpotDetailUseCase } from './usecases/GetSpotDetailUseCase';
import { SubmitSpotReportUseCase } from './usecases/SubmitSpotReportUseCase';
import { GetSpotHourlyEvolutionUseCase } from './usecases/GetSpotHourlyEvolutionUseCase';
import { GetSpotClimatologyUseCase } from './usecases/GetSpotClimatologyUseCase';

// Singletons for infrastructure
const spotRepo = new StaticSpotRepository();
// Marine data published every 15 min by the "Refresh marine data" GitHub Action,
// with live Open-Meteo as fallback
const MARINE_SNAPSHOT_URL =
  process.env.MARINE_SNAPSHOT_URL ??
  'https://raw.githubusercontent.com/pablomrtinezzz/Wavez/data/marine-snapshot.json';
const marineService = new SnapshotMarineAdapter(MARINE_SNAPSHOT_URL, new OpenMeteoMarineAdapter());
const reportRepo = spotReportRepository;
const climatologyRepo = new StaticClimatologyRepository();

// Use case instances
export const getSpotsWithForecastUseCase = new GetSpotsWithForecastUseCase(
  spotRepo,
  marineService,
  reportRepo
);

export const getSpotDetailUseCase = new GetSpotDetailUseCase(
  spotRepo,
  marineService,
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
