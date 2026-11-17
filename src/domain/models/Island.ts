/**
 * Islands covered by Wavez and the coastal zones each one is split into.
 * Every Canary island shares the Atlantic/Canary timezone, so local times
 * are comparable across the whole archipelago.
 */
export type IslandId = 'gran-canaria' | 'tenerife' | 'lanzarote' | 'fuerteventura' | 'la-palma' | 'la-gomera';

export type ZoneId =
  // Gran Canaria
  | 'las-palmas'
  | 'costa-norte'
  | 'telde-este'
  | 'sur-sureste'
  // Tenerife
  | 'tf-norte'
  | 'tf-anaga'
  | 'tf-sur-oeste'
  | 'tf-este'
  // Lanzarote
  | 'lz-famara'
  | 'lz-la-santa'
  | 'lz-norte-este'
  // Fuerteventura
  | 'fv-corralejo'
  | 'fv-north-shore'
  | 'fv-oeste'
  // La Palma
  | 'lp-este'
  // La Gomera
  | 'lg-norte'
  | 'lg-oeste';

export interface Zone {
  id: ZoneId;
  label: string;
}

export interface Island {
  id: IslandId;
  /** Display name, e.g. 'Gran Canaria'. Also the URL segment is the id. */
  name: string;
  /** Short line used on cards and in metadata. */
  summary: string;
  zones: Zone[];
}

/** Ordered roughly by how much surf each island has. */
export const ISLANDS: Island[] = [
  {
    id: 'gran-canaria',
    name: 'Gran Canaria',
    summary: 'Surf urbano en Las Canteras, reefs potentes en el norte y olas de este en Telde.',
    zones: [
      { id: 'las-palmas', label: 'Las Palmas' },
      { id: 'costa-norte', label: 'Norte' },
      { id: 'telde-este', label: 'Este' },
      { id: 'sur-sureste', label: 'Sur' },
    ],
  },
  {
    id: 'tenerife',
    name: 'Tenerife',
    summary: 'Izquierdas de fondo volcánico en Las Américas en invierno y el norte salvaje de Anaga.',
    zones: [
      { id: 'tf-norte', label: 'Norte' },
      { id: 'tf-anaga', label: 'Anaga' },
      { id: 'tf-sur-oeste', label: 'Sur y oeste' },
      { id: 'tf-este', label: 'Este' },
    ],
  },
  {
    id: 'lanzarote',
    name: 'Lanzarote',
    summary: 'La playa de Famara para todos los niveles y los reefs de La Santa para expertos.',
    zones: [
      { id: 'lz-famara', label: 'Famara' },
      { id: 'lz-la-santa', label: 'La Santa' },
      { id: 'lz-norte-este', label: 'Norte y este' },
    ],
  },
  {
    id: 'fuerteventura',
    name: 'Fuerteventura',
    summary: 'El North Shore de reefs, la derecha de Lobos y las playas abiertas de la costa oeste.',
    zones: [
      { id: 'fv-corralejo', label: 'Corralejo y Lobos' },
      { id: 'fv-north-shore', label: 'North Shore' },
      { id: 'fv-oeste', label: 'Costa oeste' },
    ],
  },
  {
    id: 'la-palma',
    name: 'La Palma',
    summary: 'Pocas olas y poca gente: Nogales, bajo los acantilados del este.',
    zones: [{ id: 'lp-este', label: 'Este' }],
  },
  {
    id: 'la-gomera',
    name: 'La Gomera',
    summary: 'Olas tranquilas en Valle Gran Rey y fondos de callao en el norte.',
    zones: [
      { id: 'lg-norte', label: 'Norte' },
      { id: 'lg-oeste', label: 'Valle Gran Rey' },
    ],
  },
];

export const ISLAND_IDS = ISLANDS.map((i) => i.id);

export function isIslandId(value: unknown): value is IslandId {
  return typeof value === 'string' && (ISLAND_IDS as string[]).includes(value);
}

export function getIsland(id: IslandId): Island {
  return ISLANDS.find((i) => i.id === id)!;
}

export const ALL_ZONES: Zone[] = ISLANDS.flatMap((i) => i.zones);

export function isZoneId(value: unknown): value is ZoneId {
  return typeof value === 'string' && ALL_ZONES.some((z) => z.id === value);
}

/** The island a zone belongs to. */
export function islandOfZone(zone: ZoneId): IslandId {
  return ISLANDS.find((i) => i.zones.some((z) => z.id === zone))!.id;
}
