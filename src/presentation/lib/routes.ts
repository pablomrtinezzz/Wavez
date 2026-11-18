import { IslandId, isIslandId } from '@/domain/models/Island';
import { ALL_SPOTS } from '@/infrastructure/spots';

const SPOT_SLUGS = new Set(ALL_SPOTS.map((s) => s.slug));

/** Path of each page. */
export const paths = {
  home: () => '/',
  island: (island: IslandId) => `/${island}`,
  spot: (slug: string) => `/spots/${slug}`,
  webcams: (island?: IslandId) => (island ? `/${island}/webcams` : '/webcams'),
};

/**
 * Whether a page path names an island or spot that does not exist, e.g.
 * /mallorca or /spots/pipeline. Those must answer a real 404: the pages are
 * partially prerendered, so their static shell would otherwise go out with a
 * 200 before the page itself decides the value is unknown. Paths that match
 * no route at all are left to Next.js, which already answers 404.
 */
export function isUnknownPagePath(pathname: string): boolean {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 1) return segments[0] !== 'webcams' && !isIslandId(segments[0]);
  if (segments.length === 2 && segments[0] === 'spots') return !SPOT_SLUGS.has(segments[1]);
  if (segments.length === 2 && segments[1] === 'webcams') return !isIslandId(segments[0]);
  return false;
}
