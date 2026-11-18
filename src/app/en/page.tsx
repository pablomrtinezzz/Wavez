import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ISLANDS } from '@/domain/models/Island';
import { ALL_SPOTS, spotsOfIsland } from '@/infrastructure/spots';
import { WEBCAMS, webcamsOfIsland } from '@/infrastructure/webcams';
import { ISLAND_SUMMARY_EN } from '@/infrastructure/content/en';
import { StaticHeader } from '@/presentation/components/site/StaticHeader';
import { EnglishFooter, IN_SPANISH, SKILL_LABEL_EN } from '@/presentation/components/site/EnglishChrome';
import { languageAlternates, paths } from '@/presentation/lib/routes';
import { SITE_NAME, SITE_URL } from '@/presentation/lib/site';
import { itemList, jsonLdScript } from '@/presentation/lib/jsonLd';

const title = 'Canary Islands surf forecast and live webcams';
const description = `Free surf forecast for ${ALL_SPOTS.length} spots across the seven Canary Islands: Gran Canaria, Tenerife, Lanzarote, Fuerteventura, La Palma, La Gomera and El Hierro. Waves, wind, tide and live webcams, hour by hour, with a 0 to 10 score for every spot.`;

export const metadata: Metadata = {
  title: { absolute: `${title} · ${SITE_NAME}` },
  description,
  alternates: { canonical: paths.home('en'), languages: languageAlternates(paths.home(), paths.home('en')) },
  openGraph: { title: `${title} · ${SITE_NAME}`, description, url: `${SITE_URL}${paths.home('en')}`, type: 'website', locale: 'en_GB' },
  twitter: { card: 'summary_large_image', title: `${title} · ${SITE_NAME}`, description },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: ['es', 'en'],
    },
    itemList(
      SITE_URL,
      'Surf forecast by island',
      ISLANDS.map((i) => ({ name: `Surf in ${i.name}`, path: paths.island(i.id, 'en') }))
    ),
  ],
};

export default function EnglishHomePage() {
  return (
    <div lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <StaticHeader homeHref={paths.home('en')} homeLabel="Wavez, home" links={[{ href: '/', label: 'Español', hrefLang: 'es', lang: 'es' }]} />

      <main className="mx-auto max-w-4xl px-5 pb-10 pt-12 sm:px-8 sm:pt-16">
        <p className="eyebrow !text-ocean">
          {ALL_SPOTS.length} spots · {ISLANDS.length} islands · {WEBCAMS.length} webcams
        </p>
        <h1 className="display mt-3 text-5xl sm:text-7xl">Canary Islands surf forecast</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
          Where are the waves today in the Canaries? Wavez is a free, independent surf forecast for every named wave in the seven
          islands, from the reefs of the Fuerteventura North Shore to Las Canteras in Gran Canaria.
        </p>
        <p className="mt-4 max-w-2xl leading-relaxed text-ink-2">
          Every spot gets a score from 0 to 10, hour by hour, from the swell, the period, the wind and the tide, compared with the
          conditions that spot needs: an offshore breeze and the right swell direction matter as much as the size. The data comes
          from Open-Meteo&rsquo;s ocean and weather models and is checked every 15 minutes.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            hrefLang="es"
            className="inline-flex items-center gap-2 rounded-full bg-ocean px-5 py-3 text-sm font-medium text-sand transition hover:bg-ocean-deep"
          >
            Live map and ranking {IN_SPANISH} <ArrowRight className="size-4" />
          </Link>
          <Link
            href={paths.webcams()}
            hrefLang="es"
            className="inline-flex items-center gap-2 rounded-full border border-line-strong px-5 py-3 text-sm text-ink transition hover:border-ink"
          >
            All {WEBCAMS.length} webcams {IN_SPANISH}
          </Link>
        </div>

        <section className="mt-16" aria-labelledby="islands">
          <h2 id="islands" className="border-b border-line pb-3 text-xl font-medium">
            The islands
          </h2>
          <div className="mt-6 grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {ISLANDS.map((island) => {
              const spots = spotsOfIsland(island.id);
              return (
                <div key={island.id}>
                  <h3 className="flex items-baseline justify-between border-b border-line pb-2">
                    <Link href={paths.island(island.id, 'en')} className="text-lg font-medium text-ink hover:underline hover:underline-offset-4">
                      Surf in {island.name}
                    </Link>
                    <span className="text-xs text-ink-3 tabular-nums">
                      {spots.length} spots · {webcamsOfIsland(island.id).length} webcams
                    </span>
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">{ISLAND_SUMMARY_EN[island.id]}</p>
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {spots.map((spot) => (
                      <li key={spot.id}>
                        <Link href={paths.spot(spot.slug, 'en')} className="text-ink-2 hover:text-ink hover:underline hover:underline-offset-4">
                          {spot.name}
                        </Link>
                        <span className="ml-1.5 text-xs text-ink-3">{SKILL_LABEL_EN[spot.skillLevel]}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      </main>
      <EnglishFooter />
    </div>
  );
}
