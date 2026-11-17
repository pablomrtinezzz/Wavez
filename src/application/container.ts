import { StaticSpotRepository } from '@/infrastructure/repositories/StaticSpotRepository';
import { ALL_SPOTS } from '@/infrastructure/spots';
import { OpenMeteoMarineAdapter } from '@/infrastructure/adapters/OpenMeteoMarineAdapter';
import { SnapshotMarineAdapter } from '@/infrastructure/adapters/SnapshotMarineAdapter';
import { createClient } from '@supabase/supabase-js';
import { InMemorySpotReportRepository } from '@/infrastructure/adapters/InMemorySpotReportRepository';
import { SupabaseSpotReportRepository } from '@/infrastructure/adapters/SupabaseSpotReportRepository';
import { SpotReportRepository } from '@/domain/ports/SpotReportRepository';
import { StaticClimatologyRepository } from '@/infrastructure/repositories/StaticClimatologyRepository';
import { GetSpotsWithForecastUseCase } from './usecases/GetSpotsWithForecastUseCase';
import { GetSpotDetailUseCase } from './usecases/GetSpotDetailUseCase';
import { SubmitSpotReportUseCase } from './usecases/SubmitSpotReportUseCase';
import { GetSpotHourlyEvolutionUseCase } from './usecases/GetSpotHourlyEvolutionUseCase';
import { GetSpotClimatologyUseCase } from './usecases/GetSpotClimatologyUseCase';

// Singletons for infrastructure
const spotRepo = new StaticSpotRepository();
// Marine data checked every 15 min by the "Refresh marine data" GitHub Action,
// with live Open-Meteo as fallback
const MARINE_SNAPSHOT_URL =
  process.env.MARINE_SNAPSHOT_URL ??
  'https://raw.githubusercontent.com/pablomrtinezzz/Wavez/data/marine-snapshot.json';
const marineService = new SnapshotMarineAdapter(
  MARINE_SNAPSHOT_URL,
  new OpenMeteoMarineAdapter((spotId) => ALL_SPOTS.find((s) => s.id === spotId)?.marinePoint)
);
// Community photos: Supabase when configured, process memory otherwise (dev/tests only)
// Accept the project URL with or without the "/rest/v1/" suffix the dashboard sometimes shows
const SUPABASE_URL = process.env.SUPABASE_URL?.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
export const reportsArePersistent = Boolean(SUPABASE_URL && SUPABASE_SECRET_KEY);
const reportRepo: SpotReportRepository = reportsArePersistent
  ? new SupabaseSpotReportRepository(
      createClient(SUPABASE_URL!, SUPABASE_SECRET_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })
    )
  : new InMemorySpotReportRepository();
if (!reportsArePersistent && process.env.NODE_ENV === 'production') {
  console.warn('[container] Supabase is not configured: community photos are kept in memory only.');
}
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
