import { MarineConditions } from '../models/MarineConditions';

export interface HourlyMarineForecast extends MarineConditions {
  tideHeightM?: number;
}

export interface MarineWeatherService {
  getCurrentConditions(spotId: string, lat: number, lng: number): Promise<MarineConditions>;
  getHourlyForecast(spotId: string, lat: number, lng: number, days?: number): Promise<HourlyMarineForecast[]>;
}
