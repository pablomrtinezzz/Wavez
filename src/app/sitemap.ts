import type { MetadataRoute } from 'next';
import { ALL_SPOTS } from '@/infrastructure/spots';
import { SITE_URL } from '@/presentation/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: 'hourly', priority: 1 },
    ...ALL_SPOTS.map((s) => ({
      url: `${SITE_URL}/spots/${s.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
