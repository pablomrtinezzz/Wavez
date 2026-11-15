import type { MetadataRoute } from 'next';
import { GRAN_CANARIA_SPOTS } from '@/infrastructure/repositories/StaticSpotRepository';
import { SITE_URL } from '@/presentation/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: 'hourly', priority: 1 },
    ...GRAN_CANARIA_SPOTS.map((s) => ({
      url: `${SITE_URL}/spots/${s.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
