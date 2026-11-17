import { defineSpots, offshore } from './defineSpots';

/**
 * Fuerteventura. Sources: Canary Islands tourism board surf guides
 * (hellocanaryislands.com), Fuerteventura Playas and local surf guides.
 * Ideal conditions are first estimates; refine them with local knowledge.
 */
export const FUERTEVENTURA_SPOTS = defineSpots('fuerteventura', [
  // ==========================================
  // CORRALEJO Y LOBOS
  // ==========================================
  {
    id: 'lobos',
    slug: 'lobos',
    name: 'La Derecha de Lobos',
    zone: 'fv-corralejo',
    location: { lat: 28.7487, lng: -13.8337, municipality: 'La Oliva' },
    marinePoint: offshore(28.7487, -13.8337, 300),
    breakType: 'point-break',
    skillLevel: 'intermediate',
    description: 'Derecha de 300 a 500 m sobre reef volcánico en el islote de Lobos, con secciones para varios niveles. Se llega en barco desde Corralejo.',
    idealConditions: {
      minSwellHeightM: 1.0,
      maxSwellHeightM: 4.0,
      minPeriodSec: 10,
      optimalSwellDegrees: { min: 270, max: 10 }, // W to N
      favorableWindDegrees: { min: 100, max: 220 }, // ESE to SW
      maxFavorableWindKmh: 25,
      preferredTide: 'mid',
    },
  },
  {
    id: 'shooting-gallery',
    slug: 'shooting-gallery',
    name: 'Shooting Gallery (Bristol)',
    zone: 'fv-corralejo',
    location: { lat: 28.7473, lng: -13.8736, municipality: 'La Oliva' },
    marinePoint: offshore(28.7473, -13.8736, 330),
    breakType: 'reef-break',
    skillLevel: 'advanced',
    description: 'Reef poco profundo al oeste de Corralejo: izquierda constante y derecha corta y hueca. Corrientes fuertes al entrar y salir.',
    idealConditions: {
      minSwellHeightM: 1.0,
      maxSwellHeightM: 3.5,
      minPeriodSec: 10,
      optimalSwellDegrees: { min: 270, max: 10 },
      favorableWindDegrees: { min: 110, max: 200 }, // ESE to SSW
      maxFavorableWindKmh: 22,
      preferredTide: 'low',
    },
  },
  {
    id: 'flag-beach',
    slug: 'flag-beach',
    name: 'Flag Beach',
    zone: 'fv-corralejo',
    location: { lat: 28.7205, lng: -13.8395, municipality: 'La Oliva' },
    marinePoint: offshore(28.7205, -13.8395, 70),
    breakType: 'beach-break',
    skillLevel: 'all-levels',
    description: 'Playa de las dunas de Corralejo y base de escuelas. Funciona con mar del norte rolado y vientos del oeste.',
    idealConditions: {
      minSwellHeightM: 0.6,
      maxSwellHeightM: 2.0,
      minPeriodSec: 8,
      optimalSwellDegrees: { min: 340, max: 60 }, // NNW to ENE
      favorableWindDegrees: { min: 200, max: 290 }, // SSW to WNW
      maxFavorableWindKmh: 20,
      preferredTide: 'all',
    },
  },

  // ==========================================
  // NORTH SHORE
  // ==========================================
  {
    id: 'majanicho',
    slug: 'majanicho',
    name: 'Majanicho',
    zone: 'fv-north-shore',
    location: { lat: 28.743, lng: -13.9395, municipality: 'La Oliva' },
    marinePoint: offshore(28.743, -13.9395, 350),
    breakType: 'reef-break',
    skillLevel: 'intermediate',
    description: 'El reef más accesible del North Shore, con un pico en A dentro de la bahía que sirve de refugio cuando el resto está grande.',
    idealConditions: {
      minSwellHeightM: 0.8,
      maxSwellHeightM: 3.0,
      minPeriodSec: 10,
      optimalSwellDegrees: { min: 290, max: 30 },
      favorableWindDegrees: { min: 110, max: 210 },
      maxFavorableWindKmh: 22,
      preferredTide: 'mid',
    },
  },
  {
    id: 'el-hierro-fuerteventura',
    slug: 'el-hierro-fuerteventura',
    name: 'The Bubble (El Hierro)',
    zone: 'fv-north-shore',
    location: { lat: 28.7403, lng: -13.9526, municipality: 'La Oliva' },
    marinePoint: offshore(28.7403, -13.9526, 350),
    breakType: 'reef-break',
    skillLevel: 'expert',
    description: 'Conocida como El Hierro, el pico más famoso del North Shore: izquierda potente y hueca y derecha tubera sobre reef volcánico. Riesgo de lesión alto.',
    idealConditions: {
      minSwellHeightM: 1.0,
      maxSwellHeightM: 3.5,
      minPeriodSec: 11,
      optimalSwellDegrees: { min: 270, max: 40 }, // W to NE
      favorableWindDegrees: { min: 100, max: 230 }, // ESE to SW
      maxFavorableWindKmh: 22,
      preferredTide: 'high',
    },
  },

  // ==========================================
  // COSTA OESTE
  // ==========================================
  {
    id: 'el-cotillo',
    slug: 'el-cotillo',
    name: 'El Cotillo',
    zone: 'fv-oeste',
    location: { lat: 28.6695, lng: -14.0108, municipality: 'La Oliva' },
    marinePoint: offshore(28.6695, -14.0108, 280),
    breakType: 'beach-break',
    skillLevel: 'intermediate',
    description: 'Playas abiertas al oeste al sur del pueblo, con picos potentes y orilleros cuando entra mar del noroeste.',
    idealConditions: {
      minSwellHeightM: 0.8,
      maxSwellHeightM: 2.8,
      minPeriodSec: 10,
      optimalSwellDegrees: { min: 250, max: 340 }, // WSW to NNW
      favorableWindDegrees: { min: 50, max: 130 }, // NE to SE
      maxFavorableWindKmh: 25,
      preferredTide: 'mid',
    },
  },
  {
    id: 'la-pared',
    slug: 'la-pared',
    name: 'La Pared',
    zone: 'fv-oeste',
    location: { lat: 28.212, lng: -14.2205, municipality: 'Pájara' },
    marinePoint: offshore(28.212, -14.2205, 300),
    breakType: 'beach-break',
    skillLevel: 'intermediate',
    description: 'Playa de arena y roca en la costa oeste de Jandía que recoge todo el mar del noroeste. Corrientes fuertes.',
    idealConditions: {
      minSwellHeightM: 0.8,
      maxSwellHeightM: 2.5,
      minPeriodSec: 9,
      optimalSwellDegrees: { min: 270, max: 350 }, // W to N
      favorableWindDegrees: { min: 40, max: 130 }, // NE to SE
      maxFavorableWindKmh: 25,
      preferredTide: 'mid',
    },
  },
  {
    id: 'generoso',
    slug: 'generoso',
    name: 'Generoso',
    zone: 'fv-corralejo',
    location: { lat: 28.7512, lng: -13.8779, municipality: 'La Oliva' },
    marinePoint: offshore(28.7512, -13.8779, 330),
    breakType: 'reef-break',
    skillLevel: 'intermediate',
    description: 'Reef al oeste de Corralejo con un pico más tranquilo que sus vecinos. Buena opción cuando Bristol está demasiado grande.',
    idealConditions: {
      minSwellHeightM: 0.8,
      maxSwellHeightM: 2.8,
      minPeriodSec: 10,
      optimalSwellDegrees: { min: 280, max: 20 },
      favorableWindDegrees: { min: 110, max: 200 },
      maxFavorableWindKmh: 22,
      preferredTide: 'mid',
    },
  },
  {
    id: 'esquinzo',
    slug: 'esquinzo',
    name: 'Esquinzo',
    zone: 'fv-oeste',
    location: { lat: 28.6348, lng: -14.027, municipality: 'La Oliva' },
    marinePoint: offshore(28.6348, -14.027, 280),
    breakType: 'beach-break',
    skillLevel: 'intermediate',
    description: 'Playa de arena y roca al sur de El Cotillo, con picos potentes que recogen todo el mar del noroeste.',
    idealConditions: {
      minSwellHeightM: 0.8,
      maxSwellHeightM: 2.8,
      minPeriodSec: 10,
      optimalSwellDegrees: { min: 250, max: 340 }, // WSW to NNW
      favorableWindDegrees: { min: 50, max: 130 }, // NE to SE
      maxFavorableWindKmh: 25,
      preferredTide: 'mid',
    },
  },
  {
    id: 'garcey',
    slug: 'garcey',
    name: 'Playa de Garcey',
    zone: 'fv-oeste',
    location: { lat: 28.3468, lng: -14.1765, municipality: 'Pájara' },
    marinePoint: offshore(28.3468, -14.1765, 290),
    breakType: 'beach-break',
    skillLevel: 'advanced',
    description: 'Playa salvaje y aislada de la costa oeste, junto a los restos del American Star. Corrientes peligrosas y nadie cerca.',
    idealConditions: {
      minSwellHeightM: 0.8,
      maxSwellHeightM: 2.5,
      minPeriodSec: 9,
      optimalSwellDegrees: { min: 260, max: 350 },
      favorableWindDegrees: { min: 40, max: 130 },
      maxFavorableWindKmh: 25,
      preferredTide: 'mid',
    },
  },
  {
    id: 'playa-blanca-fuerteventura',
    slug: 'playa-blanca-fuerteventura',
    name: 'Playa Blanca (Puerto del Rosario)',
    zone: 'fv-este',
    location: { lat: 28.4765, lng: -13.8669, municipality: 'Puerto del Rosario' },
    marinePoint: offshore(28.4765, -13.8669, 100),
    breakType: 'beach-break',
    skillLevel: 'all-levels',
    description: 'Playa de arena junto a Puerto del Rosario con olas de alisio para aprender en la costa este, cuando el oeste está demasiado grande.',
    idealConditions: {
      minSwellHeightM: 0.5,
      maxSwellHeightM: 1.8,
      minPeriodSec: 7,
      optimalSwellDegrees: { min: 20, max: 120 }, // NNE to ESE
      favorableWindDegrees: { min: 220, max: 310 }, // SW to NW
      maxFavorableWindKmh: 20,
      preferredTide: 'all',
    },
  },
]);
