'use client';

import React, { useMemo, useState } from 'react';
import { Spot } from '@/domain/models/Spot';
import { ISLANDS } from '@/domain/models/Island';
import { WEBCAMS } from '@/infrastructure/webcams';
import { CANARY_NAV, SiteFooter, SiteHeader } from '@/presentation/components/site/SiteChrome';
import { Hero } from '@/presentation/components/site/Hero';
import { SpotList } from '@/presentation/components/site/SpotList';
import { SpotDrawer } from '@/presentation/components/spot/SpotDrawer';
import { ReportDialog } from '@/presentation/components/spot/ReportDialog';
import { IslandCards } from './IslandCards';
import { ArchipelagoPicker } from './ArchipelagoPicker';
import { LevelPicks } from './LevelPicks';
import { CanaryWebcams } from './CanaryWebcams';
import { HeroSkeleton, PageSection } from './sections';
import { ErrorBanner, WhenSection } from './WhenSection';
import { useForecast, useSpotParam } from './useForecast';

const ISLAND_GROUPS = ISLANDS.map((i) => ({ id: i.id, label: i.name }));

/**
 * The whole archipelago: pick an island on the map, the best wave in the
 * Canaries, where to go for each level, every webcam and a ranking.
 */
export function CanaryHome({ spotIds, guide }: { spotIds: string[]; guide?: React.ReactNode }) {
  const forecast = useForecast();
  const { now, selection, summaries, error } = forecast;
  const known = useMemo(() => new Set(spotIds), [spotIds]);
  const drawer = useSpotParam(known);
  const [reportingSpot, setReportingSpot] = useState<Spot | null>(null);
  const [reportsVersion, setReportsVersion] = useState(0);

  return (
    <>
      <SiteHeader
        island={null}
        nav={CANARY_NAV}
        dataUpdatedAt={forecast.dataUpdatedAt}
        isRefreshing={forecast.isRefreshing}
        isLive={selection?.isLive ?? true}
        onRefresh={forecast.goLive}
      />

      <main className="mx-auto max-w-6xl px-5 sm:px-8">
        <section className="pt-8 sm:pt-14" aria-labelledby="canarias-title">
          <p className="text-xs uppercase tracking-[0.14em] text-ocean">
            Parte de olas de Canarias <span className="text-ink-3">· {spotIds.length} spots · {ISLANDS.length} islas · {WEBCAMS.length} webcams</span>
          </p>
          <h1 id="canarias-title" className="display mt-3 max-w-3xl text-[clamp(2.75rem,8vw,5.5rem)] leading-[0.98] text-ink">
            ¿Dónde hay olas hoy en Canarias?
          </h1>
          <p className="mt-4 max-w-xl text-ink-2">
            Cada isla toma el color de su mejor ola en este momento. Toca una para ver sus spots, sus costas y sus webcams.
          </p>
          <ArchipelagoPicker summaries={summaries} className="mt-6 sm:mt-2" />
        </section>

        <div className="mt-8 sm:mt-10">
          <WhenSection now={now} selection={selection} modeLabel={forecast.modeLabel} onChange={forecast.setSelection} />
        </div>

        {error && <ErrorBanner message={error} onRetry={forecast.reload} />}

        <div className="mt-12 sm:mt-20">
          {summaries.length && now && selection ? (
            <Hero summaries={summaries} selection={selection} today={now.dateStr} currentHour={now.hour} onSelectSpot={drawer.open} scope="canarias" />
          ) : (
            !error && <HeroSkeleton />
          )}
        </div>

        {forecast.unavailable.length > 0 && (
          <p className="mt-10 text-sm text-ink-3">
            Sin datos de Open-Meteo ahora mismo para {forecast.unavailable.map((u) => u.name).join(', ')}.
          </p>
        )}

        {summaries.length > 0 && (
          <>
            <PageSection id="para-ti" index="01" title="Hoy para ti" intro="El mejor sitio según tu nivel, entre los spots pensados para él. Nada de mandar a quien empieza a un reef.">
              <LevelPicks summaries={summaries} onSelectSpot={drawer.open} showIsland />
            </PageSection>

            <PageSection id="webcams" index="02" title="Mira el mar" intro="Todas las webcams de las islas en un sitio. Comprueba el mar antes de coger el coche.">
              <CanaryWebcams summaries={summaries} onSelectSpot={drawer.open} />
            </PageSection>

            <PageSection id="islas" index="03" title="Las islas" intro="Cada isla tiene su temporada y su costa buena. Entra en una para ver todos sus spots, el mapa y las webcams.">
              <IslandCards summaries={summaries} />
            </PageSection>

            <PageSection id="ranking" index="04" title="Ranking" intro="Todos los spots de Canarias ordenados por la nota del momento elegido.">
              <SpotList
                summaries={summaries}
                onSelectSpot={drawer.open}
                isRefreshing={forecast.isRefreshing}
                groups={ISLAND_GROUPS}
                groupBy="island"
                allLabel="Toda Canarias"
              />
            </PageSection>
          </>
        )}

        {guide}
      </main>

      <SiteFooter />

      {now && selection && (
        <SpotDrawer
          spotId={drawer.spotId}
          initialDate={selection.dateStr}
          today={now.dateStr}
          currentHour={now.hour}
          onClose={drawer.close}
          onReport={setReportingSpot}
          refreshKey={reportsVersion}
        />
      )}
      <ReportDialog
        spot={reportingSpot}
        onClose={() => setReportingSpot(null)}
        onSubmitted={() => {
          setReportsVersion((v) => v + 1);
          forecast.reload();
        }}
      />
    </>
  );
}
