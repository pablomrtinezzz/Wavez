import { defineSpots, offshore } from './defineSpots';

/**
 * El Hierro, the island with the least surf. Sources: Wannasurf and local
 * beach guides; ideal conditions are first estimates.
 */
export const EL_HIERRO_SPOTS = defineSpots('el-hierro', [
  {
    id: 'tecoron',
    slug: 'tecoron',
    name: 'La Laja de Tecorón',
    zone: 'eh-sur',
    location: { lat: 27.6705, lng: -18.0263, municipality: 'El Pinar de El Hierro' },
    marinePoint: offshore(27.6705, -18.0263, 220),
    breakType: 'point-break',
    skillLevel: 'intermediate',
    description: 'Derecha de point en la costa sur, cerca de La Restinga: de las pocas olas con nombre de la isla. Funciona con mar del sur y del oeste.',
    idealConditions: {
      minSwellHeightM: 0.8,
      maxSwellHeightM: 2.5,
      minPeriodSec: 10,
      optimalSwellDegrees: { min: 180, max: 280 }, // S to W
      favorableWindDegrees: { min: 0, max: 90 }, // N to E
      maxFavorableWindKmh: 25,
      preferredTide: 'mid',
    },
  },
  {
    id: 'timijiraque',
    slug: 'timijiraque',
    name: 'Timijiraque',
    zone: 'eh-este',
    location: { lat: 27.7701, lng: -17.9146, municipality: 'Valverde' },
    marinePoint: offshore(27.7701, -17.9146, 90),
    breakType: 'beach-break',
    skillLevel: 'intermediate',
    description: 'Cala de arena negra y callaos de la costa este, frecuentada por surfistas y bodyboarders locales cuando entra mar del norte o del este.',
    idealConditions: {
      minSwellHeightM: 0.8,
      maxSwellHeightM: 2.5,
      minPeriodSec: 9,
      optimalSwellDegrees: { min: 0, max: 100 }, // N to E
      favorableWindDegrees: { min: 220, max: 300 }, // SW to WNW
      maxFavorableWindKmh: 22,
      preferredTide: 'mid',
    },
  },
]);
