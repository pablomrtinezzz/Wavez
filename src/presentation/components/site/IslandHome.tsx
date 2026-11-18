'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Spot } from '@/domain/models/Spot';
import { IslandId, getIsland } from '@/domain/models/Island';
import { webcamsOfIsland } from '@/infrastructure/webcams';
import { ISLAND_NAV, SiteFooter, SiteHeader } from '@/presentation/components/site/SiteChrome';
import { Hero } from '@/presentation/components/site/Hero';
import { SpotList } from '@/presentation/components/site/SpotList';
import { IslandMap } from '@/presentation/components/site/IslandMap';
import { WebcamGallery } from '@/presentation/components/site/WebcamGallery';
import { SpotDrawer } from '@/presentation/components/spot/SpotDrawer';
import { ReportDialog } from '@/presentation/components/spot/ReportDialog';
import { HeroSkeleton, PageSection } from './sections';
import { ErrorBanner, WhenSection } from './WhenSection';
import { IslandIntro } from './IslandIntro';
import { CoastCards } from './CoastCards';
import { useForecast, useSpotParam } from './useForecast';

/**
 * One island: where it sits in the archipelago, the best wave now, which
 * coast is working, every spot ranked, the map and its webcams. `guide` is
 * static, server-rendered content (the island's spot guide) for search
 * engines.
 */
export function IslandHome({ island, spotIds, guide }: { island: IslandId; spotIds: string[]; guide?: React.ReactNode }) {
  const info = getIsland(island);
  // Every island is loaded: the archipelago picker shows how the others are doing
  const forecast = useForecast();
  const { now, selection, error } = forecast;
  const all = forecast.summaries;
  const summaries = useMemo(() => all.filter((s) => s.spot.island === island), [all, island]);
  const known = useMemo(() => new Set(spotIds), [spotIds]);
  const drawer = useSpotParam(known);
  const [reportingSpot, setReportingSpot] = useState<Spot | null>(null);
  const [reportsVersion, setReportsVersion] = useState(0);

  const webcams = webcamsOfIsland(island);
  const zones = info.zones;
  const hasZones = zones.length > 1;
  const nav = ISLAND_NAV.filter((n) => (n.id !== 'webcams' || webcams.length > 0) && (n.id !== 'costas' || hasZones));
  let n = 0;
  const index = () => String(++n).padStart(2, '0');

  return (
    <>
      <SiteHeader
        island={island}
        nav={nav}
        dataUpdatedAt={forecast.dataUpdatedAt}
        isRefreshing={forecast.isRefreshing}
        isLive={selection?.isLive ?? true}
        onRefresh={forecast.goLive}
      />

      <main className="mx-auto max-w-6xl px-5 sm:px-8">
        <IslandIntro island={island} summaries={all} spotCount={spotIds.length} webcamCount={webcams.length} />

        <div className="mt-12">
          <WhenSection now={now} selection={selection} modeLabel={forecast.modeLabel} onChange={forecast.setSelection} />
        </div>

        {error && <ErrorBanner message={error} onRetry={forecast.reload} />}

        <div className="mt-12 sm:mt-20">
          {summaries.length && now && selection ? (
            <Hero summaries={summaries} selection={selection} today={now.dateStr} currentHour={now.hour} onSelectSpot={drawer.open} />
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
            {hasZones && (
              <PageSection id="costas" index={index()} title="Por costas" intro="Cada costa recibe el mar y el viento de una forma distinta. Así está cada una en el momento elegido.">
                <CoastCards island={island} summaries={summaries} onSelectSpot={drawer.open} />
              </PageSection>
            )}

            <PageSection id="spots" index={index()} title="Todos los spots" intro="Ordenados por la nota del momento elegido. Toca un spot para ver su informe completo.">
              <SpotList
                summaries={summaries}
                onSelectSpot={drawer.open}
                isRefreshing={forecast.isRefreshing}
                groups={zones}
                groupBy="zone"
                allLabel="Toda la isla"
              />
            </PageSection>

            <PageSection id="mapa" index={index()} title="La isla" intro="Cada punto es un spot con el color de su nota. Elige una costa o acércate con el zoom.">
              <IslandMap
                summaries={summaries}
                onSelectSpot={drawer.open}
                islands={[island]}
                groups={zones}
                groupBy="zone"
                allLabel="Toda la isla"
                ariaLabel={`Mapa de spots de ${info.name}. Usa los botones de zona o de zoom para acercarte.`}
              />
            </PageSection>

            {webcams.length > 0 && (
              <PageSection
                id="webcams"
                index={index()}
                title="Webcams"
                intro={`${webcams.length} ${webcams.length === 1 ? 'cámara' : 'cámaras'} para mirar el mar antes de salir. Las de In2theBeach se ven aquí; las demás se abren en la web de su autor.`}
              >
                <WebcamGallery webcams={webcams} summaries={summaries} onSelectSpot={drawer.open} />
                <p className="mt-8 text-sm">
                  <Link href={`/${island}/webcams`} className="text-ocean underline decoration-sun underline-offset-4 hover:text-ink">
                    Página de webcams de {info.name}
                  </Link>
                </p>
              </PageSection>
            )}
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
