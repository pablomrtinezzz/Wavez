import { defineSpots, offshore } from './defineSpots';

/**
 * Tenerife. Sources: Canary Islands tourism board surf guides
 * (hellocanaryislands.com), Wannasurf and local surf guides. Ideal
 * conditions are first estimates from those descriptions and the coast's
 * orientation; refine them with local knowledge.
 */
export const TENERIFE_SPOTS = defineSpots('tenerife', [
  // ==========================================
  // NORTE
  // ==========================================
  {
    id: 'martianez',
    slug: 'martianez',
    name: 'Martiánez (Puerto de la Cruz)',
    zone: 'tf-norte',
    location: { lat: 28.4165, lng: -16.5368, municipality: 'Puerto de la Cruz' },
    marinePoint: offshore(28.4165, -16.5368, 0),
    breakType: 'reef-break',
    skillLevel: 'intermediate',
    description: 'Derechas e izquierdas sobre roca frente al paseo de Puerto de la Cruz. Se enciende con el mar de fondo del norte en invierno.',
    idealConditions: {
      minSwellHeightM: 1.0,
      maxSwellHeightM: 3.0,
      minPeriodSec: 10,
      optimalSwellDegrees: { min: 300, max: 30 }, // NW to NNE
      favorableWindDegrees: { min: 140, max: 220 }, // SE to SW
      maxFavorableWindKmh: 20,
      preferredTide: 'mid',
    },
  },
  {
    id: 'el-socorro',
    slug: 'el-socorro',
    name: 'El Socorro',
    zone: 'tf-norte',
    location: { lat: 28.3984, lng: -16.6162, municipality: 'Los Realejos' },
    marinePoint: offshore(28.3984, -16.6162, 340),
    breakType: 'beach-break',
    skillLevel: 'intermediate',
    description: 'Playa de arena negra con picos a izquierdas y derechas a lo largo de 600 m. Corrientes fuertes con mar grande.',
    idealConditions: {
      minSwellHeightM: 0.8,
      maxSwellHeightM: 2.5,
      minPeriodSec: 9,
      optimalSwellDegrees: { min: 290, max: 20 }, // WNW to NNE
      favorableWindDegrees: { min: 130, max: 210 }, // SE to SSW
      maxFavorableWindKmh: 20,
      preferredTide: 'mid',
    },
  },
  {
    id: 'bajamar',
    slug: 'bajamar',
    name: 'Bajamar',
    zone: 'tf-norte',
    location: { lat: 28.555, lng: -16.347, municipality: 'San Cristóbal de La Laguna' },
    marinePoint: offshore(28.555, -16.347, 330),
    breakType: 'point-break',
    skillLevel: 'intermediate',
    description: 'Point de roca junto a las piscinas naturales, con derechas e izquierdas. Uno de los picos más constantes del norte.',
    idealConditions: {
      minSwellHeightM: 1.0,
      maxSwellHeightM: 3.0,
      minPeriodSec: 10,
      optimalSwellDegrees: { min: 290, max: 30 },
      favorableWindDegrees: { min: 120, max: 200 }, // ESE to SSW
      maxFavorableWindKmh: 20,
      preferredTide: 'mid',
    },
  },
  {
    id: 'punta-del-hidalgo',
    slug: 'punta-del-hidalgo',
    name: 'Punta del Hidalgo',
    zone: 'tf-norte',
    location: { lat: 28.5735, lng: -16.326, municipality: 'San Cristóbal de La Laguna' },
    marinePoint: offshore(28.5735, -16.326, 330),
    breakType: 'reef-break',
    skillLevel: 'advanced',
    description: 'Reef expuesto en la punta norte de la isla, que aguanta los swells grandes del noroeste. Fondo de roca y poca protección.',
    idealConditions: {
      minSwellHeightM: 1.2,
      maxSwellHeightM: 3.5,
      minPeriodSec: 11,
      optimalSwellDegrees: { min: 290, max: 40 },
      favorableWindDegrees: { min: 130, max: 210 },
      maxFavorableWindKmh: 18,
      preferredTide: 'mid',
    },
  },

  // ==========================================
  // ANAGA
  // ==========================================
  {
    id: 'almaciga',
    slug: 'almaciga',
    name: 'Almáciga',
    zone: 'tf-anaga',
    location: { lat: 28.5692, lng: -16.199, municipality: 'Santa Cruz de Tenerife' },
    marinePoint: offshore(28.5692, -16.199, 0),
    breakType: 'reef-break',
    skillLevel: 'advanced',
    description: 'Playa salvaje de Anaga con tubos sobre roca volcánica. Corrientes marcadas y series que llegan sin avisar: no es para empezar.',
    idealConditions: {
      minSwellHeightM: 0.8,
      maxSwellHeightM: 2.8,
      minPeriodSec: 9,
      optimalSwellDegrees: { min: 300, max: 50 }, // NW to NE
      favorableWindDegrees: { min: 150, max: 240 }, // SSE to WSW
      maxFavorableWindKmh: 22,
      preferredTide: 'mid',
    },
  },
  {
    id: 'igueste-de-san-andres',
    slug: 'igueste-de-san-andres',
    name: 'Igueste de San Andrés',
    zone: 'tf-anaga',
    location: { lat: 28.5227, lng: -16.1543, municipality: 'Santa Cruz de Tenerife' },
    marinePoint: offshore(28.5227, -16.1543, 60),
    breakType: 'reef-break',
    skillLevel: 'intermediate',
    description: 'Izquierda larga sobre callaos con paredes y secciones huecas en sus mejores días. Funciona con mar del norte y del este.',
    idealConditions: {
      minSwellHeightM: 0.8,
      maxSwellHeightM: 2.5,
      minPeriodSec: 9,
      optimalSwellDegrees: { min: 0, max: 90 }, // N to E
      favorableWindDegrees: { min: 180, max: 300 }, // S to WNW
      maxFavorableWindKmh: 22,
      preferredTide: 'low',
    },
  },

  // ==========================================
  // SUR Y OESTE
  // ==========================================
  {
    id: 'la-izquierda',
    slug: 'la-izquierda',
    name: 'La Izquierda (Las Américas)',
    zone: 'tf-sur-oeste',
    location: { lat: 28.0601, lng: -16.7358, municipality: 'Arona' },
    marinePoint: offshore(28.0601, -16.7358, 225),
    breakType: 'reef-break',
    skillLevel: 'advanced',
    description: 'La ola más conocida de Tenerife: izquierda larga y rápida sobre fondo volcánico, con secciones huecas cerca de la orilla. Mejor en invierno.',
    idealConditions: {
      minSwellHeightM: 0.8,
      maxSwellHeightM: 3.0,
      minPeriodSec: 10,
      optimalSwellDegrees: { min: 180, max: 290 }, // S to WNW
      favorableWindDegrees: { min: 330, max: 60 }, // NNW to ENE
      maxFavorableWindKmh: 25,
      preferredTide: 'high',
    },
  },
  {
    id: 'punta-blanca-tenerife',
    slug: 'punta-blanca-tenerife',
    name: 'Punta Blanca (Alcalá)',
    zone: 'tf-sur-oeste',
    location: { lat: 28.2142, lng: -16.8364, municipality: 'Guía de Isora' },
    marinePoint: offshore(28.2142, -16.8364, 260),
    breakType: 'reef-break',
    skillLevel: 'advanced',
    description: 'Reef de la costa oeste, escenario de competiciones. Pide técnica depurada y funciona con marea baja o media.',
    idealConditions: {
      minSwellHeightM: 1.0,
      maxSwellHeightM: 3.0,
      minPeriodSec: 10,
      optimalSwellDegrees: { min: 240, max: 330 }, // WSW to NW
      favorableWindDegrees: { min: 30, max: 120 }, // NE to ESE
      maxFavorableWindKmh: 25,
      preferredTide: 'low',
    },
  },

  // ==========================================
  // ESTE
  // ==========================================
  {
    id: 'el-poris',
    slug: 'el-poris',
    name: 'El Porís',
    zone: 'tf-este',
    location: { lat: 28.1624, lng: -16.4317, municipality: 'Arico' },
    marinePoint: offshore(28.1624, -16.4317, 110),
    breakType: 'beach-break',
    skillLevel: 'all-levels',
    description: 'Playa de arena de la costa este, habitual de las escuelas. Recoge el mar de alisio y los swells del este.',
    idealConditions: {
      minSwellHeightM: 0.6,
      maxSwellHeightM: 2.0,
      minPeriodSec: 7,
      optimalSwellDegrees: { min: 40, max: 130 }, // NE to SE
      favorableWindDegrees: { min: 220, max: 320 }, // SW to NW
      maxFavorableWindKmh: 20,
      preferredTide: 'all',
    },
  },
  {
    id: 'mesa-del-mar',
    slug: 'mesa-del-mar',
    name: 'Mesa del Mar',
    zone: 'tf-norte',
    location: { lat: 28.5034, lng: -16.4239, municipality: 'Tacoronte' },
    marinePoint: offshore(28.5034, -16.4239, 320),
    breakType: 'reef-break',
    skillLevel: 'advanced',
    description: 'Picos potentes sobre roca bajo los acantilados de Tacoronte, junto a las piscinas naturales. Funciona con mar de fondo del noroeste.',
    idealConditions: {
      minSwellHeightM: 1.0,
      maxSwellHeightM: 3.0,
      minPeriodSec: 10,
      optimalSwellDegrees: { min: 290, max: 30 }, // WNW to NNE
      favorableWindDegrees: { min: 120, max: 210 }, // ESE to SSW
      maxFavorableWindKmh: 20,
      preferredTide: 'mid',
    },
  },
  {
    id: 'playa-jardin',
    slug: 'playa-jardin',
    name: 'Playa Jardín',
    zone: 'tf-norte',
    location: { lat: 28.4126, lng: -16.5598, municipality: 'Puerto de la Cruz' },
    marinePoint: offshore(28.4126, -16.5598, 350),
    breakType: 'beach-break',
    skillLevel: 'all-levels',
    description: 'La playa de arena negra de Puerto de la Cruz: la opción del norte para aprender cuando el mar está pequeño. Con mar grande cierra y tira la corriente.',
    idealConditions: {
      minSwellHeightM: 0.5,
      maxSwellHeightM: 2.0,
      minPeriodSec: 8,
      optimalSwellDegrees: { min: 290, max: 30 },
      favorableWindDegrees: { min: 140, max: 220 },
      maxFavorableWindKmh: 18,
      preferredTide: 'all',
    },
  },
  {
    id: 'benijo',
    slug: 'benijo',
    name: 'Benijo',
    zone: 'tf-anaga',
    location: { lat: 28.5762, lng: -16.1851, municipality: 'Santa Cruz de Tenerife' },
    marinePoint: offshore(28.5762, -16.1851, 0),
    breakType: 'reef-break',
    skillLevel: 'advanced',
    description: 'Playa salvaje al final de Anaga, con picos sobre roca y arena frente a los Roques. Corrientes fuertes y nadie cerca.',
    idealConditions: {
      minSwellHeightM: 0.8,
      maxSwellHeightM: 2.8,
      minPeriodSec: 9,
      optimalSwellDegrees: { min: 300, max: 50 }, // NW to NE
      favorableWindDegrees: { min: 150, max: 240 }, // SSE to WSW
      maxFavorableWindKmh: 22,
      preferredTide: 'mid',
    },
  },
  {
    id: 'playa-de-troya',
    slug: 'playa-de-troya',
    name: 'Playa de Troya',
    zone: 'tf-sur-oeste',
    location: { lat: 28.0684, lng: -16.733, municipality: 'Adeje' },
    marinePoint: offshore(28.0684, -16.733, 225),
    breakType: 'beach-break',
    skillLevel: 'all-levels',
    description: 'La playa de arena de las escuelas de Las Américas: olas suaves y ordenadas cuando entra mar del oeste en invierno.',
    idealConditions: {
      minSwellHeightM: 0.4,
      maxSwellHeightM: 1.8,
      minPeriodSec: 8,
      optimalSwellDegrees: { min: 190, max: 290 }, // S to WNW
      favorableWindDegrees: { min: 330, max: 60 }, // NNW to ENE
      maxFavorableWindKmh: 25,
      preferredTide: 'all',
    },
  },
  {
    id: 'el-cabezo',
    slug: 'el-cabezo',
    name: 'El Cabezo (El Médano)',
    zone: 'tf-este',
    location: { lat: 28.0453, lng: -16.5335, municipality: 'Granadilla de Abona' },
    marinePoint: offshore(28.0453, -16.5335, 110),
    breakType: 'reef-break',
    skillLevel: 'advanced',
    description: 'Derecha sobre reef en la punta de El Médano, la ola de la costa este cuando entra mar del este. Casi siempre con mucho viento: madrugar.',
    idealConditions: {
      minSwellHeightM: 0.8,
      maxSwellHeightM: 2.5,
      minPeriodSec: 8,
      optimalSwellDegrees: { min: 40, max: 140 }, // NE to SE
      favorableWindDegrees: { min: 250, max: 340 }, // WSW to NNW
      maxFavorableWindKmh: 20,
      preferredTide: 'mid',
    },
  },
]);
