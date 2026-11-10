export type ConditionQuality = 'firing' | 'good' | 'fair' | 'poor' | 'flat';

export interface SpotScore {
  spotId: string;
  overallScore: number; // 0 to 100
  quality: ConditionQuality;
  swellScore: number;   // 0 to 40
  windScore: number;    // 0 to 35
  periodScore: number;  // 0 to 25
  pros: string[];
  cons: string[];
  recommendation: string;
}
