import type { MetadataRoute } from 'next';
import { ALL_SPOTS } from '@/infrastructure/spots';
import { ISLAND_IDS } from '@/domain/models/Island';
import { paths } from '@/presentation/lib/routes';
import { SITE_URL } from '@/presentation/lib/site';

type Entry = MetadataRoute.Sitemap[number];

/** A page published in Spanish and English: both URLs, each pointing at the other. */
function bilingual(es: string, en: string, entry: Omit<Entry, 'url'>): Entry[] {
  const languages = { es: `${SITE_URL}${es === '/' ? '' : es}`, en: `${SITE_URL}${en}` };
  return [
    { ...entry, url: languages.es, alternates: { languages } },
    { ...entry, url: languages.en, priority: (entry.priority ?? 0.5) - 0.1, alternates: { languages } },
  ];
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...bilingual(paths.home(), paths.home('en'), { changeFrequency: 'hourly', priority: 1 }),
    ...ISLAND_IDS.flatMap((island) => bilingual(paths.island(island), paths.island(island, 'en'), { changeFrequency: 'hourly', priority: 0.9 })),
    { url: `${SITE_URL}${paths.webcams()}`, changeFrequency: 'weekly', priority: 0.8 },
    ...ISLAND_IDS.map((island) => ({ url: `${SITE_URL}${paths.webcams(island)}`, changeFrequency: 'weekly' as const, priority: 0.7 })),
    // Spot pages carry a forecast refreshed every hour
    ...ALL_SPOTS.flatMap((s) => bilingual(paths.spot(s.slug), paths.spot(s.slug, 'en'), { changeFrequency: 'hourly', priority: 0.8 })),
  ];
}
