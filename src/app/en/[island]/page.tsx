import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { ISLANDS, ISLAND_IDS, getIsland, isIslandId } from '@/domain/models/Island';
import { spotsOfIsland } from '@/infrastructure/spots';
import { webcamsOfIsland, webcamsOfSpot } from '@/infrastructure/webcams';
import { ISLAND_SUMMARY_EN, SPOT_DESCRIPTION_EN, ZONE_LABEL_EN } from '@/infrastructure/content/en';
import { StaticHeader } from '@/presentation/components/site/StaticHeader';
import { BREAK_LABEL_EN, EnglishFooter, IN_SPANISH, SKILL_LABEL_EN } from '@/presentation/components/site/EnglishChrome';
import { languageAlternates, paths } from '@/presentation/lib/routes';
import { SITE_NAME, SITE_URL } from '@/presentation/lib/site';
import { breadcrumbList, itemList, jsonLdScript } from '@/presentation/lib/jsonLd';

/** Unknown islands answer a real 404 (see src/proxy.ts); every valid one is prerendered. */
export const instant = false;

export function generateStaticParams() {
  return ISLAND_IDS.map((island) => ({ island }));
}

export async function generateMetadata({ params }: PageProps<'/en/[island]'>): Promise<Metadata> {
  const { island } = await params;
  if (!isIslandId(island)) return {};
  const info = getIsland(island);
  const spots = spotsOfIsland(island);
  const title = `${info.name} surf forecast: spots, waves and webcams`;
  const description = `Hour-by-hour surf forecast for ${spots.length} spots in ${info.name}: ${spots
    .slice(0, 4)
    .map((s) => s.name.split(' (')[0])
    .join(', ')}${spots.length > 4 ? '…' : ''}. ${ISLAND_SUMMARY_EN[island]}`;
  return {
    title,
    description,
    alternates: { canonical: paths.island(island, 'en'), languages: languageAlternates(paths.island(island), paths.island(island, 'en')) },
    openGraph: { title: `${title} · ${SITE_NAME}`, description, url: `${SITE_URL}${paths.island(island, 'en')}`, type: 'website', locale: 'en_GB' },
  };
}

export default async function EnglishIslandPage({ params }: PageProps<'/en/[island]'>) {
  const { island } = await params;
  if (!isIslandId(island)) notFound();
  const info = getIsland(island);
  const spots = spotsOfIsland(island);
  const cams = webcamsOfIsland(island);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbList(SITE_URL, [
        { name: 'Canary Islands', path: paths.home('en') },
        { name: info.name, path: paths.island(island, 'en') },
      ]),
      {
        '@type': 'Place',
        name: info.name,
        description: ISLAND_SUMMARY_EN[island],
        url: `${SITE_URL}${paths.island(island, 'en')}`,
        address: { '@type': 'PostalAddress', addressRegion: info.name, addressCountry: 'ES' },
        containedInPlace: { '@type': 'Place', name: 'Canary Islands' },
      },
      itemList(
        SITE_URL,
        `Surf spots in ${info.name}`,
        spots.map((s) => ({ name: s.name, path: paths.spot(s.slug, 'en') }))
      ),
    ],
  };

  return (
    <div lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <StaticHeader
        homeHref={paths.home('en')}
        homeLabel="Wavez, home"
        links={[
          { href: paths.home('en'), label: 'Canary Islands' },
          { href: paths.island(island), label: 'Español', hrefLang: 'es', lang: 'es' },
        ]}
      />

      <main className="mx-auto max-w-4xl px-5 pb-10 pt-12 sm:px-8 sm:pt-16">
        <p className="eyebrow !text-ocean">
          Surf forecast · {spots.length} spots · {cams.length} webcams
        </p>
        <h1 className="display mt-3 text-5xl sm:text-7xl">Surf in {info.name}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">{ISLAND_SUMMARY_EN[island]}</p>
        <p className="mt-4 max-w-2xl leading-relaxed text-ink-2">
          Wavez scores every spot from 0 to 10, hour by hour, from the swell, the period, the wind and the tide, and compares them with
          the conditions each spot needs. Below is a guide to the spots with today&rsquo;s forecast on each page.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={paths.island(island)}
            hrefLang="es"
            className="inline-flex items-center gap-2 rounded-full bg-ocean px-5 py-3 text-sm font-medium text-sand transition hover:bg-ocean-deep"
          >
            Live map and ranking {IN_SPANISH} <ArrowRight className="size-4" />
          </Link>
          {cams.length > 0 && (
            <Link
              href={paths.webcams(island)}
              hrefLang="es"
              className="inline-flex items-center gap-2 rounded-full border border-line-strong px-5 py-3 text-sm text-ink transition hover:border-ink"
            >
              {cams.length} webcams {IN_SPANISH}
            </Link>
          )}
        </div>

        <section className="mt-16" aria-labelledby="guide">
          <h2 id="guide" className="border-b border-line pb-3 text-xl font-medium">
            Surf spots in {info.name}
          </h2>
          <div className="mt-6 grid gap-x-10 gap-y-12 md:grid-cols-2">
            {info.zones.map((zone) => (
              <div key={zone.id}>
                <h3 className="border-b border-line pb-2 text-lg font-medium text-ink">{ZONE_LABEL_EN[zone.id]}</h3>
                <ul className="mt-3 divide-y divide-line">
                  {spots
                    .filter((s) => s.zone === zone.id)
                    .map((spot) => (
                      <li key={spot.id} className="py-3">
                        <Link href={paths.spot(spot.slug, 'en')} className="group block">
                          <span className="font-medium text-ink group-hover:underline group-hover:underline-offset-4">{spot.name}</span>
                          <span className="ml-2 text-xs text-ink-3">
                            {BREAK_LABEL_EN[spot.breakType]} · {SKILL_LABEL_EN[spot.skillLevel]}
                            {webcamsOfSpot(spot.id).length ? ' · webcam' : ''}
                          </span>
                          <span className="mt-1 block text-sm leading-relaxed text-ink-2">{SPOT_DESCRIPTION_EN[spot.id]}</span>
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16" aria-labelledby="islands">
          <h2 id="islands" className="border-b border-line pb-3 text-xl font-medium">
            Other islands
          </h2>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {ISLANDS.filter((i) => i.id !== island).map((i) => (
              <li key={i.id}>
                <Link href={paths.island(i.id, 'en')} className="text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink">
                  Surf in {i.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <EnglishFooter />
    </div>
  );
}
