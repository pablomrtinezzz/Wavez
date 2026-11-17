/**
 * Builds the simplified island outlines used by the maps from OpenStreetMap
 * coastlines (© OpenStreetMap contributors, ODbL). Run by hand when an island
 * is added; the output is committed:
 *
 *   npx tsx scripts/build-coasts.ts
 *
 * Gran Canaria keeps its hand-cleaned outline (harbour docks removed).
 */
import { writeFileSync } from 'node:fs';

type Pt = [number, number]; // [lat, lng]

/** south, west, north, east */
const ISLANDS: Record<string, [number, number, number, number]> = {
  tenerife: [27.98, -16.95, 28.62, -16.1],
  lanzarote: [28.83, -13.9, 29.3, -13.4],
  fuerteventura: [28.03, -14.53, 28.78, -13.8],
  'la-palma': [28.44, -18.02, 28.87, -17.71],
  'la-gomera': [28.0, -17.36, 28.22, -17.08],
};

const OVERPASS_ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];

/** Douglas-Peucker tolerance in degrees (about 120 m). */
const TOLERANCE = 0.0012;
/** Islets smaller than this (deg², about 0.6 km²) are dropped. */
const MIN_AREA = 0.00005;

const key = ([lat, lng]: Pt) => `${lat.toFixed(7)},${lng.toFixed(7)}`;

async function fetchCoastWays([s, w, n, e]: [number, number, number, number]): Promise<Pt[][]> {
  const query = `[out:json][timeout:120];way["natural"="coastline"](${s},${w},${n},${e});out geom;`;
  let json: { elements: { geometry?: { lat: number; lon: number }[] }[] } | null = null;
  // Public Overpass servers are often busy: try the mirrors a few times
  for (let attempt = 0; attempt < 6 && !json; attempt++) {
    const endpoint = OVERPASS_ENDPOINTS[attempt % OVERPASS_ENDPOINTS.length];
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'wavez-coast-builder' },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(120_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      json = await res.json();
    } catch (error) {
      console.warn(`${endpoint}: ${(error as Error).message}, retrying`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
  if (!json) throw new Error('Overpass unavailable');
  return json.elements.filter((el) => el.geometry?.length).map((el) => el.geometry!.map((g) => [g.lat, g.lon] as Pt));
}

/** Joins coastline ways end to start into closed rings. */
function stitch(ways: Pt[][]): Pt[][] {
  const byStart = new Map<string, Pt[]>();
  for (const w of ways) byStart.set(key(w[0]), w);
  const used = new Set<Pt[]>();
  const rings: Pt[][] = [];
  for (const way of ways) {
    if (used.has(way)) continue;
    used.add(way);
    const ring = [...way];
    while (key(ring[0]) !== key(ring[ring.length - 1])) {
      const next = byStart.get(key(ring[ring.length - 1]));
      if (!next || used.has(next)) break; // open coastline at the box edge: keep what we have
      used.add(next);
      ring.push(...next.slice(1));
    }
    rings.push(ring);
  }
  return rings;
}

function area(ring: Pt[]): number {
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const [y1, x1] = ring[i];
    const [y2, x2] = ring[(i + 1) % ring.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a / 2);
}

function simplify(points: Pt[], tolerance: number): Pt[] {
  if (points.length < 3) return points;
  const [a, b] = [points[0], points[points.length - 1]];
  let maxDist = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = distanceToSegment(points[i], a, b);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }
  if (maxDist <= tolerance) return [a, b];
  return [...simplify(points.slice(0, index + 1), tolerance).slice(0, -1), ...simplify(points.slice(index), tolerance)];
}

function distanceToSegment([py, px]: Pt, [ay, ax]: Pt, [by, bx]: Pt): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len)) : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

async function main() {
  const out: Record<string, Pt[][]> = {};
  for (const [id, bbox] of Object.entries(ISLANDS)) {
    const rings = stitch(await fetchCoastWays(bbox))
      .filter((r) => area(r) >= MIN_AREA)
      .sort((a, b) => area(b) - area(a))
      .map((r) => simplify(r, TOLERANCE).map(([lat, lng]) => [+lat.toFixed(4), +lng.toFixed(4)] as Pt));
    out[id] = rings;
    console.log(`${id}: ${rings.length} rings, ${rings.reduce((n, r) => n + r.length, 0)} points`);
    await new Promise((r) => setTimeout(r, 2000)); // be gentle with the public Overpass server
  }

  const body = Object.entries(out)
    .map(([id, rings]) => `  '${id}': [\n${rings.map((r) => `    ${JSON.stringify(r)},`).join('\n')}\n  ],`)
    .join('\n');
  writeFileSync(
    'src/presentation/components/site/canaryCoasts.ts',
    `/**
 * Island outlines as rings of [lat, lng], simplified from OpenStreetMap
 * coastlines (© OpenStreetMap contributors, ODbL). Generated by
 * scripts/build-coasts.ts: do not edit by hand. Used only to draw the maps.
 */
export const GENERATED_COASTS: Record<string, [number, number][][]> = {
${body}
};
`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
