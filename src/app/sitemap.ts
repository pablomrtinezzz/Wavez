import type { MetadataRoute } from 'next';
import { ALL_SPOTS } from '@/infrastructure/spots';
import { ISLAND_IDS } from '@/domain/models/Island';
import { SITE_URL } from '@/presentation/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: 'hourly', priority: 1 },
    ...ISLAND_IDS.map((island) => ({ url: `${SITE_URL}/${island}`, changeFrequency: 'hourly' as const, priority: 0.9 })),
    { url: `${SITE_URL}/webcams`, changeFrequency: 'weekly', priority: 0.8 },
    ...ISLAND_IDS.map((island) => ({ url: `${SITE_URL}/${island}/webcams`, changeFrequency: 'weekly' as const, priority: 0.7 })),
    ...ALL_SPOTS.map((s) => ({
      url: `${SITE_URL}/spots/${s.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
