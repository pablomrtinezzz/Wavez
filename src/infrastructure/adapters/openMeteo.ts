import { degreesToCompass } from '@/domain/models/MarineConditions';
import { describeTide } from '@/domain/models/Tide';
import { Daylight, HourlyMarineForecast } from '@/domain/ports/MarineWeatherService';

/**
 * Raw Open-Meteo responses for one location, as returned by the API. This is
 * also the format stored in the GitHub-generated snapshot, so the live
 * adapter and the snapshot share exactly the same parsing.
 */
export interface OpenMeteoRaw {
  marine: { hourly?: Record<string, (number | string | null)[] | undefined> };
  weather: {
    hourly?: Record<string, (number | string | null)[] | undefined>;
    daily?: { time?: string[]; sunrise?: string[]; sunset?: string[] };
  };
}

export interface SpotTimeline {
  hours: HourlyMarineForecast[];
  /** Keyed by 'YYYY-MM-DD' */
  daylight: Map<string, Daylight>;
}

export const EMPTY_TIMELINE: SpotTimeline = { hours: [], daylight: new Map() };

export const PAST_DAYS = 7;
export const FORECAST_DAYS = 7;

const MARINE_VARS =
  'wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period,swell_wave_peak_period,wind_wave_height,sea_surface_temperature,sea_level_height_msl';
const WEATHER_VARS = 'wind_speed_10m,wind_direction_10m,wind_gusts_10m';

/**
 * Downloads the 15-day hourly timeline for any number of locations in two
 * requests (Open-Meteo accepts comma-separated coordinates).
 */
export interface ForecastLocation {
  /** Spot location, used for wind and daylight. */
  lat: number;
  lng: number;
  /** Optional open-sea point for the ocean model (see Spot.marinePoint). */
  marine?: { lat: number; lng: number };
}

export interface FetchOptions {
  timeoutMs?: number;
  /**
   * Extra attempts after a rate limit (429), server error (5xx) or network error. Shared CI
   * runners often hit Open-Meteo's per-IP limit, so the scheduled job retries;
   * the website does not (it has its own fallback).
   */
  retries?: number;
}

const RETRY_DELAYS_MS = [15_000, 45_000, 90_000];

/** "fetch failed" hides the real reason (ECONNRESET, ENOTFOUND, timeout...) in `cause`. */
function describeFetchError(error: unknown): string {
  const err = error as Error & { cause?: { code?: string; message?: string } };
  const cause = err.cause ? ` (${err.cause.code ?? err.cause.message ?? String(err.cause)})` : '';
  return `${err.name}: ${err.message}${cause}`;
}

/**
 * fetch() that retries on 429/5xx (honouring Retry-After) and on network
 * errors such as dropped connections or timeouts.
 */
async function fetchWithRetry(url: string, timeoutMs: number, retries: number): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    } catch (error) {
      const reason = describeFetchError(error);
      if (attempt >= retries) throw new Error(`Open-Meteo request failed: ${reason}`);
      const wait = RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)];
      console.warn(`[Open-Meteo] ${reason}, retrying in ${Math.round(wait / 1000)} s (${attempt + 1}/${retries})`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt >= retries) return res;
    const retryAfterS = Number(res.headers.get('retry-after'));
    const wait = Number.isFinite(retryAfterS) && retryAfterS > 0 ? Math.min(retryAfterS * 1000, 120_000) : RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)];
    console.warn(`[Open-Meteo] HTTP ${res.status}, retrying in ${Math.round(wait / 1000)} s (${attempt + 1}/${retries})`);
    await new Promise((r) => setTimeout(r, wait));
  }
}

export async function fetchOpenMeteo(
  locations: ForecastLocation[],
  { timeoutMs = 9000, retries = 0 }: FetchOptions = {}
): Promise<OpenMeteoRaw[]> {
  const join = (values: number[]) => values.join(',');
  const marinePoints = locations.map((l) => l.marine ?? l);
  const range = `past_days=${PAST_DAYS}&forecast_days=${FORECAST_DAYS}&timezone=Atlantic%2FCanary`;
  const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${join(marinePoints.map((p) => p.lat))}&longitude=${join(marinePoints.map((p) => p.lng))}&hourly=${MARINE_VARS}&${range}`;
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${join(locations.map((l) => l.lat))}&longitude=${join(locations.map((l) => l.lng))}&hourly=${WEATHER_VARS}&daily=sunrise,sunset&${range}`;

  const [marineRes, weatherRes] = await Promise.all([
    fetchWithRetry(marineUrl, timeoutMs, retries),
    fetchWithRetry(weatherUrl, timeoutMs, retries),
  ]);
  if (!marineRes.ok || !weatherRes.ok) {
    throw new Error(`Open-Meteo HTTP error: marine=${marineRes.status}, weather=${weatherRes.status}`);
  }

  // A single location comes back as an object, several as an array
  const asList = <T>(json: T | T[]): T[] => (Array.isArray(json) ? json : [json]);
  const marine = asList(await marineRes.json());
  const weather = asList(await weatherRes.json());
  if (marine.length !== locations.length || weather.length !== locations.length) {
    throw new Error('Open-Meteo returned an unexpected number of locations');
  }
  return locations.map((_, i) => ({ marine: marine[i], weather: weather[i] }));
}

function num(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/** Builds the hourly timeline, skipping hours with missing core values instead of inventing them. */
export function parseOpenMeteo(raw: OpenMeteoRaw): SpotTimeline {
  const marine = raw.marine?.hourly ?? {};
  const weather = raw.weather?.hourly ?? {};
  const times = (marine.time ?? []) as string[];
  const seaLevel = (marine.sea_level_height_msl ?? []).map(num);

  // Index weather rows by timestamp instead of assuming both arrays align
  const weatherIndex = new Map<string, number>(((weather.time ?? []) as string[]).map((t, i) => [t, i]));

  const hours: HourlyMarineForecast[] = [];
  for (let i = 0; i < times.length; i++) {
    const wi = weatherIndex.get(times[i]);
    if (wi === undefined) continue;

    const totalHeight = num(marine.wave_height?.[i]);
    const swellHeight = num(marine.swell_wave_height?.[i]) ?? totalHeight;
    const swellPeriod = num(marine.swell_wave_period?.[i]) ?? num(marine.wave_period?.[i]);
    const swellDir = num(marine.swell_wave_direction?.[i]) ?? num(marine.wave_direction?.[i]);
    const windSpeed = num(weather.wind_speed_10m?.[wi]);
    const windDir = num(weather.wind_direction_10m?.[wi]);

    if (swellHeight === undefined || swellPeriod === undefined || swellDir === undefined) continue;
    if (windSpeed === undefined || windDir === undefined) continue;

    hours.push({
      spotId: '',
      timestamp: times[i],
      totalWaveHeightM: totalHeight ?? swellHeight,
      primarySwell: {
        heightM: swellHeight,
        periodSec: swellPeriod,
        peakPeriodSec: num(marine.swell_wave_peak_period?.[i]),
        directionDeg: swellDir,
        compassDir: degreesToCompass(swellDir),
      },
      windWaveHeightM: num(marine.wind_wave_height?.[i]),
      wind: {
        speedKmh: windSpeed,
        gustsKmh: num(weather.wind_gusts_10m?.[wi]) ?? windSpeed,
        directionDeg: windDir,
        compassDir: degreesToCompass(windDir),
      },
      seaSurfaceTemperatureC: num(marine.sea_surface_temperature?.[i]),
      tide: describeTide(seaLevel, i),
    });
  }

  const daily = raw.weather?.daily;
  const daylight = new Map<string, Daylight>();
  (daily?.time ?? []).forEach((date, i) => {
    const sunrise = daily?.sunrise?.[i];
    const sunset = daily?.sunset?.[i];
    if (sunrise && sunset) daylight.set(date, { sunrise, sunset });
  });

  return { hours, daylight };
}
