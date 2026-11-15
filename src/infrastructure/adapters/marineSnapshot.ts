import { OpenMeteoRaw } from './openMeteo';

/**
 * File produced every 15 minutes by the "Refresh marine data" GitHub Action
 * and published on the repository's `data` branch.
 */
export interface MarineSnapshot {
  version: 1;
  /** ISO timestamp of the download. */
  generatedAt: string;
  spots: Record<string, OpenMeteoRaw>;
}

/** Keep only what parseOpenMeteo reads, to keep the published file small. */
export function slimRaw(raw: OpenMeteoRaw): OpenMeteoRaw {
  return {
    marine: { hourly: raw.marine.hourly },
    weather: { hourly: raw.weather.hourly, daily: raw.weather.daily },
  };
}
