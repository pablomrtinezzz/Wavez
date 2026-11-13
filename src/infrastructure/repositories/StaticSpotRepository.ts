import { Spot, ZoneId } from '@/domain/models/Spot';
import { SpotRepository } from '@/domain/ports/SpotRepository';

export const GRAN_CANARIA_SPOTS: Spot[] = [
  // ==========================================
  // ZONA 1: LAS PALMAS DE GRAN CANARIA
  // ==========================================
  {
    id: 'la-cicer',
    slug: 'la-cicer',
    name: 'La Cícer (Las Canteras)',
    zone: 'las-palmas',
    location: { lat: 28.134, lng: -15.448, municipality: 'Las Palmas' },
    breakType: 'beach-break',
    skillLevel: 'all-levels',
    description: 'La cuna del surf urbano en Canarias. Picos variados sobre arena (El Bufo, Los Muellitos, Piti).',
    idealConditions: {
      minSwellHeightM: 0.8,
      maxSwellHeightM: 2.5,
      minPeriodSec: 10,
      optimalSwellDegrees: { min: 290, max: 20 }, // WNW to NNE
      favorableWindDegrees: { min: 140, max: 220 }, // SE to SW (Terral)
      maxFavorableWindKmh: 22,
      preferredTide: 'mid',
    },
    webcam: {
      provider: 'in2thebeach',
      iframeUrl: 'https://in2thebeach.es/callbacks/camviewer_ext2.php?id=81',
      attributionTitle: 'Webcam PLAYA DE LA CICER (El Cruce)',
      attributionUrl: 'https://in2thebeach.es/webcam/81/playa-de-la-cicer-el-cruce/',
      aspectRatio: '16/9',
    },
    surfForecastSlug: 'La-Cicer',
  },
  {
    id: 'el-confital',
    slug: 'el-confital',
    name: 'El Confital',
    zone: 'las-palmas',
    location: { lat: 28.156, lng: -15.438, municipality: 'Las Palmas' },
    breakType: 'slab',
    skillLevel: 'expert',
    description: 'Derecha mítica y tubular de clase mundial sobre fondo de laja volcánica poco profunda.',
    idealConditions: {
      minSwellHeightM: 1.5,
      maxSwellHeightM: 4.0,
      minPeriodSec: 12,
      optimalSwellDegrees: { min: 280, max: 340 }, // W to NNW
      favorableWindDegrees: { min: 80, max: 170 }, // E to SSE
      maxFavorableWindKmh: 18,
      preferredTide: 'mid',
    },
    surfForecastSlug: 'El-Confital',
  },
  {
    id: 'el-lloret',
    slug: 'el-lloret',
    name: 'El Lloret',
    zone: 'las-palmas',
    location: { lat: 28.138, lng: -15.449, municipality: 'Las Palmas' },
    breakType: 'point-break',
    skillLevel: 'advanced',
    description: 'Derecha noble y potente sobre fondo de piedras/callaos. Aguanta mucho tamaño cuando entra mar grande.',
    idealConditions: {
      minSwellHeightM: 1.8,
      maxSwellHeightM: 4.5,
      minPeriodSec: 11,
      optimalSwellDegrees: { min: 310, max: 20 }, // NW to NNE
      favorableWindDegrees: { min: 140, max: 220 }, // S/SW
      maxFavorableWindKmh: 20,
      preferredTide: 'low',
    },
    surfForecastSlug: 'El-Lloret',
  },
  {
    id: 'la-barra',
    slug: 'la-barra',
    name: 'La Barra (Las Canteras)',
    zone: 'las-palmas',
    location: { lat: 28.143, lng: -15.437, municipality: 'Las Palmas' },
    breakType: 'reef-break',
    skillLevel: 'advanced',
    description: 'Arrecife natural que rompe con marejadas potentes de norte y mareas específicas.',
    idealConditions: {
      minSwellHeightM: 2.0,
      maxSwellHeightM: 4.0,
      minPeriodSec: 12,
      optimalSwellDegrees: { min: 320, max: 30 },
      favorableWindDegrees: { min: 150, max: 210 },
      maxFavorableWindKmh: 18,
      preferredTide: 'low',
    },
    webcam: {
      provider: 'in2thebeach',
      iframeUrl: 'https://in2thebeach.es/callbacks/camviewer_ext2.php?id=23',
      attributionTitle: 'Webcam PLAYA DE LAS CANTERAS - LA BARRA',
      attributionUrl: 'https://in2thebeach.es/webcam/23/playa-de-las-canteras-la-barra/',
      aspectRatio: '16/9',
    },
  },
  {
    id: 'los-muellitos',
    slug: 'los-muellitos',
    name: 'Los Muellitos (Auditorio)',
    zone: 'las-palmas',
    location: { lat: 28.131, lng: -15.451, municipality: 'Las Palmas' },
    breakType: 'beach-break',
    skillLevel: 'intermediate',
    description: 'Extremo sur de la Cícer pegado al Auditorio Alfredo Kraus. Buen refugio cuando entra viento sur.',
    idealConditions: {
      minSwellHeightM: 1.0,
      maxSwellHeightM: 2.2,
      minPeriodSec: 9,
      optimalSwellDegrees: { min: 290, max: 10 },
      favorableWindDegrees: { min: 160, max: 220 },
      maxFavorableWindKmh: 25,
      preferredTide: 'mid',
    },
    webcam: {
      provider: 'in2thebeach',
      iframeUrl: 'https://in2thebeach.es/callbacks/camviewer_ext2.php?id=57',
      attributionTitle: 'Webcam PLAYA DE LA CICER (AUDITORIO)',
      attributionUrl: 'https://in2thebeach.es/webcam/57/playa-de-la-cicer-auditorio/',
      aspectRatio: '16/9',
    },
  },

  // ==========================================
  // ZONA 2: COSTA NORTE (GÁLDAR / MOYA / ARUCAS)
  // ==========================================
  {
    id: 'el-fronton',
    slug: 'el-fronton',
    name: 'El Frontón',
    zone: 'costa-norte',
    location: { lat: 28.173, lng: -15.656, municipality: 'Gáldar' },
    breakType: 'slab',
    skillLevel: 'expert',
    description: 'La ola más radical de Canarias. Tubo descomunal de derecha e izquierda sobre laja volcánica seca.',
    idealConditions: {
      minSwellHeightM: 1.8,
      maxSwellHeightM: 5.0,
      minPeriodSec: 13,
      optimalSwellDegrees: { min: 300, max: 350 }, // WNW to NNW
      favorableWindDegrees: { min: 160, max: 220 }, // S/SW
      maxFavorableWindKmh: 16,
      preferredTide: 'mid',
    },
    surfForecastSlug: 'El-Fronton',
  },
  {
    id: 'el-agujero',
    slug: 'el-agujero',
    name: 'El Agujero',
    zone: 'costa-norte',
    location: { lat: 28.169, lng: -15.660, municipality: 'Gáldar' },
    breakType: 'reef-break',
    skillLevel: 'advanced',
    description: 'Zona de rompientes de calidad para surf y bodyboard con picos sobre baja y pozas naturales.',
    idealConditions: {
      minSwellHeightM: 1.2,
      maxSwellHeightM: 3.0,
      minPeriodSec: 11,
      optimalSwellDegrees: { min: 310, max: 360 },
      favorableWindDegrees: { min: 160, max: 220 },
      maxFavorableWindKmh: 20,
      preferredTide: 'mid',
    },
    surfForecastSlug: 'El-Agujero',
  },
  {
    id: 'san-felipe',
    slug: 'san-felipe',
    name: 'San Felipe (El Vagabundo)',
    zone: 'costa-norte',
    location: { lat: 28.152, lng: -15.589, municipality: 'Santa María de Guía' },
    breakType: 'beach-break',
    skillLevel: 'intermediate',
    description: 'El spot más regular y agradecido del norte. Fondo de arena y callao, ola maniobrable.',
    idealConditions: {
      minSwellHeightM: 1.0,
      maxSwellHeightM: 2.5,
      minPeriodSec: 10,
      optimalSwellDegrees: { min: 320, max: 30 },
      favorableWindDegrees: { min: 160, max: 210 },
      maxFavorableWindKmh: 20,
      preferredTide: 'low',
    },
    surfForecastSlug: 'San-Felipe',
    webcam: {
      provider: 'in2thebeach',
      iframeUrl: 'https://in2thebeach.es/callbacks/camviewer_ext2.php?id=142',
      attributionTitle: 'Webcam Playa de San Felipe (Vagabundo)',
      attributionUrl: 'https://in2thebeach.es/webcam/142/playa-de-arena-de-san-felipe-vagabundo/',
      aspectRatio: '16/9',
    },
  },
  {
    id: 'el-altillo',
    slug: 'el-altillo',
    name: 'El Altillo',
    zone: 'costa-norte',
    location: { lat: 28.150, lng: -15.576, municipality: 'Moya' },
    breakType: 'reef-break',
    skillLevel: 'advanced',
    description: 'Izquierda y derecha sobre roca volcánica, rápida y con buena sección para maniobras.',
    idealConditions: {
      minSwellHeightM: 1.2,
      maxSwellHeightM: 3.0,
      minPeriodSec: 11,
      optimalSwellDegrees: { min: 320, max: 20 },
      favorableWindDegrees: { min: 170, max: 220 },
      maxFavorableWindKmh: 18,
      preferredTide: 'mid',
    },
  },
  {
    id: 'quintanilla',
    slug: 'quintanilla',
    name: 'Quintanilla (Las Salinas)',
    zone: 'costa-norte',
    location: { lat: 28.146, lng: -15.534, municipality: 'Arucas' },
    breakType: 'reef-break',
    skillLevel: 'advanced',
    description: 'Varios picos técnicos sobre laja de roca. Excelente calidad en invierno.',
    idealConditions: {
      minSwellHeightM: 1.2,
      maxSwellHeightM: 3.0,
      minPeriodSec: 10,
      optimalSwellDegrees: { min: 320, max: 30 },
      favorableWindDegrees: { min: 160, max: 210 },
      maxFavorableWindKmh: 20,
      preferredTide: 'mid',
    },
  },

  // ==========================================
  // ZONA 3: TELDE / COSTA ESTE
  // ==========================================
  {
    id: 'playa-del-hombre',
    slug: 'playa-del-hombre',
    name: 'Playa del Hombre',
    zone: 'telde-este',
    location: { lat: 28.006, lng: -15.378, municipality: 'Telde' },
    breakType: 'beach-break',
    skillLevel: 'all-levels',
    description: 'El spot de referencia en Telde. Múltiples picos de arena rápidos y consistentes.',
    idealConditions: {
      minSwellHeightM: 0.9,
      maxSwellHeightM: 2.4,
      minPeriodSec: 9,
      optimalSwellDegrees: { min: 350, max: 90 }, // N to E
      favorableWindDegrees: { min: 250, max: 320 }, // W to NW (Terral)
      maxFavorableWindKmh: 24,
      preferredTide: 'mid',
    },
    webcam: {
      provider: 'in2thebeach',
      iframeUrl: 'https://in2thebeach.es/callbacks/camviewer_ext2.php?id=2',
      attributionTitle: 'Webcam PLAYA DEL HOMBRE',
      attributionUrl: 'https://in2thebeach.es/webcam/2/playa-del-hombre/',
      aspectRatio: '16/9',
    },
    surfForecastSlug: 'Playa-del-Hombre',
  },
  {
    id: 'ojos-de-garza',
    slug: 'ojos-de-garza',
    name: 'Ojos de Garza',
    zone: 'telde-este',
    location: { lat: 27.955, lng: -15.374, municipality: 'Telde' },
    breakType: 'point-break',
    skillLevel: 'intermediate',
    description: 'Bahía resguardada con derecha noble que funciona cuando entra mar del este o norte cruzado.',
    idealConditions: {
      minSwellHeightM: 1.2,
      maxSwellHeightM: 2.8,
      minPeriodSec: 10,
      optimalSwellDegrees: { min: 40, max: 110 }, // NE to ESE
      favorableWindDegrees: { min: 240, max: 310 }, // W/NW
      maxFavorableWindKmh: 22,
      preferredTide: 'mid',
    },
    surfForecastSlug: 'Ojos-de-Garza',
  },
  {
    id: 'la-garita',
    slug: 'la-garita',
    name: 'La Garita / San Borondón',
    zone: 'telde-este',
    location: { lat: 28.019, lng: -15.381, municipality: 'Telde' },
    breakType: 'reef-break',
    skillLevel: 'advanced',
    description: 'Picos sobre laja y arena. Ola potente y orillera en marejadas del este.',
    idealConditions: {
      minSwellHeightM: 1.0,
      maxSwellHeightM: 2.5,
      minPeriodSec: 10,
      optimalSwellDegrees: { min: 30, max: 100 },
      favorableWindDegrees: { min: 250, max: 320 },
      maxFavorableWindKmh: 20,
      preferredTide: 'high',
    },
    webcam: {
      provider: 'in2thebeach',
      iframeUrl: 'https://in2thebeach.es/callbacks/camviewer_ext2.php?id=51',
      attributionTitle: 'Webcam PLAYA DE LA GARITA',
      attributionUrl: 'https://in2thebeach.es/webcam/51/playa-de-la-garita/',
      aspectRatio: '16/9',
    },
  },
  {
    id: 'playa-de-silva',
    slug: 'playa-de-silva',
    name: 'Playa de Silva',
    zone: 'telde-este',
    location: { lat: 28.033, lng: -15.387, municipality: 'Telde' },
    breakType: 'beach-break',
    skillLevel: 'intermediate',
    description: 'Picos sobre callaos y arena, salvavidas cuando el norte grande entra cruzado.',
    idealConditions: {
      minSwellHeightM: 1.2,
      maxSwellHeightM: 2.6,
      minPeriodSec: 9,
      optimalSwellDegrees: { min: 0, max: 80 },
      favorableWindDegrees: { min: 240, max: 310 },
      maxFavorableWindKmh: 22,
      preferredTide: 'low',
    },
  },
  {
    id: 'melenara',
    slug: 'melenara',
    name: 'Melenara / Salinetas',
    zone: 'telde-este',
    location: { lat: 27.993, lng: -15.373, municipality: 'Telde' },
    breakType: 'beach-break',
    skillLevel: 'all-levels',
    description: 'Olas suaves y resguardadas cuando entran marejadas raras del este/sureste.',
    idealConditions: {
      minSwellHeightM: 1.4,
      maxSwellHeightM: 2.5,
      minPeriodSec: 10,
      optimalSwellDegrees: { min: 60, max: 120 },
      favorableWindDegrees: { min: 260, max: 330 },
      maxFavorableWindKmh: 20,
      preferredTide: 'mid',
    },
  },

  // ==========================================
  // ZONA 4: SUR / SURESTE
  // ==========================================
  {
    id: 'maspalomas-punta',
    slug: 'maspalomas-punta',
    name: 'Maspalomas (Punta / Faro)',
    zone: 'sur-sureste',
    location: { lat: 27.733, lng: -15.586, municipality: 'San Bartolomé de Tirajana' },
    breakType: 'point-break',
    skillLevel: 'intermediate',
    description: 'Derecha mítica de pointbreak sobre arena que se activa con temporales de sur o borrascas atlánticas de SW.',
    idealConditions: {
      minSwellHeightM: 1.2,
      maxSwellHeightM: 3.5,
      minPeriodSec: 11,
      optimalSwellDegrees: { min: 180, max: 240 }, // S to SW
      favorableWindDegrees: { min: 0, max: 50 }, // N/NE (Alisio offshore en el sur)
      maxFavorableWindKmh: 28,
      preferredTide: 'mid',
    },
    surfForecastSlug: 'Maspalomas',
    webcam: {
      provider: 'in2thebeach',
      iframeUrl: 'https://in2thebeach.es/callbacks/camviewer_ext2.php?id=123',
      attributionTitle: 'Webcam Dunas de Maspalomas y Playa del Inglés',
      attributionUrl: 'https://in2thebeach.es/webcam/123/dunas-de-maspalomas-y-playa-del-ingles/',
      aspectRatio: '16/9',
    },
  },
  {
    id: 'arguineguin',
    slug: 'arguineguin',
    name: 'Arguineguín / El Pajar',
    zone: 'sur-sureste',
    location: { lat: 27.756, lng: -15.698, municipality: 'Mogán' },
    breakType: 'point-break',
    skillLevel: 'intermediate',
    description: 'Derecha noble de fondo de piedra y arena cuando entran borrascas de suroeste en invierno.',
    idealConditions: {
      minSwellHeightM: 1.5,
      maxSwellHeightM: 3.2,
      minPeriodSec: 12,
      optimalSwellDegrees: { min: 200, max: 260 },
      favorableWindDegrees: { min: 10, max: 70 },
      maxFavorableWindKmh: 22,
      preferredTide: 'low',
    },
    webcam: {
      provider: 'in2thebeach',
      iframeUrl: 'https://in2thebeach.es/callbacks/camviewer_ext2.php?id=135',
      attributionTitle: 'Webcam Playa Las Marañuelas (Arguineguín)',
      attributionUrl: 'https://in2thebeach.es/webcam/135/playa-las-maranuelas-arguineguin/',
      aspectRatio: '16/9',
    },
  },
  {
    id: 'mosca-point',
    slug: 'mosca-point',
    name: 'Mosca Point (Pozo Izquierdo)',
    zone: 'sur-sureste',
    location: { lat: 27.818, lng: -15.422, municipality: 'Santa Lucía de Tirajana' },
    breakType: 'reef-break',
    skillLevel: 'advanced',
    description: 'Derecha rápida y potente sobre arrecife de callaos. Funciona con viento lateral/offshore y swell de este.',
    idealConditions: {
      minSwellHeightM: 1.2,
      maxSwellHeightM: 2.8,
      minPeriodSec: 9,
      optimalSwellDegrees: { min: 60, max: 130 },
      favorableWindDegrees: { min: 250, max: 330 },
      maxFavorableWindKmh: 25,
      preferredTide: 'high',
    },
    surfForecastSlug: 'Mosca-Point',
    webcam: {
      provider: 'in2thebeach',
      iframeUrl: 'https://in2thebeach.es/callbacks/camviewer_ext2.php?id=14',
      attributionTitle: 'Webcam Bahía de Pozo Izquierdo',
      attributionUrl: 'https://in2thebeach.es/webcam/14/bahia-de-pozo-izquierdo/',
      aspectRatio: '16/9',
    },
  },
  {
    id: 'playa-del-ingles',
    slug: 'playa-del-ingles',
    name: 'Playa del Inglés',
    zone: 'sur-sureste',
    location: { lat: 27.753, lng: -15.568, municipality: 'San Bartolomé de Tirajana' },
    breakType: 'beach-break',
    skillLevel: 'all-levels',
    description: 'Picos de arena sencillos y divertidos cuando entra mar de fondo del sur.',
    idealConditions: {
      minSwellHeightM: 1.0,
      maxSwellHeightM: 2.2,
      minPeriodSec: 9,
      optimalSwellDegrees: { min: 150, max: 220 },
      favorableWindDegrees: { min: 340, max: 30 },
      maxFavorableWindKmh: 24,
      preferredTide: 'mid',
    },
    surfForecastSlug: 'Playa-del-Ingles',
    webcam: {
      provider: 'in2thebeach',
      iframeUrl: 'https://in2thebeach.es/callbacks/camviewer_ext2.php?id=3',
      attributionTitle: 'Webcam Playa del Inglés (Izquierda)',
      attributionUrl: 'https://in2thebeach.es/webcam/3/playa-del-ingles-izquierda/',
      aspectRatio: '16/9',
    },
  },
  {
    id: 'bahia-feliz',
    slug: 'bahia-feliz',
    name: 'Bahía Feliz / Castillo del Romeral',
    zone: 'sur-sureste',
    location: { lat: 27.785, lng: -15.515, municipality: 'San Bartolomé de Tirajana' },
    breakType: 'reef-break',
    skillLevel: 'intermediate',
    description: 'Olas protegidas sobre callaos cuando el este/sureste arrecia.',
    idealConditions: {
      minSwellHeightM: 1.2,
      maxSwellHeightM: 2.6,
      minPeriodSec: 10,
      optimalSwellDegrees: { min: 80, max: 140 },
      favorableWindDegrees: { min: 290, max: 360 },
      maxFavorableWindKmh: 22,
      preferredTide: 'mid',
    },
  },
];

export class StaticSpotRepository implements SpotRepository {
  public async getAllSpots(): Promise<Spot[]> {
    return GRAN_CANARIA_SPOTS;
  }

  public async getSpotsByZone(zone: ZoneId): Promise<Spot[]> {
    return GRAN_CANARIA_SPOTS.filter((s) => s.zone === zone);
  }

  public async getSpotById(id: string): Promise<Spot | null> {
    const spot = GRAN_CANARIA_SPOTS.find((s) => s.id === id);
    return spot || null;
  }

  public async getSpotBySlug(slug: string): Promise<Spot | null> {
    const spot = GRAN_CANARIA_SPOTS.find((s) => s.slug === slug);
    return spot || null;
  }
}
