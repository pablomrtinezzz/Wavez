import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { ALL_SPOTS } from '@/infrastructure/spots';
import { webcamsOfSpot } from '@/infrastructure/webcams';
import { SPOT_DESCRIPTION_EN, ZONE_LABEL_EN } from '@/infrastructure/content/en';
import { StaticClimatologyRepository } from '@/infrastructure/repositories/StaticClimatologyRepository';
import { StaticHeader } from '@/presentation/components/site/StaticHeader';
import { BREAK_LABEL_EN, EnglishFooter, IN_SPANISH, MONTHS_EN, SKILL_LABEL_EN, TIDE_LABEL_EN } from '@/presentation/components/site/EnglishChrome';
import { SpotOutlookSection } from '@/presentation/components/spot/SpotOutlook';
import { ISLAND_NAME, degreesToCompassRange } from '@/presentation/lib/format';
import { languageAlternates, paths } from '@/presentation/lib/routes';
import { SITE_NAME, SITE_URL, pageOpenGraph } from '@/presentation/lib/site';
import { breadcrumbList, jsonLdScript } from '@/presentation/lib/jsonLd';

const climatology = new StaticClimatologyRepository();

/** Unknown slugs answer a real 404 (see src/proxy.ts); every valid one is prerendered. */
export const instant = false;

export function generateStaticParams() {
  return ALL_SPOTS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<'/en/spots/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const spot = ALL_SPOTS.find((s) => s.slug === slug);
  if (!spot) return {};
  const shortName = spot.name.split(' (')[0];
  const island = ISLAND_NAME[spot.island];
  const title = `${shortName} surf forecast (${island}): waves today`;
  const description = `Surf forecast for ${shortName} (${spot.location.municipality}, ${island}) for today and the next days: waves, period, wind and tide${webcamsOfSpot(spot.id).length ? ', live webcam' : ''}. ${SPOT_DESCRIPTION_EN[spot.id]}`;
  return {
    title,
    description,
    alternates: { canonical: paths.spot(slug, 'en'), languages: languageAlternates(paths.spot(slug), paths.spot(slug, 'en')) },
    openGraph: pageOpenGraph({ title: `${title} · ${SITE_NAME}`, description, url: `${SITE_URL}${paths.spot(slug, 'en')}`, type: 'article', locale: 'en_GB' }),
  };
}

export default async function EnglishSpotPage({ params }: PageProps<'/en/spots/[slug]'>) {
  const { slug } = await params;
  const spot = ALL_SPOTS.find((s) => s.slug === slug);
  if (!spot) notFound();
  const climate = await climatology.getClimatologyBySpotId(spot.id);
  const ideal = spot.idealConditions;
  const shortName = spot.name.split(' (')[0];
  const island = ISLAND_NAME[spot.island];
  const cams = webcamsOfSpot(spot.id);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbList(SITE_URL, [
        { name: 'Canary Islands', path: paths.home('en') },
        { name: island, path: paths.island(spot.island, 'en') },
        { name: shortName, path: paths.spot(spot.slug, 'en') },
      ]),
      {
        '@type': ['Place', 'TouristAttraction'],
        name: spot.name,
        description: SPOT_DESCRIPTION_EN[spot.id],
        url: `${SITE_URL}${paths.spot(spot.slug, 'en')}`,
        touristType: `Surfing · ${SKILL_LABEL_EN[spot.skillLevel]}`,
        isAccessibleForFree: true,
        publicAccess: true,
        geo: { '@type': 'GeoCoordinates', latitude: spot.location.lat, longitude: spot.location.lng },
        address: { '@type': 'PostalAddress', addressLocality: spot.location.municipality, addressRegion: island, addressCountry: 'ES' },
        containedInPlace: { '@type': 'Place', name: island, url: `${SITE_URL}${paths.island(spot.island, 'en')}` },
      },
    ],
  };

  return (
    <div lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <StaticHeader
        homeHref={paths.home('en')}
        homeLabel="Wavez, home"
        links={[
          { href: paths.island(spot.island, 'en'), label: `${island} spots` },
          { href: paths.spot(spot.slug), label: 'ES', hrefLang: 'es', lang: 'es' },
        ]}
      />

      <main className="mx-auto max-w-4xl px-5 pb-10 pt-12 sm:px-8 sm:pt-16">
        <p className="eyebrow !text-ocean">
          {[...new Set([ZONE_LABEL_EN[spot.zone], spot.location.municipality, island])].join(' · ')}
        </p>
        <h1 className="display mt-3 text-5xl sm:text-7xl">Surfing {spot.name}</h1>
        <p className="mt-4 text-ink-3">
          {BREAK_LABEL_EN[spot.breakType]} · {SKILL_LABEL_EN[spot.skillLevel]}
          {cams.length ? ' · Webcam' : ''}
        </p>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">{SPOT_DESCRIPTION_EN[spot.id]}</p>

        <Link
          href={`${paths.island(spot.island)}?spot=${spot.id}`}
          hrefLang="es"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-ocean px-5 py-3 text-sm font-medium text-sand transition hover:bg-ocean-deep"
        >
          Live conditions and hourly charts {IN_SPANISH} <ArrowRight className="size-4" />
        </Link>

        <Suspense fallback={<div className="mt-16 h-64 rounded-lg bg-line/40 animate-pulse-soft" aria-hidden />}>
          <SpotOutlookSection spotId={spot.id} name={shortName} locale="en" />
        </Suspense>

        <section className="mt-16" aria-labelledby="ideal">
          <h2 id="ideal" className="border-b border-line pb-3 text-xl font-medium">
            When {shortName} works
          </h2>
          <dl className="mt-6 grid gap-x-10 gap-y-5 text-sm sm:grid-cols-2">
            <Spec label="Swell size it holds" value={`${ideal.minSwellHeightM} – ${ideal.maxSwellHeightM} m`} />
            <Spec label="Minimum period" value={`${ideal.minPeriodSec} s`} />
            <Spec label="Swell direction" value={degreesToCompassRange(ideal.optimalSwellDegrees)} />
            <Spec label="Offshore wind" value={`${degreesToCompassRange(ideal.favorableWindDegrees)} · up to ${ideal.maxFavorableWindKmh} km/h`} />
            <Spec label="Best tide" value={TIDE_LABEL_EN[ideal.preferredTide]} />
          </dl>
        </section>

        {climate && (
          <section className="mt-16" aria-labelledby="season">
            <h2 id="season" className="border-b border-line pb-3 text-xl font-medium">
              Best time of year
            </h2>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm tabular-nums">
                <caption className="mb-2 text-left text-xs text-ink-3">Surfable days and average wave height per month (approximate climatology)</caption>
                <thead className="text-xs text-ink-3">
                  <tr>
                    <th className="py-1 font-normal">Month</th>
                    {climate.monthlyConsistency.map((m) => (
                      <th key={m.month} className="font-normal">
                        {MONTHS_EN[m.month - 1]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-ink-2">
                  <tr className="border-t border-line">
                    <td className="py-1.5 text-ink-3">% days</td>
                    {climate.monthlyConsistency.map((m) => (
                      <td key={m.month}>{m.consistencyPct}</td>
                    ))}
                  </tr>
                  <tr className="border-t border-line">
                    <td className="py-1.5 text-ink-3">Wave (m)</td>
                    {climate.monthlyConsistency.map((m) => (
                      <td key={m.month}>{m.averageWaveHeightM.toFixed(1)}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {cams.length > 0 && (
          <section className="mt-16" aria-labelledby="webcams">
            <h2 id="webcams" className="border-b border-line pb-3 text-xl font-medium">
              Webcams
            </h2>
            <ul className="mt-4 space-y-1 text-sm text-ink-2">
              {cams.map((w) => (
                <li key={w.id}>
                  {w.name} <span className="text-ink-3">· {w.source.provider}</span>
                </li>
              ))}
            </ul>
            <Link href={paths.webcams(spot.island)} hrefLang="es" className="mt-4 inline-block text-sm text-ocean underline decoration-sun underline-offset-4 hover:text-ink">
              Watch the {island} webcams {IN_SPANISH}
            </Link>
          </section>
        )}
      </main>
      <EnglishFooter />
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-ink-3">{label}</dt>
      <dd className="mt-0.5 text-ink">{value}</dd>
    </div>
  );
}
