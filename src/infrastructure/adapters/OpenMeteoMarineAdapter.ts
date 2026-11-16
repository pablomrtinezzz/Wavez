import { MarineConditions } from '@/domain/models/MarineConditions';
import { canaryNow, toLocalHourKey } from '@/domain/models/LocalTime';
import {
  MarineWeatherService,
  HourlyMarineForecast,
  MarineDataUnavailableError,
  Daylight,
} from '@/domain/ports/MarineWeatherService';
import { EMPTY_TIMELINE, SpotTimeline, fetchOpenMeteo, parseOpenMeteo } from './openMeteo';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/** Largest distance between the requested hour and the hour actually served. */
const MAX_GAP_MS = 2 * 60 * 60 * 1000;

/**
 * Answers every marine query from one 15-day hourly timeline per spot
 * (7 past days + 7 forecast days), so the list, the time control and the
 * detail view always agree. Subclasses decide where the timeline comes from.
 */
export abstract class TimelineMarineService implements MarineWeatherService {
  public abstract getTimeline(spotId: string, lat: number, lng: number): Promise<SpotTimeline>;
  public abstract getDataUpdatedAt(): Promise<string | null>;

  public async getCurrentConditions(spotId: string, lat: number, lng: number): Promise<MarineConditions> {
    return this.getConditionsForTimestamp(spotId, lat, lng, toLocalHourKey(canaryNow()));
  }

  public async getConditionsForTimestamp(
    spotId: string,
    lat: number,
    lng: number,
    targetLocalHour: string
  ): Promise<MarineConditions> {
    const timeline = (await this.getTimeline(spotId, lat, lng)).hours;
    if (!timeline.length) throw new MarineDataUnavailableError(spotId);

    // Timestamps are zero-padded local strings, so an exact match is the common
    // case; otherwise fall back to the closest hour.
    const exact = timeline.find((h) => h.timestamp === targetLocalHour);
    const match = exact ?? this.closestTo(timeline, targetLocalHour);
    // Out of the 15-day window: say so instead of returning a different day
    if (Math.abs(Date.parse(`${match.timestamp}Z`) - Date.parse(`${targetLocalHour}Z`)) > MAX_GAP_MS) {
      throw new MarineDataUnavailableError(spotId);
    }
    return { ...match, spotId };
  }

  public async getHourlyForecast(spotId: string, lat: number, lng: number, hours: number = 48): Promise<HourlyMarineForecast[]> {
    const timeline = (await this.getTimeline(spotId, lat, lng)).hours;
    const nowKey = toLocalHourKey(canaryNow());
    return timeline
      .filter((h) => h.timestamp >= nowKey)
      .slice(0, hours)
      .map((h) => ({ ...h, spotId }));
  }

  public async getHourlyForecastForDate(spotId: string, lat: number, lng: number, dateStr: string): Promise<HourlyMarineForecast[]> {
    const timeline = (await this.getTimeline(spotId, lat, lng)).hours;
    return timeline.filter((h) => h.timestamp.startsWith(dateStr)).map((h) => ({ ...h, spotId }));
  }

  public async getDaylight(spotId: string, lat: number, lng: number, dateStr: string): Promise<Daylight | null> {
    return (await this.getTimeline(spotId, lat, lng)).daylight.get(dateStr) ?? null;
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
}

/** Fetches each spot's timeline live from Open-Meteo, cached for 10 minutes. */
export class OpenMeteoMarineAdapter extends TimelineMarineService {
  /** Resolves a spot's open-sea model point, if it has one. */
  constructor(private readonly marinePointOf: (spotId: string) => { lat: number; lng: number } | undefined = () => undefined) {
    super();
  }

  private timelineCache = new Map<string, CacheEntry<SpotTimeline>>();
  private inFlight = new Map<string, Promise<SpotTimeline>>();
  private readonly CACHE_TTL_MS = 10 * 60 * 1000;
  private lastFetchedAt: string | null = null;

  public async getDataUpdatedAt(): Promise<string | null> {
    return this.lastFetchedAt;
  }

  public async getTimeline(spotId: string, lat: number, lng: number): Promise<SpotTimeline> {
    const marine = this.marinePointOf(spotId);
    const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}|${marine ? `${marine.lat},${marine.lng}` : ''}`;
    const cached = this.timelineCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    // Deduplicate concurrent requests for the same coordinates
    const pending = this.inFlight.get(cacheKey);
    if (pending) return pending;

    const request = fetchOpenMeteo([{ lat, lng, marine }])
      .then(([raw]) => {
        const data = parseOpenMeteo(raw);
        if (data.hours.length) {
          this.lastFetchedAt = new Date().toISOString();
          this.timelineCache.set(cacheKey, { data, expiresAt: Date.now() + this.CACHE_TTL_MS });
        }
        return data;
      })
      .catch((error) => {
        console.warn(`[OpenMeteoMarineAdapter] Timeline error for ${cacheKey}:`, error);
        // Serve stale data rather than nothing if we have it
        return cached?.data ?? EMPTY_TIMELINE;
      })
      .finally(() => this.inFlight.delete(cacheKey));

    this.inFlight.set(cacheKey, request);
    return request;
  }
}
