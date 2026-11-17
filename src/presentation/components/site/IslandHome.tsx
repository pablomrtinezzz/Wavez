'use client';

import React, { useMemo, useState } from 'react';
import { Spot } from '@/domain/models/Spot';
import { IslandId, getIsland } from '@/domain/models/Island';
import { ISLAND_NAV, SiteFooter, SiteHeader } from '@/presentation/components/site/SiteChrome';
import { Hero } from '@/presentation/components/site/Hero';
import { SpotList } from '@/presentation/components/site/SpotList';
import { IslandMap } from '@/presentation/components/site/IslandMap';
import { WebcamGallery } from '@/presentation/components/site/WebcamGallery';
import { SpotDrawer } from '@/presentation/components/spot/SpotDrawer';
import { ReportDialog } from '@/presentation/components/spot/ReportDialog';
import { HeroSkeleton, PageSection } from './sections';
import { ErrorBanner, WhenSection } from './WhenSection';
import { useForecast, useSpotParam } from './useForecast';

/**
 * One island: best wave now, every spot ranked, the island map and its
 * webcams. `guide` is static, server-rendered content (the island's spot
 * guide) so the page is meaningful to search engines before data loads.
 */
export function IslandHome({ island, spotIds, guide }: { island: IslandId; spotIds: string[]; guide?: React.ReactNode }) {
  const info = getIsland(island);
  const forecast = useForecast(island);
  const { now, selection, summaries, error } = forecast;
  const known = useMemo(() => new Set(spotIds), [spotIds]);
  const drawer = useSpotParam(known);
  const [reportingSpot, setReportingSpot] = useState<Spot | null>(null);
  const [reportsVersion, setReportsVersion] = useState(0);

  const webcamCount = summaries.filter((s) => s.spot.webcam?.iframeUrl).length;
  const zones = info.zones;

  return (
    <>
      <SiteHeader
        island={island}
        nav={webcamCount > 0 ? ISLAND_NAV : ISLAND_NAV.filter((n) => n.id !== 'webcams')}
        dataUpdatedAt={forecast.dataUpdatedAt}
        isRefreshing={forecast.isRefreshing}
        isLive={selection?.isLive ?? true}
        onRefresh={forecast.goLive}
      />

      <main className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="pt-8 text-xs uppercase tracking-[0.14em] text-ocean sm:pt-14">
          <h1 className="inline">Parte de olas de {info.name}</h1>
          <span className="text-ink-3">
            {' '}
            · {spotIds.length} spots · oleaje, viento, marea{webcamCount > 0 ? ' y webcams' : ''}
          </span>
        </div>

        <WhenSection now={now} selection={selection} modeLabel={forecast.modeLabel} onChange={forecast.setSelection} />

        {error && <ErrorBanner message={error} onRetry={forecast.reload} />}

        <div className="mt-12 sm:mt-24">
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
            <PageSection id="spots" index="01" title="Todos los spots" intro="Ordenados por la nota del momento elegido. Toca un spot para ver su informe completo.">
              <SpotList
                summaries={summaries}
                onSelectSpot={drawer.open}
                isRefreshing={forecast.isRefreshing}
                groups={zones}
                groupBy="zone"
                allLabel="Toda la isla"
              />
            </PageSection>

            <PageSection id="mapa" index="02" title="La isla" intro="Cada costa recibe el mar de una forma distinta. Así está cada rincón ahora.">
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

            {webcamCount > 0 && (
              <PageSection id="webcams" index="03" title="Webcams" intro={`${webcamCount} ${webcamCount === 1 ? 'cámara' : 'cámaras'} en directo. Ábrelas para comprobar el mar antes de salir.`}>
                <WebcamGallery summaries={summaries} onSelectSpot={drawer.open} />
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
