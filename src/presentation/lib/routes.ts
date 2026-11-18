import { IslandId, isIslandId } from '@/domain/models/Island';
import { ALL_SPOTS } from '@/infrastructure/spots';
import { Locale } from './locale';

const SPOT_SLUGS = new Set(ALL_SPOTS.map((s) => s.slug));

/** Path of each page in each language. English pages live under /en. */
export const paths = {
  home: (locale: Locale = 'es') => (locale === 'en' ? '/en' : '/'),
  island: (island: IslandId, locale: Locale = 'es') => `${locale === 'en' ? '/en' : ''}/${island}`,
  spot: (slug: string, locale: Locale = 'es') => `${locale === 'en' ? '/en' : ''}/spots/${slug}`,
  /** Webcam pages are Spanish only. */
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
  let segments = pathname.split('/').filter(Boolean);
  if (segments[0] === 'en') {
    segments = segments.slice(1);
    if (segments.length === 0) return false;
    // English pages: islands and spots, no webcam pages
    if (segments.length === 1) return !isIslandId(segments[0]);
    if (segments.length === 2 && segments[0] === 'spots') return !SPOT_SLUGS.has(segments[1]);
    return false;
  }
  if (segments.length === 1) return segments[0] !== 'webcams' && !isIslandId(segments[0]);
  if (segments.length === 2 && segments[0] === 'spots') return !SPOT_SLUGS.has(segments[1]);
  if (segments.length === 2 && segments[1] === 'webcams') return !isIslandId(segments[0]);
  return false;
}

/**
 * hreflang links for a page published in both languages. Spanish is the
 * default: the live app behind every page is Spanish.
 */
export function languageAlternates(es: string, en: string) {
  return { es, en, 'x-default': es };
}
