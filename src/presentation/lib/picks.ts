import { SpotSummaryDTO } from '@/application/dtos/SpotSummaryDTO';
import { SkillLevel } from '@/domain/models/Spot';
import { ZoneId } from '@/domain/models/Island';
import { QUALITY } from './format';

export type PickId = 'learn' | 'intermediate' | 'advanced' | 'glassy';

export interface Pick {
  id: PickId;
  title: string;
  hint: string;
  /** Best first; empty when nothing suits. */
  spots: SpotSummaryDTO[];
}

const LEVELS: Record<Exclude<PickId, 'glassy'>, SkillLevel[]> = {
  learn: ['all-levels'],
  intermediate: ['intermediate'],
  advanced: ['advanced', 'expert'],
};

const byScore = (a: SpotSummaryDTO, b: SpotSummaryDTO) => b.score.overallScore - a.score.overallScore;
const surfable = (s: SpotSummaryDTO) => QUALITY[s.score.quality].rank >= QUALITY.fair.rank;

/**
 * Where to go right now depending on who is asking. Only spots rated for that
 * level count, so a beginner is never sent to a slab because it scores well.
 */
export function pickSpots(summaries: SpotSummaryDTO[], perPick = 3): Pick[] {
  const level = (id: keyof typeof LEVELS) => summaries.filter((s) => LEVELS[id].includes(s.spot.skillLevel)).sort(byScore).slice(0, perPick);
  // Glassy: surfable spots with the lightest wind, for a calm, clean session
  const glassy = summaries
    .filter(surfable)
    .sort((a, b) => a.conditions.wind.speedKmh - b.conditions.wind.speedKmh)
    .slice(0, perPick);
  return [
    { id: 'learn', title: 'Para aprender', hint: 'Playas de arena para todos los niveles', spots: level('learn') },
    { id: 'intermediate', title: 'Nivel intermedio', hint: 'Reefs y points amables si ya te pones de pie', spots: level('intermediate') },
    { id: 'advanced', title: 'Avanzado y experto', hint: 'Reefs y olas con fuerza', spots: level('advanced') },
    { id: 'glassy', title: 'Con menos viento', hint: 'Surfeables y con el mar más limpio', spots: glassy },
  ];
}

export interface ZoneState {
  zone: ZoneId;
  best: SpotSummaryDTO | null;
  surfable: number;
  total: number;
}

/** How each coast is doing: its best spot and how many are worth a session. */
export function zoneStates(summaries: SpotSummaryDTO[], zones: ZoneId[]): ZoneState[] {
  return zones.map((zone) => {
    const spots = summaries.filter((s) => s.spot.zone === zone).sort(byScore);
    return { zone, best: spots[0] ?? null, surfable: spots.filter(surfable).length, total: spots.length };
  });
}
