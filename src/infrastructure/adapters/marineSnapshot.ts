import { OpenMeteoRaw } from './openMeteo';

/**
 * File produced by the "Refresh marine data" GitHub Action and published on
 * the repository's `data` branch.
 */
export interface MarineSnapshot {
  version: 1;
  /** ISO timestamp of the last full download from Open-Meteo. */
  generatedAt: string;
  /**
   * ISO timestamp of the last time Open-Meteo was checked for newer model
   * runs. Equal to `generatedAt` after a download; later when the check found
   * the published data still current. Older snapshots do not have it.
   */
  checkedAt?: string;
  spots: Record<string, OpenMeteoRaw>;
}

/** When the published data was last confirmed to be the newest available. */
export function snapshotFreshAt(snapshot: Pick<MarineSnapshot, 'generatedAt' | 'checkedAt'>): string {
  return snapshot.checkedAt ?? snapshot.generatedAt;
}

/** Keep only what parseOpenMeteo reads, to keep the published file small. */
export function slimRaw(raw: OpenMeteoRaw): OpenMeteoRaw {
  return {
    marine: { hourly: raw.marine.hourly },
    weather: { hourly: raw.weather.hourly, daily: raw.weather.daily },
  };
}

/**
 * A full download is forced at least this often, even when the probe says
 * nothing changed, so a faulty comparison can never freeze the data.
 */
export const MAX_SNAPSHOT_AGE_MS = 6 * 60 * 60 * 1000;

export type RefreshDecision =
  | { action: 'reuse'; reason: string }
  | { action: 'download'; reason: string };

/**
 * Open-Meteo only changes its answer when a weather or wave model publishes a
 * new run (every 3 to 12 hours depending on the model). Instead of
 * downloading every spot on every run, the job first downloads one probe spot
 * and compares it with the published copy: identical data means no new run
 * has landed, so the published snapshot is still the newest available.
 */
export function decideRefresh(params: {
  previous: MarineSnapshot | null;
  spotIds: string[];
  probeId: string;
  /** The probe spot freshly downloaded, or null when the probe request failed. */
  probe: OpenMeteoRaw | null;
  now: number;
}): RefreshDecision {
  const { previous, spotIds, probeId, probe, now } = params;
  if (!previous) return { action: 'download', reason: 'no published snapshot' };

  const published = Object.keys(previous.spots ?? {});
  const sameSpots = published.length === spotIds.length && spotIds.every((id) => id in previous.spots);
  if (!sameSpots) return { action: 'download', reason: 'the list of spots changed' };

  const generatedAt = Date.parse(previous.generatedAt);
  if (!Number.isFinite(generatedAt) || now - generatedAt >= MAX_SNAPSHOT_AGE_MS) {
    return { action: 'download', reason: 'the published data is older than the maximum age' };
  }

  if (!probe) return { action: 'download', reason: 'the probe request failed' };
  const before = previous.spots[probeId];
  if (!before || JSON.stringify(slimRaw(probe)) !== JSON.stringify(before)) {
    return { action: 'download', reason: 'Open-Meteo has published new model data' };
  }
  return { action: 'reuse', reason: 'no new model run since the last download' };
}
