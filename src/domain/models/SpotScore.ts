export type ConditionQuality = 'firing' | 'good' | 'fair' | 'poor' | 'flat';

export interface SpotScore {
  spotId: string;
  overallScore: number; // 0 to 100
  quality: ConditionQuality;
  swellScore: number;   // 0 to 40
  windScore: number;    // 0 to 35
  periodScore: number;  // 0 to 25
  tideAdjustment: number; // -6 to 0, applied when the tide does not suit the spot
  pros: string[];
  cons: string[];
  recommendation: string;
}
