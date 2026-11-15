import { MarineConditions, degreesToCompass } from '@/domain/models/MarineConditions';
import { canaryNow, toLocalHourKey } from '@/domain/models/LocalTime';
import {
  MarineWeatherService,
  HourlyMarineForecast,
  MarineDataUnavailableError,
} from '@/domain/ports/MarineWeatherService';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

type HourlySeries = Record<string, (number | null)[] | undefined>;

const PAST_DAYS = 7;
const FORECAST_DAYS = 7;

/**
 * Single source of truth for marine data: one 15-day hourly timeline per spot
 * (7 past days + 7 forecast days). "Current", "for timestamp" and "for date"
 * queries are all answered from that cached timeline, so the list, the time
 * scrubber and the detail view always agree and each spot costs two requests
 * per TTL instead of four.
 */
export class OpenMeteoMarineAdapter implements MarineWeatherService {
  private timelineCache = new Map<string, CacheEntry<HourlyMarineForecast[]>>();
  private inFlight = new Map<string, Promise<HourlyMarineForecast[]>>();
  private readonly CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

  public async getCurrentConditions(spotId: string, lat: number, lng: number): Promise<MarineConditions> {
    return this.getConditionsForTimestamp(spotId, lat, lng, toLocalHourKey(canaryNow()));
  }

  public async getConditionsForTimestamp(
    spotId: string,
    lat: number,
    lng: number,
    targetLocalHour: string
  ): Promise<MarineConditions> {
    const timeline = await this.getTimeline(lat, lng);
    if (!timeline.length) throw new MarineDataUnavailableError(spotId);

    // Timestamps are zero-padded local strings, so an exact match is the common
    // case; otherwise fall back to the closest hour by lexicographic distance.
    const exact = timeline.find((h) => h.timestamp === targetLocalHour);
    const match = exact ?? this.closestTo(timeline, targetLocalHour);
    return { ...match, spotId };
  }

  public async getHourlyForecast(
    spotId: string,
    lat: number,
    lng: number,
    hours: number = 48
  ): Promise<HourlyMarineForecast[]> {
    const timeline = await this.getTimeline(lat, lng);
    const nowKey = toLocalHourKey(canaryNow());
    return timeline
      .filter((h) => h.timestamp >= nowKey)
      .slice(0, hours)
      .map((h) => ({ ...h, spotId }));
  }

  public async getHourlyForecastForDate(
    spotId: string,
    lat: number,
    lng: number,
    dateStr: string
  ): Promise<HourlyMarineForecast[]> {
    const timeline = await this.getTimeline(lat, lng);
    return timeline.filter((h) => h.timestamp.startsWith(dateStr)).map((h) => ({ ...h, spotId }));
  }

  private closestTo(timeline: HourlyMarineForecast[], targetLocalHour: string): HourlyMarineForecast {
    const target = Date.parse(`${targetLocalHour}Z`);
    let best = timeline[0];
    let bestDiff = Infinity;
    for (const h of timeline) {
      const diff = Math.abs(Date.parse(`${h.timestamp}Z`) - target);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = h;
      }
    }
    return best;
  }

  private async getTimeline(lat: number, lng: number): Promise<HourlyMarineForecast[]> {
    const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
    const cached = this.timelineCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    // Deduplicate concurrent requests for the same coordinates
    const pending = this.inFlight.get(cacheKey);
    if (pending) return pending;

    const request = this.fetchTimeline(lat, lng)
      .then((data) => {
        if (data.length) {
          this.timelineCache.set(cacheKey, { data, expiresAt: Date.now() + this.CACHE_TTL_MS });
        }
        return data;
      })
      .catch((error) => {
        console.warn(`[OpenMeteoMarineAdapter] Timeline error for ${cacheKey}:`, error);
        // Serve stale data rather than nothing if we have it
        return cached?.data ?? [];
      })
      .finally(() => this.inFlight.delete(cacheKey));

    this.inFlight.set(cacheKey, request);
    return request;
  }

  private async fetchTimeline(lat: number, lng: number): Promise<HourlyMarineForecast[]> {
    const range = `past_days=${PAST_DAYS}&forecast_days=${FORECAST_DAYS}&timezone=Atlantic%2FCanary`;
    const marineUrl =
      `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}` +
      `&hourly=wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period,swell_wave_peak_period,wind_wave_height&${range}`;
    const weatherUrl =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m&${range}`;

    const signal = AbortSignal.timeout(9000);
    const [marineRes, weatherRes] = await Promise.all([
      fetch(marineUrl, { signal }),
      fetch(weatherUrl, { signal }),
    ]);

    if (!marineRes.ok || !weatherRes.ok) {
      throw new Error(`Open-Meteo HTTP error: marine=${marineRes.status}, weather=${weatherRes.status}`);
    }

    const marine = (await marineRes.json()).hourly as HourlySeries & { time?: string[] };
    const weather = (await weatherRes.json()).hourly as HourlySeries & { time?: string[] };
    const times: string[] = marine?.time ?? [];

    // Index weather rows by timestamp instead of assuming both arrays align
    const weatherIndex = new Map<string, number>((weather?.time ?? []).map((t, i) => [t, i]));

    const timeline: HourlyMarineForecast[] = [];
    for (let i = 0; i < times.length; i++) {
      const wi = weatherIndex.get(times[i]);
      if (wi === undefined) continue;

      const totalHeight = num(marine.wave_height?.[i]);
      const swellHeight = num(marine.swell_wave_height?.[i]) ?? totalHeight;
      const swellPeriod = num(marine.swell_wave_period?.[i]) ?? num(marine.wave_period?.[i]);
      const swellDir = num(marine.swell_wave_direction?.[i]) ?? num(marine.wave_direction?.[i]);
      const windSpeed = num(weather.wind_speed_10m?.[wi]);
      const windDir = num(weather.wind_direction_10m?.[wi]);

      // Skip hours with missing core values instead of inventing them
      if (swellHeight === undefined || swellPeriod === undefined || swellDir === undefined) continue;
      if (windSpeed === undefined || windDir === undefined) continue;

      timeline.push({
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
      });
    }

    return timeline;
  }
}

function num(value: number | null | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
