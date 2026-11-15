import { SpotTimeline, parseOpenMeteo } from './openMeteo';
import { MarineSnapshot } from './marineSnapshot';
import { TimelineMarineService } from './OpenMeteoMarineAdapter';

/** How often the published snapshot is re-read. */
const RELOAD_EVERY_MS = 5 * 60 * 1000;
/** Older snapshots are ignored (e.g. the scheduled workflow stopped running). */
const MAX_SNAPSHOT_AGE_MS = 3 * 60 * 60 * 1000;

/**
 * Reads the marine snapshot refreshed by GitHub Actions, so visitors never
 * hit Open-Meteo directly (20 spots = 2 upstream requests per refresh, instead
 * of 2 per spot, per server instance). Falls back to the live adapter when
 * the snapshot is unreachable, stale or missing a spot.
 */
export class SnapshotMarineAdapter extends TimelineMarineService {
  private loaded: { at: number; generatedAt: number; timelines: Map<string, SpotTimeline> } | null = null;
  private loading: Promise<void> | null = null;

  constructor(
    private readonly snapshotUrl: string,
    private readonly fallback: TimelineMarineService
  ) {
    super();
  }

  public async getTimeline(spotId: string, lat: number, lng: number): Promise<SpotTimeline> {
    await this.ensureLoaded();
    const fresh = this.loaded && Date.now() - this.loaded.generatedAt < MAX_SNAPSHOT_AGE_MS;
    const timeline = fresh ? this.loaded!.timelines.get(spotId) : undefined;
    if (timeline?.hours.length) return timeline;
    return this.fallback.getTimeline(spotId, lat, lng);
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded && Date.now() - this.loaded.at < RELOAD_EVERY_MS) return;
    this.loading ??= this.load().finally(() => (this.loading = null));
    return this.loading;
  }

  private async load(): Promise<void> {
    try {
      const res = await fetch(this.snapshotUrl, { signal: AbortSignal.timeout(5000), cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const snapshot = (await res.json()) as MarineSnapshot;
      const timelines = new Map<string, SpotTimeline>();
      for (const [spotId, raw] of Object.entries(snapshot.spots ?? {})) {
        timelines.set(spotId, parseOpenMeteo(raw));
      }
      this.loaded = { at: Date.now(), generatedAt: Date.parse(snapshot.generatedAt), timelines };
    } catch (error) {
      console.warn('[SnapshotMarineAdapter] Snapshot unavailable, using live Open-Meteo:', (error as Error).message);
      // Retry later but keep serving the previous snapshot meanwhile
      if (this.loaded) this.loaded.at = Date.now();
      else this.loaded = { at: Date.now(), generatedAt: 0, timelines: new Map() };
    }
  }
}
