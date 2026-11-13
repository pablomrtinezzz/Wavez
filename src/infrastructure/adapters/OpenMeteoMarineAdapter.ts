import { MarineConditions, degreesToCompass } from '@/domain/models/MarineConditions';
import { MarineWeatherService, HourlyMarineForecast } from '@/domain/ports/MarineWeatherService';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class OpenMeteoMarineAdapter implements MarineWeatherService {
  private cache = new Map<string, CacheEntry<MarineConditions>>();
  private hourlyCache = new Map<string, CacheEntry<HourlyMarineForecast[]>>();
  private multiDayTimelineCache = new Map<string, CacheEntry<HourlyMarineForecast[]>>();
  private readonly CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

  public async getCurrentConditions(spotId: string, lat: number, lng: number): Promise<MarineConditions> {
    const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return { ...cached.data, spotId };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period,swell_wave_peak_period,wind_wave_height&timezone=Atlantic/Canary`;
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=Atlantic/Canary`;

      const [marineRes, weatherRes] = await Promise.all([
        fetch(marineUrl, { signal: controller.signal, next: { revalidate: 600 } } as RequestInit),
        fetch(weatherUrl, { signal: controller.signal, next: { revalidate: 600 } } as RequestInit),
      ]);

      clearTimeout(timeoutId);

      if (!marineRes.ok || !weatherRes.ok) {
        throw new Error(`Open-Meteo HTTP error: marine=${marineRes.status}, weather=${weatherRes.status}`);
      }

      const marineJson = await marineRes.json();
      const weatherJson = await weatherRes.json();

      const mCurrent = marineJson.current || {};
      const wCurrent = weatherJson.current || {};

      const swellDeg = mCurrent.swell_wave_direction ?? mCurrent.wave_direction ?? 0;
      const windDeg = wCurrent.wind_direction_10m ?? 0;

      const conditions: MarineConditions = {
        spotId,
        timestamp: mCurrent.time || new Date().toISOString(),
        totalWaveHeightM: Number(mCurrent.wave_height ?? 1.0),
        primarySwell: {
          heightM: Number(mCurrent.swell_wave_height ?? mCurrent.wave_height ?? 1.0),
          periodSec: Number(mCurrent.swell_wave_period ?? mCurrent.wave_period ?? 10),
          peakPeriodSec: mCurrent.swell_wave_peak_period ? Number(mCurrent.swell_wave_peak_period) : undefined,
          directionDeg: swellDeg,
          compassDir: degreesToCompass(swellDeg),
        },
        windWaveHeightM: mCurrent.wind_wave_height !== undefined ? Number(mCurrent.wind_wave_height) : undefined,
        wind: {
          speedKmh: Number(wCurrent.wind_speed_10m ?? 12),
          gustsKmh: Number(wCurrent.wind_gusts_10m ?? 16),
          directionDeg: windDeg,
          compassDir: degreesToCompass(windDeg),
        },
      };

      this.cache.set(cacheKey, {
        data: conditions,
        expiresAt: Date.now() + this.CACHE_TTL_MS,
      });

      return conditions;
    } catch (error) {
      console.warn(`[OpenMeteoMarineAdapter] Warning fetching for spot ${spotId}, using baseline fallback:`, error);
      return this.buildFallbackConditions(spotId);
    }
  }

  /**
   * Fetch continuous 15-day timeline (-7 past days to +7 forecast days)
   */
  private async getMultiDayTimeline(spotId: string, lat: number, lng: number): Promise<HourlyMarineForecast[]> {
    const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}_15d`;
    const cached = this.multiDayTimelineCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&hourly=wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period&past_days=7&forecast_days=7&timezone=Atlantic/Canary`;
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m&past_days=7&forecast_days=7&timezone=Atlantic/Canary`;

      const [marineRes, weatherRes] = await Promise.all([
        fetch(marineUrl, { signal: controller.signal }),
        fetch(weatherUrl, { signal: controller.signal }),
      ]);

      clearTimeout(timeoutId);

      if (!marineRes.ok || !weatherRes.ok) {
        throw new Error('Failed to fetch multi-day timeline from Open-Meteo');
      }

      const marineJson = await marineRes.json();
      const weatherJson = await weatherRes.json();

      const times: string[] = marineJson.hourly?.time || [];
      const timeline: HourlyMarineForecast[] = [];

      for (let i = 0; i < times.length; i++) {
        const swellDeg = marineJson.hourly.swell_wave_direction?.[i] ?? 0;
        const windDeg = weatherJson.hourly.wind_direction_10m?.[i] ?? 0;

        timeline.push({
          spotId,
          timestamp: times[i],
          totalWaveHeightM: Number(marineJson.hourly.wave_height?.[i] ?? 1.0),
          primarySwell: {
            heightM: Number(marineJson.hourly.swell_wave_height?.[i] ?? 1.0),
            periodSec: Number(marineJson.hourly.swell_wave_period?.[i] ?? 10),
            directionDeg: swellDeg,
            compassDir: degreesToCompass(swellDeg),
          },
          wind: {
            speedKmh: Number(weatherJson.hourly.wind_speed_10m?.[i] ?? 12),
            gustsKmh: Number(weatherJson.hourly.wind_gusts_10m?.[i] ?? 16),
            directionDeg: windDeg,
            compassDir: degreesToCompass(windDeg),
          },
        });
      }

      this.multiDayTimelineCache.set(cacheKey, {
        data: timeline,
        expiresAt: Date.now() + this.CACHE_TTL_MS,
      });

      return timeline;
    } catch (error) {
      console.warn(`[OpenMeteoMarineAdapter] Multi-day timeline error:`, error);
      return [];
    }
  }

  public async getConditionsForTimestamp(
    spotId: string,
    lat: number,
    lng: number,
    targetIso: string
  ): Promise<MarineConditions> {
    const timeline = await this.getMultiDayTimeline(spotId, lat, lng);
    if (!timeline.length) {
      return this.getCurrentConditions(spotId, lat, lng);
    }

    // Find the item with timestamp closest to targetIso
    const targetMs = new Date(targetIso).getTime();
    let closestItem = timeline[0];
    let smallestDiff = Math.abs(new Date(timeline[0].timestamp).getTime() - targetMs);

    for (let i = 1; i < timeline.length; i++) {
      const diff = Math.abs(new Date(timeline[i].timestamp).getTime() - targetMs);
      if (diff < smallestDiff) {
        smallestDiff = diff;
        closestItem = timeline[i];
      }
    }

    return {
      spotId,
      timestamp: closestItem.timestamp,
      totalWaveHeightM: closestItem.totalWaveHeightM,
      primarySwell: closestItem.primarySwell,
      wind: closestItem.wind,
    };
  }

  public async getHourlyForecast(
    spotId: string,
    lat: number,
    lng: number,
    days: number = 3
  ): Promise<HourlyMarineForecast[]> {
    const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}_h${days}`;
    const cached = this.hourlyCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    try {
      const timeline = await this.getMultiDayTimeline(spotId, lat, lng);
      if (timeline.length) {
        const nowMs = Date.now();
        // Return next `days * 24` hours starting from current hour
        const upcoming = timeline.filter((h) => new Date(h.timestamp).getTime() >= nowMs - 3600000);
        const result = upcoming.slice(0, days * 24);
        this.hourlyCache.set(cacheKey, { data: result, expiresAt: Date.now() + this.CACHE_TTL_MS });
        return result;
      }
      return [];
    } catch (error) {
      console.warn(`[OpenMeteoMarineAdapter] Hourly forecast error:`, error);
      return [];
    }
  }

  public async getHourlyForecastForDate(
    spotId: string,
    lat: number,
    lng: number,
    dateStr: string // 'YYYY-MM-DD'
  ): Promise<HourlyMarineForecast[]> {
    const timeline = await this.getMultiDayTimeline(spotId, lat, lng);
    if (!timeline.length) {
      return [];
    }

    // Filter by matching date prefix (e.g. "2026-11-13")
    const dayHours = timeline.filter((entry) => entry.timestamp.startsWith(dateStr));

    if (dayHours.length > 0) {
      return dayHours;
    }

    // If exact date prefix doesn't match due to UTC vs Canary time differences, check substring
    return timeline.filter((entry) => {
      const entryDate = entry.timestamp.split('T')[0];
      return entryDate === dateStr;
    });
  }

  private buildFallbackConditions(spotId: string): MarineConditions {
    return {
      spotId,
      timestamp: new Date().toISOString(),
      totalWaveHeightM: 1.2,
      primarySwell: {
        heightM: 1.1,
        periodSec: 10,
        directionDeg: 330,
        compassDir: 'NNW',
      },
      wind: {
        speedKmh: 16,
        gustsKmh: 22,
        directionDeg: 45,
        compassDir: 'NE',
      },
    };
  }
}
