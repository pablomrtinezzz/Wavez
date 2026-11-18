import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { ALL_SPOTS } from '@/infrastructure/spots';
import { webcamsOfSpot } from '@/infrastructure/webcams';
import { StaticClimatologyRepository } from '@/infrastructure/repositories/StaticClimatologyRepository';
import { TIDE_PHASE_LABEL } from '@/domain/models/Tide';
import { SiteFooter } from '@/presentation/components/site/SiteChrome';
import { StaticHeader } from '@/presentation/components/site/StaticHeader';
import {
  BREAK_LABEL,
  SKILL_LABEL,
  ISLAND_NAME,
  ZONE_LABEL,
  capitalize,
  degreesToCompassRange,
} from '@/presentation/lib/format';
import { SITE_NAME, SITE_URL } from '@/presentation/lib/site';
import { jsonLdScript } from '@/presentation/lib/jsonLd';
import { SpotOutlookSection } from '@/presentation/components/spot/SpotOutlook';

const climatology = new StaticClimatologyRepository();

const CROWD_LABEL = { low: 'Poca gente', medium: 'Gente moderada', high: 'Mucha gente', extreme: 'Masificado' } as const;

/**
 * Unknown values must answer a real 404, which needs the slug checked before
 * anything streams: the route blocks on it (every valid value is prerendered).
 */
export const instant = false;

export function generateStaticParams() {
  return ALL_SPOTS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const spot = ALL_SPOTS.find((s) => s.slug === slug);
  if (!spot) return {};
  const shortName = spot.name.split(' (')[0];
  const hasCam = webcamsOfSpot(spot.id).length > 0;
  const title = `Surf ${shortName} (${ISLAND_NAME[spot.island]}): previsión de olas hoy`;
  const description = `Previsión de surf en ${shortName} (${spot.location.municipality}, ${ISLAND_NAME[spot.island]}) para hoy y los próximos días: olas, periodo, viento y marea hora a hora${hasCam ? ', webcam en directo' : ''} y mejor época. ${spot.description}`;
  return {
    title,
    description,
    alternates: { canonical: `/spots/${spot.slug}` },
    openGraph: { title: `${title} · ${SITE_NAME}`, description, url: `${SITE_URL}/spots/${spot.slug}`, type: 'article' },
  };
}

export default async function SpotPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const spot = ALL_SPOTS.find((s) => s.slug === slug);
  if (!spot) notFound();
  const climate = await climatology.getClimatologyBySpotId(spot.id);
  const ideal = spot.idealConditions;
  const shortName = spot.name.split(' (')[0];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: spot.name,
    description: spot.description,
    geo: { '@type': 'GeoCoordinates', latitude: spot.location.lat, longitude: spot.location.lng },
    address: { '@type': 'PostalAddress', addressLocality: spot.location.municipality, addressRegion: ISLAND_NAME[spot.island], addressCountry: 'ES' },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <StaticHeader
        links={[
          ...(webcamsOfSpot(spot.id).length ? [{ href: `/${spot.island}/webcams`, label: 'Webcams' }] : []),
          { href: `/${spot.island}#guia`, label: `Spots de ${ISLAND_NAME[spot.island]}` },
        ]}
      />

      <main className="mx-auto max-w-4xl px-5 pb-10 pt-12 sm:px-8 sm:pt-16">
        <p className="eyebrow !text-ocean">
          {[...new Set([ZONE_LABEL[spot.zone], spot.location.municipality, ISLAND_NAME[spot.island]])].join(' · ')}
        </p>
        <h1 className="display mt-3 text-5xl sm:text-7xl">Surf en {spot.name}</h1>
        <p className="mt-4 text-ink-3">
          {BREAK_LABEL[spot.breakType]} · {SKILL_LABEL[spot.skillLevel]}
          {webcamsOfSpot(spot.id).length ? ' · Webcam' : ''}
        </p>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">{spot.description}</p>

        <Link
          href={`/${spot.island}?spot=${spot.id}`}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-ocean px-5 py-3 text-sm font-medium text-sand transition hover:bg-ocean-deep"
        >
          Ver condiciones ahora, previsión hora a hora{webcamsOfSpot(spot.id).length ? ' y webcam' : ''} <ArrowRight className="size-4" />
        </Link>

        <Suspense fallback={<div className="mt-16 h-64 rounded-lg bg-line/40 animate-pulse-soft" aria-hidden />}>
          <SpotOutlookSection spotId={spot.id} name={shortName} locale="es" />
        </Suspense>

        <section className="mt-16" aria-labelledby="ideal">
          <h2 id="ideal" className="border-b border-line pb-3 text-xl font-medium">
            Cuándo funciona {shortName}
          </h2>
          <dl className="mt-6 grid gap-x-10 gap-y-5 text-sm sm:grid-cols-2">
            <Spec label="Tamaño que aguanta" value={`${ideal.minSwellHeightM} – ${ideal.maxSwellHeightM} m`} />
            <Spec label="Periodo mínimo" value={`${ideal.minPeriodSec} s`} />
            <Spec label="Dirección de swell" value={degreesToCompassRange(ideal.optimalSwellDegrees)} />
            <Spec label="Viento terral" value={`${degreesToCompassRange(ideal.favorableWindDegrees)} · hasta ${ideal.maxFavorableWindKmh} km/h`} />
            <Spec label="Marea preferida" value={ideal.preferredTide === 'all' ? 'Cualquiera' : capitalize(TIDE_PHASE_LABEL[ideal.preferredTide])} />
            {climate && <Spec label="Ambiente" value={`${CROWD_LABEL[climate.crowdFactor]} en días buenos`} />}
          </dl>
        </section>

        {climate && (
          <section className="mt-16" aria-labelledby="season">
            <h2 id="season" className="border-b border-line pb-3 text-xl font-medium">
              Mejor época: {climate.bestSeasonLabel}
            </h2>
            <p className="mt-6 max-w-2xl leading-relaxed text-ink-2">{climate.seasonSummary}</p>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm tabular-nums">
                <caption className="mb-2 text-left text-xs text-ink-3">Días surfeables y oleaje medio por mes (climatología orientativa)</caption>
                <thead className="text-xs text-ink-3">
                  <tr>
                    <th className="py-1 font-normal">Mes</th>
                    {climate.monthlyConsistency.map((m) => (
                      <th key={m.month} className="font-normal">
                        {m.monthName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-ink-2">
                  <tr className="border-t border-line">
                    <td className="py-1.5 text-ink-3">% días</td>
                    {climate.monthlyConsistency.map((m) => (
                      <td key={m.month}>{m.consistencyPct}</td>
                    ))}
                  </tr>
                  <tr className="border-t border-line">
                    <td className="py-1.5 text-ink-3">Ola (m)</td>
                    {climate.monthlyConsistency.map((m) => (
                      <td key={m.month}>{m.averageWaveHeightM.toFixed(1)}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <dl className="mt-8 grid gap-x-10 gap-y-5 text-sm sm:grid-cols-2">
              <Spec label="Swell ideal" value={climate.optimalSwellWindow} />
              <Spec label="Viento favorable" value={climate.optimalWindRegime} />
              <Spec label="Marea" value={climate.tideDescription} />
            </dl>
            <p className="mt-8 border-l-2 border-sun pl-4 text-sm leading-relaxed text-ink-2">{climate.historicalNotes}</p>
            {climate.riskFactors.length > 0 && (
              <div className="mt-6 rounded-lg bg-warn-soft px-4 py-3 text-sm">
                <p className="font-medium text-warn">Precauciones</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-ink-2">
                  {climate.riskFactors.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </main>
      <SiteFooter />
    </>
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
