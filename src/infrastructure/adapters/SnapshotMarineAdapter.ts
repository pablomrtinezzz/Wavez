import { SpotTimeline, parseOpenMeteo } from './openMeteo';
import { MarineSnapshot } from './marineSnapshot';
import { TimelineMarineService } from './OpenMeteoMarineAdapter';

/** How often the published snapshot is re-read (it lives on GitHub, not Open-Meteo). */
const RELOAD_EVERY_MS = 5 * 60 * 1000;

/**
 * Serves marine data only from the snapshot published by the scheduled
 * GitHub Action: visitors never trigger Open-Meteo requests. The snapshot
 * spans 15 days hour by hour, so even an old one still contains the current
 * hour; its age is shown to the user instead of being hidden.
 *
 * The live adapter is an emergency fallback used only when the snapshot
 * cannot be read at all (or a spot is missing from it), so the site never
 * goes blank.
 */
export class SnapshotMarineAdapter extends TimelineMarineService {
  private loaded: { at: number; generatedAt: number; timelines: Map<string, SpotTimeline> } | null = null;
  private loading: Promise<void> | null = null;
  /** Set when the emergency fallback had to serve data since the last snapshot load. */
  private usedFallback = false;

  constructor(
    private readonly snapshotUrl: string,
    private readonly fallback: TimelineMarineService
  ) {
    super();
  }

  public async getTimeline(spotId: string, lat: number, lng: number): Promise<SpotTimeline> {
    await this.ensureLoaded();
    const timeline = this.loaded?.timelines.get(spotId);
    if (timeline?.hours.length) return timeline;
    this.usedFallback = true;
    return this.fallback.getTimeline(spotId, lat, lng);
  }

  public async getDataUpdatedAt(): Promise<string | null> {
    await this.ensureLoaded();
    if (this.loaded?.generatedAt && !this.usedFallback) return new Date(this.loaded.generatedAt).toISOString();
    return (await this.fallback.getDataUpdatedAt()) ?? (this.loaded?.generatedAt ? new Date(this.loaded.generatedAt).toISOString() : null);
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
      this.usedFallback = false;
    } catch (error) {
      console.warn('[SnapshotMarineAdapter] Snapshot unavailable, using live Open-Meteo:', (error as Error).message);
      // Retry later but keep serving the previous snapshot meanwhile
      if (this.loaded) this.loaded.at = Date.now();
      else this.loaded = { at: Date.now(), generatedAt: 0, timelines: new Map() };
    }
  }
}
