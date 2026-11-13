export type SeasonKey = 'winter' | 'spring' | 'summer' | 'autumn' | 'year-round';

export interface MonthlyConsistency {
  month: number; // 1-12
  monthName: string; // 'Ene', 'Feb', etc.
  consistencyPct: number; // 0-100%
  averageWaveHeightM: number;
  averagePeriodSec: number;
}

export interface SpotClimatology {
  spotId: string;
  bestSeason: SeasonKey;
  bestSeasonLabel: string;
  seasonSummary: string;
  monthlyConsistency: MonthlyConsistency[];
  optimalSwellWindow: string;
  optimalWindRegime: string;
  bestTidePhase: 'low' | 'mid' | 'high' | 'all';
  tideDescription: string;
  historicalNotes: string;
  crowdFactor: 'low' | 'medium' | 'high' | 'extreme';
  riskFactors: string[];
}
