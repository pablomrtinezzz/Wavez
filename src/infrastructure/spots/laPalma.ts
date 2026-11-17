import { defineSpots, offshore } from './defineSpots';

/** La Palma. Sources: Canary Islands tourism board and The Surf Atlas. */
export const LA_PALMA_SPOTS = defineSpots('la-palma', [
  {
    id: 'nogales',
    slug: 'nogales',
    name: 'Playa de Nogales',
    zone: 'lp-este',
    location: { lat: 28.7592, lng: -17.7393, municipality: 'Puntallana' },
    marinePoint: offshore(28.7592, -17.7393, 80),
    breakType: 'beach-break',
    skillLevel: 'advanced',
    description: 'Arena negra bajo los acantilados del este, con picos en la punta sur. Protegida del noroeste, poca gente, bajada a pie y corrientes fuertes.',
    idealConditions: {
      minSwellHeightM: 0.8,
      maxSwellHeightM: 2.5,
      minPeriodSec: 9,
      optimalSwellDegrees: { min: 0, max: 70 }, // N to ENE
      favorableWindDegrees: { min: 200, max: 290 }, // SSW to WNW
      maxFavorableWindKmh: 22,
      preferredTide: 'mid',
    },
  },
  {
    id: 'puerto-naos',
    slug: 'puerto-naos',
    name: 'Puerto Naos',
    zone: 'lp-oeste',
    location: { lat: 28.5859, lng: -17.9102, municipality: 'Los Llanos de Aridane' },
    marinePoint: offshore(28.5859, -17.9102, 260),
    breakType: 'beach-break',
    skillLevel: 'all-levels',
    description: 'La playa de arena negra más grande del oeste, protegida del alisio. Olas suaves con mar del oeste; la más accesible de la isla.',
    idealConditions: {
      minSwellHeightM: 0.5,
      maxSwellHeightM: 2.0,
      minPeriodSec: 8,
      optimalSwellDegrees: { min: 230, max: 320 }, // SW to NW
      favorableWindDegrees: { min: 40, max: 130 }, // NE to SE
      maxFavorableWindKmh: 22,
      preferredTide: 'all',
    },
  },
  {
    id: 'la-zamora',
    slug: 'la-zamora',
    name: 'La Zamora',
    zone: 'lp-oeste',
    location: { lat: 28.5158, lng: -17.8751, municipality: 'Fuencaliente de La Palma' },
    marinePoint: offshore(28.5158, -17.8751, 260),
    breakType: 'beach-break',
    skillLevel: 'intermediate',
    description: 'Dos calas de arena negra bajo los acantilados de Fuencaliente, con una derecha de playa cuando entra mar del oeste. Bajada por escaleras.',
    idealConditions: {
      minSwellHeightM: 0.6,
      maxSwellHeightM: 2.0,
      minPeriodSec: 9,
      optimalSwellDegrees: { min: 230, max: 320 },
      favorableWindDegrees: { min: 40, max: 130 },
      maxFavorableWindKmh: 22,
      preferredTide: 'mid',
    },
  },
]);
