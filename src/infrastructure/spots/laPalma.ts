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
]);
