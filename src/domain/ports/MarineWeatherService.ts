import { MarineConditions } from '../models/MarineConditions';

export interface HourlyMarineForecast extends MarineConditions {
  tideHeightM?: number;
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
  /** `targetLocalHour` is a Gran Canaria wall-clock timestamp: 'YYYY-MM-DDTHH:00'. */
  getConditionsForTimestamp(spotId: string, lat: number, lng: number, targetLocalHour: string): Promise<MarineConditions>;
  /** Next `hours` hourly entries starting at the current local hour. */
  getHourlyForecast(spotId: string, lat: number, lng: number, hours?: number): Promise<HourlyMarineForecast[]>;
  getHourlyForecastForDate(spotId: string, lat: number, lng: number, dateStr: string): Promise<HourlyMarineForecast[]>;
}
