'use client';

import React, { useMemo, useState } from 'react';
import { Spot } from '@/domain/models/Spot';
import { ISLANDS, ISLAND_IDS } from '@/domain/models/Island';
import { CANARY_NAV, SiteFooter, SiteHeader } from '@/presentation/components/site/SiteChrome';
import { Hero } from '@/presentation/components/site/Hero';
import { SpotList } from '@/presentation/components/site/SpotList';
import { IslandMap } from '@/presentation/components/site/IslandMap';
import { SpotDrawer } from '@/presentation/components/spot/SpotDrawer';
import { ReportDialog } from '@/presentation/components/spot/ReportDialog';
import { IslandCards } from './IslandCards';
import { HeroSkeleton, PageSection } from './sections';
import { ErrorBanner, WhenSection } from './WhenSection';
import { useForecast, useSpotParam } from './useForecast';

const ISLAND_GROUPS = ISLANDS.map((i) => ({ id: i.id, label: i.name }));

/**
 * The whole archipelago: the best wave in the Canaries, how each island is
 * doing, the map of every spot and a ranking across islands.
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
        <div className="pt-8 text-xs uppercase tracking-[0.14em] text-ocean sm:pt-14">
          <h1 className="inline">Parte de olas de Canarias</h1>
          <span className="text-ink-3">
            {' '}
            · {spotIds.length} spots en {ISLANDS.length} islas · oleaje, viento, marea y webcams
          </span>
        </div>

        <WhenSection now={now} selection={selection} modeLabel={forecast.modeLabel} onChange={forecast.setSelection} />

        {error && <ErrorBanner message={error} onRetry={forecast.reload} />}

        <div className="mt-12 sm:mt-24">
          {summaries.length && now && selection ? (
            <Hero
              summaries={summaries}
              selection={selection}
              today={now.dateStr}
              currentHour={now.hour}
              onSelectSpot={drawer.open}
              scope="canarias"
            />
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
            <PageSection id="islas" index="01" title="Las islas" intro="Cada isla tiene su temporada y su costa buena. Entra en una para ver todos sus spots, el mapa y las webcams.">
              <IslandCards summaries={summaries} />
            </PageSection>

            <PageSection id="mapa" index="02" title="El archipiélago" intro="Todos los spots en un mapa. Elige una isla para acercarte o toca un punto para ver su informe.">
              <IslandMap
                summaries={summaries}
                onSelectSpot={drawer.open}
                islands={ISLAND_IDS}
                groups={ISLAND_GROUPS}
                groupBy="island"
                allLabel="Todas las islas"
                ariaLabel="Mapa de spots de Canarias. Usa los botones de isla o de zoom para acercarte."
              />
            </PageSection>

            <PageSection id="ranking" index="03" title="Ranking" intro="Todos los spots de Canarias ordenados por la nota del momento elegido.">
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
