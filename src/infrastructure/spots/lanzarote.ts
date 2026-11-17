import { defineSpots, offshore } from './defineSpots';

/**
 * Lanzarote. Sources: Canary Islands tourism board surf guides
 * (hellocanaryislands.com) and The Surf Atlas. Ideal conditions are first
 * estimates; refine them with local knowledge.
 */
export const LANZAROTE_SPOTS = defineSpots('lanzarote', [
  // ==========================================
  // FAMARA
  // ==========================================
  {
    id: 'famara',
    slug: 'famara',
    name: 'Playa de Famara',
    zone: 'lz-famara',
    location: { lat: 29.1166, lng: -13.5528, municipality: 'Teguise' },
    marinePoint: offshore(29.1166, -13.5528, 330),
    breakType: 'beach-break',
    skillLevel: 'all-levels',
    description: 'Cinco kilómetros de arena bajo el risco de Famara: la playa de las escuelas, con picos para todos los niveles. El viento cruzado la estropea.',
    idealConditions: {
      minSwellHeightM: 0.6,
      maxSwellHeightM: 2.5,
      minPeriodSec: 8,
      optimalSwellDegrees: { min: 270, max: 20 }, // W to NNE
      favorableWindDegrees: { min: 100, max: 190 }, // ESE to S
      maxFavorableWindKmh: 20,
      preferredTide: 'all',
    },
  },
  {
    id: 'san-juan',
    slug: 'san-juan',
    name: 'San Juan',
    zone: 'lz-famara',
    location: { lat: 29.1272, lng: -13.5743, municipality: 'Teguise' },
    marinePoint: offshore(29.1272, -13.5743, 330),
    breakType: 'reef-break',
    skillLevel: 'advanced',
    description: 'Izquierda larga y tubera sobre reef volcánico junto a Famara. Pide tamaño y marea baja; el interior queda casi seco.',
    idealConditions: {
      minSwellHeightM: 1.2,
      maxSwellHeightM: 3.5,
      minPeriodSec: 11,
      optimalSwellDegrees: { min: 290, max: 20 },
      favorableWindDegrees: { min: 90, max: 200 }, // E to SSW
      maxFavorableWindKmh: 20,
      preferredTide: 'low',
    },
  },

  // ==========================================
  // LA SANTA
  // ==========================================
  {
    id: 'la-santa',
    slug: 'la-santa',
    name: 'La Santa (La Izquierda)',
    zone: 'lz-la-santa',
    location: { lat: 29.1125, lng: -13.6627, municipality: 'Tinajo' },
    marinePoint: offshore(29.1125, -13.6627, 340),
    breakType: 'reef-break',
    skillLevel: 'advanced',
    description: 'Izquierda corta y explosiva sobre lava; también rompe a derechas. Se entra bajando por las rocas frente al pico: escarpines obligatorios.',
    idealConditions: {
      minSwellHeightM: 1.0,
      maxSwellHeightM: 3.5,
      minPeriodSec: 11,
      optimalSwellDegrees: { min: 270, max: 40 }, // W to NE
      favorableWindDegrees: { min: 100, max: 220 }, // ESE to SW
      maxFavorableWindKmh: 22,
      preferredTide: 'mid',
    },
  },
  {
    id: 'el-quemao',
    slug: 'el-quemao',
    name: 'El Quemao',
    zone: 'lz-la-santa',
    location: { lat: 29.1098, lng: -13.667, municipality: 'Tinajo' },
    marinePoint: offshore(29.1098, -13.667, 330),
    breakType: 'reef-break',
    skillLevel: 'expert',
    description: 'Una de las olas más pesadas de Europa: tubo de izquierdas con caída vertical sobre reef poco profundo. Solo para expertos.',
    idealConditions: {
      minSwellHeightM: 1.5,
      maxSwellHeightM: 5.0,
      minPeriodSec: 12,
      optimalSwellDegrees: { min: 300, max: 30 }, // WNW to NNE
      favorableWindDegrees: { min: 80, max: 160 }, // E to SSE
      maxFavorableWindKmh: 20,
      preferredTide: 'high',
    },
  },
  {
    id: 'caleta-de-caballo',
    slug: 'caleta-de-caballo',
    name: 'Caleta de Caballo',
    zone: 'lz-la-santa',
    location: { lat: 29.1075, lng: -13.6255, municipality: 'Tinajo' },
    marinePoint: offshore(29.1075, -13.6255, 340),
    breakType: 'reef-break',
    skillLevel: 'intermediate',
    description: 'Pueblo de pescadores con una izquierda y una derecha sobre reef. Menos gente que La Santa; ojo con las corrientes y las rocas.',
    idealConditions: {
      minSwellHeightM: 0.9,
      maxSwellHeightM: 2.8,
      minPeriodSec: 10,
      optimalSwellDegrees: { min: 290, max: 20 },
      favorableWindDegrees: { min: 100, max: 200 },
      maxFavorableWindKmh: 20,
      preferredTide: 'mid',
    },
  },

  // ==========================================
  // NORTE Y ESTE
  // ==========================================
  {
    id: 'la-canteria',
    slug: 'la-canteria',
    name: 'La Cantería (Órzola)',
    zone: 'lz-norte-este',
    location: { lat: 29.2155, lng: -13.466, municipality: 'Haría' },
    marinePoint: offshore(29.2155, -13.466, 0),
    breakType: 'beach-break',
    skillLevel: 'intermediate',
    description: 'Playa salvaje al pie del risco, frente a La Graciosa, con una izquierda rápida. Corrientes fuertes; mejor subiendo hacia pleamar.',
    idealConditions: {
      minSwellHeightM: 0.8,
      maxSwellHeightM: 2.8,
      minPeriodSec: 9,
      optimalSwellDegrees: { min: 290, max: 40 },
      favorableWindDegrees: { min: 140, max: 220 }, // SE to SW
      maxFavorableWindKmh: 20,
      preferredTide: 'high',
    },
  },
  {
    id: 'jameos-del-agua',
    slug: 'jameos-del-agua',
    name: 'Jameos del Agua',
    zone: 'lz-norte-este',
    location: { lat: 29.1575, lng: -13.432, municipality: 'Haría' },
    marinePoint: offshore(29.1575, -13.432, 60),
    breakType: 'point-break',
    skillLevel: 'advanced',
    description: 'Izquierda larga de la costa este que pide mar grande del norte; reef profundo y expuesto. Respeta a los locales.',
    idealConditions: {
      minSwellHeightM: 1.5,
      maxSwellHeightM: 4.0,
      minPeriodSec: 11,
      optimalSwellDegrees: { min: 330, max: 40 }, // NNW to NE
      favorableWindDegrees: { min: 200, max: 290 }, // SSW to WNW
      maxFavorableWindKmh: 25,
      preferredTide: 'mid',
    },
  },
]);
