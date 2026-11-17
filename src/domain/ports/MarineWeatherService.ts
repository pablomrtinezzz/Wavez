import { MarineConditions } from '../models/MarineConditions';

export type HourlyMarineForecast = MarineConditions;

export interface Daylight {
  /** Local timestamps, e.g. '2026-11-15T07:23' */
  sunrise: string;
  sunset: string;
}

/** Raised when no real marine data is available for a spot (never replaced by made-up values). */
export class MarineDataUnavailableError extends Error {
  constructor(public readonly spotId: string) {
    super(`No hay datos marinos disponibles para ${spotId}`);
    this.name = 'MarineDataUnavailableError';
  }
}

export interface MarineWeatherService {
  getCurrentConditions(spotId: string, lat: number, lng: number): Promise<MarineConditions>;
  /** `targetLocalHour` is a Canary Islands wall-clock timestamp: 'YYYY-MM-DDTHH:00'. */
  getConditionsForTimestamp(spotId: string, lat: number, lng: number, targetLocalHour: string): Promise<MarineConditions>;
  /** Next `hours` hourly entries starting at the current local hour. */
  getHourlyForecast(spotId: string, lat: number, lng: number, hours?: number): Promise<HourlyMarineForecast[]>;
  getHourlyForecastForDate(spotId: string, lat: number, lng: number, dateStr: string): Promise<HourlyMarineForecast[]>;
  getDaylight(spotId: string, lat: number, lng: number, dateStr: string): Promise<Daylight | null>;
  /** When the data being served was downloaded from the provider (ISO), if known. */
  getDataUpdatedAt(): Promise<string | null>;
}
