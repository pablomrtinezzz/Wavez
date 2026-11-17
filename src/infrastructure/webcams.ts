import { IslandId } from '@/domain/models/Island';
import { Webcam, relationTo } from '@/domain/models/Webcam';

/**
 * Live cameras around the islands, checked by hand in November 2026.
 *
 * - In2theBeach lets other sites embed its players: those play inside Wavez.
 *   Only cameras whose stream was live are listed (several of its cameras,
 *   and every YouTube-based one, were off).
 * - SkylineWebcams forbids embedding (X-Frame-Options), so Wavez links to
 *   each camera's page instead.
 */
const i2b = (id: number, slug: string) => ({
  kind: 'embed' as const,
  provider: 'In2theBeach',
  embedUrl: `https://in2thebeach.es/callbacks/camviewer_ext2.php?id=${id}`,
  pageUrl: `https://in2thebeach.es/webcam/${id}/${slug}/`,
});

const skyline = (path: string) => ({
  kind: 'link' as const,
  provider: 'SkylineWebcams',
  pageUrl: `https://www.skylinewebcams.com/es/webcam/espana/canarias/${path}.html`,
});

export const WEBCAMS: Webcam[] = [
  // ==========================================
  // GRAN CANARIA
  // ==========================================
  { id: 'cicer-el-cruce', name: 'La Cícer (El Cruce)', island: 'gran-canaria', source: i2b(81, 'playa-de-la-cicer-el-cruce'), spotsInView: ['la-cicer'], spotsNearby: ['los-muellitos', 'el-lloret'] },
  { id: 'cicer-skyline', name: 'Las Canteras, zona de surf', island: 'gran-canaria', source: skyline('las-palmas-gran-canaria/la-cicer-las-canteras'), spotsInView: ['la-cicer'], spotsNearby: ['los-muellitos'] },
  { id: 'las-canteras-la-barra', name: 'Las Canteras (La Barra)', island: 'gran-canaria', source: i2b(23, 'playa-de-las-canteras-la-barra'), spotsInView: ['la-barra'], spotsNearby: ['el-confital'] },
  { id: 'san-felipe', name: 'San Felipe (Vagabundo)', island: 'gran-canaria', source: i2b(142, 'playa-de-arena-de-san-felipe-vagabundo'), spotsInView: ['san-felipe'], spotsNearby: [] },
  { id: 'el-puertillo', name: 'El Puertillo (Arucas)', island: 'gran-canaria', source: i2b(17, 'playa-de-el-puertillo'), spotsInView: [], spotsNearby: ['quintanilla'] },
  { id: 'playa-del-hombre', name: 'Playa del Hombre', island: 'gran-canaria', source: i2b(2, 'playa-del-hombre'), spotsInView: ['playa-del-hombre'], spotsNearby: ['melenara'] },
  { id: 'melenara', name: 'Playa de Melenara', island: 'gran-canaria', source: skyline('las-palmas/taliarte-playa-melenara'), spotsInView: ['melenara'], spotsNearby: [] },
  { id: 'la-garita', name: 'Playa de La Garita', island: 'gran-canaria', source: i2b(51, 'playa-de-la-garita'), spotsInView: ['la-garita'], spotsNearby: [] },
  { id: 'maspalomas', name: 'Maspalomas', island: 'gran-canaria', source: i2b(12, 'maspalomas'), spotsInView: ['maspalomas-punta'], spotsNearby: [] },
  { id: 'playa-del-ingles', name: 'Playa del Inglés', island: 'gran-canaria', source: i2b(3, 'playa-del-ingles-izquierda'), spotsInView: ['playa-del-ingles'], spotsNearby: [] },
  { id: 'el-veril', name: 'Playa del Veril', island: 'gran-canaria', source: i2b(47, 'playa-del-veril'), spotsInView: [], spotsNearby: ['playa-del-ingles'] },
  { id: 'aguila', name: 'Playa del Águila', island: 'gran-canaria', source: i2b(92, 'aguila-playa'), spotsInView: [], spotsNearby: ['bahia-feliz'] },
  { id: 'arguineguin', name: 'Arguineguín', island: 'gran-canaria', source: i2b(61, 'arguineguin'), spotsInView: ['arguineguin'], spotsNearby: [] },
  { id: 'el-pajar', name: 'El Pajar', island: 'gran-canaria', source: i2b(71, 'el-pajar-santa-agueda-arguineguin'), spotsInView: [], spotsNearby: ['arguineguin'] },

  // ==========================================
  // TENERIFE
  // ==========================================
  { id: 'las-americas', name: 'Playa de Las Américas', island: 'tenerife', source: skyline('santa-cruz-de-tenerife/playa-de-las-americas'), spotsInView: ['la-izquierda'], spotsNearby: ['playa-de-troya'] },
  { id: 'playa-de-troya', name: 'Playa de Troya', island: 'tenerife', source: skyline('santa-cruz-de-tenerife/playa-troya'), spotsInView: ['playa-de-troya'], spotsNearby: ['la-izquierda'] },
  { id: 'martianez', name: 'Lago Martiánez', island: 'tenerife', source: skyline('santa-cruz-de-tenerife/puerto-de-la-cruz-lago-martianez'), spotsInView: ['martianez'], spotsNearby: [] },
  { id: 'san-telmo', name: 'Playa San Telmo (Puerto de la Cruz)', island: 'tenerife', source: skyline('santa-cruz-de-tenerife/puerto-de-la-cruz-playa-san-telmo'), spotsInView: [], spotsNearby: ['martianez', 'playa-jardin'] },
  { id: 'mesa-del-mar', name: 'Mesa del Mar', island: 'tenerife', source: skyline('santa-cruz-de-tenerife/tacoronte-mesa-del-mar'), spotsInView: ['mesa-del-mar'], spotsNearby: [] },
  { id: 'punta-del-hidalgo', name: 'Punta del Hidalgo', island: 'tenerife', source: skyline('santa-cruz-de-tenerife/punta-del-hidalgo'), spotsInView: ['punta-del-hidalgo'], spotsNearby: [] },
  { id: 'benijo', name: 'Playa de Benijo', island: 'tenerife', source: skyline('santa-cruz-de-tenerife/santa-cruz-de-tenerife-playa-de-benijo'), spotsInView: ['benijo'], spotsNearby: ['almaciga'] },
  { id: 'el-cabezo', name: 'El Cabezo (El Médano)', island: 'tenerife', source: skyline('santa-cruz-de-tenerife/playa-el-cabezo'), spotsInView: ['el-cabezo'], spotsNearby: [] },
  { id: 'playa-san-juan', name: 'Playa San Juan (Guía de Isora)', island: 'tenerife', source: skyline('santa-cruz-de-tenerife/guia-de-isora'), spotsInView: [], spotsNearby: ['punta-blanca-tenerife'] },

  // ==========================================
  // LANZAROTE
  // ==========================================
  { id: 'famara', name: 'Playa de Famara', island: 'lanzarote', source: i2b(42, 'playa-de-famara'), spotsInView: ['famara'], spotsNearby: ['caleta-de-famara', 'ghost-town'] },
  { id: 'famara-red-star', name: 'Famara (Red Star Surf)', island: 'lanzarote', source: i2b(82, 'playa-de-famara-redstar'), spotsInView: ['famara'], spotsNearby: ['san-juan', 'caleta-de-famara'] },
  { id: 'las-cucharas', name: 'Las Cucharas (Costa Teguise)', island: 'lanzarote', source: skyline('las-palmas/playa-las-cucharas'), spotsInView: ['las-cucharas'], spotsNearby: [] },

  // ==========================================
  // FUERTEVENTURA
  // ==========================================
  { id: 'grandes-playas', name: 'Grandes Playas de Corralejo', island: 'fuerteventura', source: skyline('corralejo/grandes-playas-corralejo'), spotsInView: ['flag-beach'], spotsNearby: [] },
  { id: 'corralejo', name: 'Corralejo', island: 'fuerteventura', source: skyline('corralejo/fuerteventura-corralejo'), spotsInView: [], spotsNearby: ['shooting-gallery', 'generoso'] },

  // ==========================================
  // LA PALMA, LA GOMERA, EL HIERRO
  // ==========================================
  { id: 'charco-verde', name: 'Charco Verde', island: 'la-palma', source: skyline('santa-cruz-de-tenerife/los-llanos-de-aridane-charco-verde'), spotsInView: [], spotsNearby: ['puerto-naos'] },
  { id: 'playa-de-santiago', name: 'Playa de Santiago', island: 'la-gomera', source: skyline('santa-cruz-de-tenerife/la-gomera'), spotsInView: [], spotsNearby: [] },
  { id: 'la-estaca', name: 'Puerto de La Estaca', island: 'el-hierro', source: skyline('santa-cruz-de-tenerife/el-hierro-timijiraque'), spotsInView: [], spotsNearby: ['timijiraque'] },
];

/** Cameras of a spot: those pointing at it first, then nearby ones; players before links. */
export function webcamsOfSpot(spotId: string): Webcam[] {
  const rank = (w: Webcam) => (relationTo(w, spotId) === 'in-view' ? 0 : 2) + (w.source.kind === 'embed' ? 0 : 1);
  return WEBCAMS.filter((w) => relationTo(w, spotId)).sort((a, b) => rank(a) - rank(b));
}

export function webcamsOfIsland(island: IslandId): Webcam[] {
  return WEBCAMS.filter((w) => w.island === island);
}

export const SPOTS_WITH_LIVE_PLAYER = new Set(
  WEBCAMS.filter((w) => w.source.kind === 'embed').flatMap((w) => [...w.spotsInView, ...w.spotsNearby])
);
