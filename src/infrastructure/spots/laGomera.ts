import { defineSpots, offshore } from './defineSpots';

/** La Gomera. Sources: local surf guides and Wannasurf. */
export const LA_GOMERA_SPOTS = defineSpots('la-gomera', [
  {
    id: 'hermigua',
    slug: 'hermigua',
    name: 'Playa de Hermigua',
    zone: 'lg-norte',
    location: { lat: 28.1765, lng: -17.1885, municipality: 'Hermigua' },
    marinePoint: offshore(28.1765, -17.1885, 20),
    breakType: 'reef-break',
    skillLevel: 'advanced',
    description: 'Playa de callaos abierta al norte, con mar de fondo potente y orilla de piedras. Para surfistas con experiencia.',
    idealConditions: {
      minSwellHeightM: 0.9,
      maxSwellHeightM: 2.5,
      minPeriodSec: 10,
      optimalSwellDegrees: { min: 320, max: 40 }, // NW to NE
      favorableWindDegrees: { min: 150, max: 240 }, // SSE to WSW
      maxFavorableWindKmh: 22,
      preferredTide: 'mid',
    },
  },
  {
    id: 'valle-gran-rey',
    slug: 'valle-gran-rey',
    name: 'Valle Gran Rey',
    zone: 'lg-oeste',
    location: { lat: 28.092, lng: -17.341, municipality: 'Valle Gran Rey' },
    marinePoint: offshore(28.092, -17.341, 260),
    breakType: 'reef-break',
    skillLevel: 'intermediate',
    description: 'La ola de la isla: rompe sobre callaos frente a La Playa cuando entra mar del oeste o del noroeste.',
    idealConditions: {
      minSwellHeightM: 0.8,
      maxSwellHeightM: 2.5,
      minPeriodSec: 10,
      optimalSwellDegrees: { min: 250, max: 330 }, // WSW to NW
      favorableWindDegrees: { min: 30, max: 120 }, // NE to ESE
      maxFavorableWindKmh: 22,
      preferredTide: 'mid',
    },
  },
]);
