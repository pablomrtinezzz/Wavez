import { IslandId } from '@/domain/models/Island';
import { Webcam, relationTo } from '@/domain/models/Webcam';

/**
 * Live cameras around the islands, checked by hand in November 2026.
 *
 * - In2theBeach lets other sites embed its players: those play inside Wavez.
 *   Only cameras whose stream was live are listed (several of its cameras,
 *   and every YouTube-based one, were off).
 * - YouTube live streams play inside Wavez only when their owner allows
 *   embedding (in privacy-enhanced mode); the others are linked.
 * - SkylineWebcams does not allow embedding its player, but offers a live
 *   still for other sites (its own "embed" code: the picture linked to the
 *   camera page). Wavez shows that picture and links to the page.
 *
 * Every camera was checked by looking at its picture, not just at whether
 * it streams: a live camera can point at a street.
 *
 * `npm run check:webcams` reports cameras that stopped streaming.
 */
const i2b = (id: number, slug: string) => ({
  kind: 'embed' as const,
  provider: 'In2theBeach',
  embedUrl: `https://in2thebeach.es/callbacks/camviewer_ext2.php?id=${id}`,
  pageUrl: `https://in2thebeach.es/webcam/${id}/${slug}/`,
});

/** A YouTube live stream whose owner allows embedding. */
const youtube = (videoId: string, channel: string) => ({
  kind: 'embed' as const,
  provider: `${channel} · YouTube`,
  embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&rel=0`,
  pageUrl: `https://www.youtube.com/watch?v=${videoId}`,
});

/** A YouTube live stream whose owner does not allow embedding. */
const youtubeLink = (videoId: string, channel: string) => ({
  kind: 'link' as const,
  provider: `${channel} · YouTube`,
  pageUrl: `https://www.youtube.com/watch?v=${videoId}`,
  snapshotUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault_live.jpg`,
});

/** `embedId` is the number in SkylineWebcams' own embed code for the camera. */
const skyline = (path: string, embedId: number) => ({
  kind: 'link' as const,
  provider: 'SkylineWebcams',
  pageUrl: `https://www.skylinewebcams.com/es/webcam/espana/canarias/${path}.html`,
  snapshotUrl: `https://embed.skylinewebcams.com/img/${embedId}.jpg`,
});

export const WEBCAMS: Webcam[] = [
  // ==========================================
  // GRAN CANARIA
  // ==========================================
  { id: 'cicer-el-cruce', name: 'La Cícer (El Cruce)', island: 'gran-canaria', source: i2b(81, 'playa-de-la-cicer-el-cruce'), spotsInView: ['la-cicer'], spotsNearby: ['los-muellitos', 'el-lloret'] },
  { id: 'cicer-skyline', name: 'Las Canteras, zona de surf', island: 'gran-canaria', source: skyline('las-palmas-gran-canaria/la-cicer-las-canteras', 627), spotsInView: ['la-cicer'], spotsNearby: ['los-muellitos'] },
  { id: 'las-canteras-la-barra', name: 'Las Canteras (La Barra)', island: 'gran-canaria', source: i2b(23, 'playa-de-las-canteras-la-barra'), spotsInView: ['la-barra'], spotsNearby: ['el-confital'] },
  { id: 'san-felipe', name: 'San Felipe (Vagabundo)', island: 'gran-canaria', source: i2b(142, 'playa-de-arena-de-san-felipe-vagabundo'), spotsInView: ['san-felipe'], spotsNearby: [] },
  { id: 'el-puertillo', name: 'El Puertillo (Arucas)', island: 'gran-canaria', source: i2b(17, 'playa-de-el-puertillo'), spotsInView: [], spotsNearby: ['quintanilla'] },
  { id: 'playa-del-hombre', name: 'Playa del Hombre', island: 'gran-canaria', source: i2b(2, 'playa-del-hombre'), spotsInView: ['playa-del-hombre'], spotsNearby: ['melenara'] },
  { id: 'melenara', name: 'Playa de Melenara', island: 'gran-canaria', source: skyline('las-palmas/taliarte-playa-melenara', 6190), spotsInView: ['melenara'], spotsNearby: [] },
  { id: 'la-garita', name: 'Playa de La Garita', island: 'gran-canaria', source: i2b(51, 'playa-de-la-garita'), spotsInView: ['la-garita'], spotsNearby: [] },
  { id: 'maspalomas', name: 'Maspalomas', island: 'gran-canaria', source: i2b(12, 'maspalomas'), spotsInView: ['maspalomas-punta'], spotsNearby: [] },
  { id: 'playa-del-ingles', name: 'Playa del Inglés', island: 'gran-canaria', source: i2b(3, 'playa-del-ingles-izquierda'), spotsInView: ['playa-del-ingles'], spotsNearby: [] },
  { id: 'el-veril', name: 'Playa del Veril', island: 'gran-canaria', source: i2b(47, 'playa-del-veril'), spotsInView: [], spotsNearby: ['playa-del-ingles'] },
  { id: 'aguila', name: 'Playa del Águila', island: 'gran-canaria', source: i2b(92, 'aguila-playa'), spotsInView: [], spotsNearby: ['bahia-feliz'] },
  { id: 'arguineguin', name: 'Arguineguín', island: 'gran-canaria', source: i2b(61, 'arguineguin'), spotsInView: ['arguineguin'], spotsNearby: [] },
  { id: 'pozo-izquierdo', name: 'Pozo Izquierdo (PozoWinds)', island: 'gran-canaria', source: youtube('PN6BN5fqw18', 'PozoWinds'), spotsInView: ['mosca-point'], spotsNearby: [] },
  { id: 'el-pajar', name: 'El Pajar', island: 'gran-canaria', source: i2b(71, 'el-pajar-santa-agueda-arguineguin'), spotsInView: [], spotsNearby: ['arguineguin'] },

  // ==========================================
  // TENERIFE
  // ==========================================
  { id: 'las-americas', name: 'Playa de Las Américas', island: 'tenerife', source: skyline('santa-cruz-de-tenerife/playa-de-las-americas', 1115), spotsInView: [], spotsNearby: ['la-izquierda', 'playa-de-troya'] },
  { id: 'playa-de-troya', name: 'Playa de Troya', island: 'tenerife', source: skyline('santa-cruz-de-tenerife/playa-troya', 382), spotsInView: ['playa-de-troya'], spotsNearby: ['la-izquierda'] },
  { id: 'martianez', name: 'Lago Martiánez', island: 'tenerife', source: skyline('santa-cruz-de-tenerife/puerto-de-la-cruz-lago-martianez', 1042), spotsInView: ['martianez'], spotsNearby: [] },
  { id: 'san-telmo', name: 'Playa San Telmo (Puerto de la Cruz)', island: 'tenerife', source: skyline('santa-cruz-de-tenerife/puerto-de-la-cruz-playa-san-telmo', 792), spotsInView: [], spotsNearby: ['martianez', 'playa-jardin'] },
  { id: 'mesa-del-mar', name: 'Mesa del Mar', island: 'tenerife', source: skyline('santa-cruz-de-tenerife/tacoronte-mesa-del-mar', 5602), spotsInView: ['mesa-del-mar'], spotsNearby: [] },
  { id: 'punta-del-hidalgo', name: 'Punta del Hidalgo', island: 'tenerife', source: skyline('santa-cruz-de-tenerife/punta-del-hidalgo', 1065), spotsInView: ['punta-del-hidalgo'], spotsNearby: [] },
  { id: 'benijo', name: 'Playa de Benijo', island: 'tenerife', source: skyline('santa-cruz-de-tenerife/santa-cruz-de-tenerife-playa-de-benijo', 1490), spotsInView: ['benijo'], spotsNearby: ['almaciga'] },
  { id: 'el-cabezo', name: 'El Cabezo (El Médano)', island: 'tenerife', source: skyline('santa-cruz-de-tenerife/playa-el-cabezo', 1240), spotsInView: ['el-cabezo'], spotsNearby: [] },
  { id: 'playa-san-juan', name: 'Playa San Juan (Guía de Isora)', island: 'tenerife', source: skyline('santa-cruz-de-tenerife/guia-de-isora', 3033), spotsInView: [], spotsNearby: ['punta-blanca-tenerife'] },

  // ==========================================
  // LANZAROTE
  // ==========================================
  { id: 'famara', name: 'Playa de Famara', island: 'lanzarote', source: i2b(42, 'playa-de-famara'), spotsInView: ['famara'], spotsNearby: ['caleta-de-famara', 'ghost-town'] },
  { id: 'famara-red-star', name: 'Famara (Red Star Surf)', island: 'lanzarote', source: i2b(82, 'playa-de-famara-redstar'), spotsInView: ['famara'], spotsNearby: ['san-juan', 'caleta-de-famara'] },
  { id: 'las-cucharas', name: 'Las Cucharas (Costa Teguise)', island: 'lanzarote', source: skyline('las-palmas/playa-las-cucharas', 451), spotsInView: [], spotsNearby: ['las-cucharas'] },

  // ==========================================
  // FUERTEVENTURA
  // ==========================================
  { id: 'grandes-playas', name: 'Grandes Playas de Corralejo', island: 'fuerteventura', source: skyline('corralejo/grandes-playas-corralejo', 6086), spotsInView: ['flag-beach'], spotsNearby: [] },
  { id: 'corralejo-bay', name: 'Bahía de Corralejo y Lobos', island: 'fuerteventura', source: youtubeLink('C1jR1DsIPFs', 'Fuerteventura Playas'), spotsInView: [], spotsNearby: ['lobos', 'shooting-gallery', 'generoso'] },

  // ==========================================
  // LA PALMA, LA GOMERA, EL HIERRO
  // ==========================================
  { id: 'puerto-naos', name: 'Playa de Puerto Naos', island: 'la-palma', source: { kind: 'link', provider: 'La Palma Rent a Car', pageUrl: 'https://lapalmarentacar.com/webcam/puerto_naos' }, spotsInView: ['puerto-naos'], spotsNearby: [] },
  { id: 'los-cancajos', name: 'Playa de Los Cancajos', island: 'la-palma', source: youtubeLink('TzZbvIDIpy0', 'Turismo Breña Baja'), spotsInView: [], spotsNearby: [] },
  { id: 'charco-verde', name: 'Charco Verde', island: 'la-palma', source: skyline('santa-cruz-de-tenerife/los-llanos-de-aridane-charco-verde', 6176), spotsInView: [], spotsNearby: ['puerto-naos'] },
  { id: 'playa-de-santiago', name: 'Playa de Santiago', island: 'la-gomera', source: skyline('santa-cruz-de-tenerife/la-gomera', 1158), spotsInView: [], spotsNearby: [] },
  { id: 'la-estaca', name: 'Puerto de La Estaca', island: 'el-hierro', source: skyline('santa-cruz-de-tenerife/el-hierro-timijiraque', 5538), spotsInView: [], spotsNearby: ['timijiraque'] },
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
