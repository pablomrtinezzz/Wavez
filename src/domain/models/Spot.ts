export type ZoneId = 'las-palmas' | 'costa-norte' | 'telde-este' | 'sur-sureste';

export type BreakType = 'beach-break' | 'reef-break' | 'point-break' | 'slab';

export type SkillLevel = 'all-levels' | 'intermediate' | 'advanced' | 'expert';

export type TidePreference = 'low' | 'mid' | 'high' | 'all';

export interface WebcamConfig {
  provider: 'in2thebeach' | 'generic-iframe' | 'image-stream';
  iframeUrl?: string;
  externalUrl?: string;
  attributionTitle?: string;
  attributionUrl?: string;
  aspectRatio?: string;
}

export interface IdealConditions {
  minSwellHeightM: number;
  maxSwellHeightM: number;
  minPeriodSec: number;
  /**
   * Optimal swell directions in degrees (0 = N, 90 = E, 180 = S, 270 = W).
   * E.g. [315, 45] covers NW to NE.
   */
  optimalSwellDegrees: { min: number; max: number };
  /**
   * Offshore / favorable wind directions in degrees.
   */
  favorableWindDegrees: { min: number; max: number };
  maxFavorableWindKmh: number;
  preferredTide: TidePreference;
}

export interface Spot {
  id: string;
  slug: string;
  name: string;
  zone: ZoneId;
  location: {
    lat: number;
    lng: number;
    municipality: string;
  };
  breakType: BreakType;
  skillLevel: SkillLevel;
  description: string;
  idealConditions: IdealConditions;
  webcam?: WebcamConfig;
}
