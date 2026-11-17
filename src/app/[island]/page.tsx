import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ISLAND_IDS, getIsland, isIslandId } from '@/domain/models/Island';
import { spotsOfIsland } from '@/infrastructure/spots';
import { webcamsOfIsland } from '@/infrastructure/webcams';
import { IslandHome } from '@/presentation/components/site/IslandHome';
import { SpotGuide } from '@/presentation/components/site/SpotGuide';
import { SITE_NAME, SITE_URL } from '@/presentation/lib/site';
import { jsonLdScript } from '@/presentation/lib/jsonLd';

/**
 * Unknown values must answer a real 404, which needs the island checked before
 * anything streams: the route blocks on it (every valid value is prerendered).
 */
export const instant = false;

export function generateStaticParams() {
  return ISLAND_IDS.map((island) => ({ island }));
}

export async function generateMetadata({ params }: { params: Promise<{ island: string }> }): Promise<Metadata> {
  const { island } = await params;
  if (!isIslandId(island)) return {};
  const info = getIsland(island);
  const spots = spotsOfIsland(island);
  const title = `Surf en ${info.name}: previsión de olas, viento y marea`;
  const description = `Parte de olas de ${info.name} hora a hora para ${spots.length} spots: ${spots
    .slice(0, 4)
    .map((s) => s.name.split(' (')[0])
    .join(', ')}${spots.length > 4 ? '…' : ''}. ${info.summary}`;
  return {
    title,
    description,
    alternates: { canonical: `/${island}` },
    openGraph: { title: `${title} · ${SITE_NAME}`, description, url: `${SITE_URL}/${island}`, type: 'website' },
  };
}

export default async function IslandPage({ params }: { params: Promise<{ island: string }> }) {
  const { island } = await params;
  // Only the known islands exist: anything else is a 404, never a lookup
  if (!isIslandId(island)) notFound();
  const info = getIsland(island);
  const spots = spotsOfIsland(island);
  // Sections are numbered in order: coasts (if several), spots, map, webcams (if any), guide
  const guideIndex = 2 + (info.zones.length > 1 ? 1 : 0) + (webcamsOfIsland(island).length > 0 ? 1 : 0) + 1;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: info.name,
    description: info.summary,
    address: { '@type': 'PostalAddress', addressRegion: info.name, addressCountry: 'ES' },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <IslandHome
        key={island}
        island={island}
        spotIds={spots.map((s) => s.id)}
        guide={<SpotGuide island={island} index={String(guideIndex).padStart(2, '0')} />}
      />
    </>
  );
}
