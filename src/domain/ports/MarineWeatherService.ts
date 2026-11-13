import { MarineConditions } from '../models/MarineConditions';

export interface HourlyMarineForecast extends MarineConditions {
  tideHeightM?: number;
}

export interface MarineWeatherService {
  getCurrentConditions(spotId: string, lat: number, lng: number): Promise<MarineConditions>;
  getConditionsForTimestamp(spotId: string, lat: number, lng: number, targetIso: string): Promise<MarineConditions>;
  getHourlyForecast(spotId: string, lat: number, lng: number, days?: number): Promise<HourlyMarineForecast[]>;
  getHourlyForecastForDate(spotId: string, lat: number, lng: number, dateStr: string): Promise<HourlyMarineForecast[]>;
}
