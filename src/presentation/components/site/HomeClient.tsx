'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { SpotSummaryDTO } from '@/application/dtos/SpotSummaryDTO';
import { Spot } from '@/domain/models/Spot';
import { canaryNow, LocalMoment } from '@/domain/models/LocalTime';
import { SiteFooter, SiteHeader } from '@/presentation/components/site/SiteChrome';
import { TimeControl, TimeSelection } from '@/presentation/components/site/TimeControl';
import { Hero } from '@/presentation/components/site/Hero';
import { SpotList } from '@/presentation/components/site/SpotList';
import { IslandMap } from '@/presentation/components/site/IslandMap';
import { WebcamGallery } from '@/presentation/components/site/WebcamGallery';
import { SpotDrawer } from '@/presentation/components/spot/SpotDrawer';
import { ReportDialog } from '@/presentation/components/spot/ReportDialog';
import { capitalize, formatHour, formatLongDate } from '@/presentation/lib/format';

/** Live data is re-fetched this often while the tab stays open. */
const LIVE_REFRESH_MS = 10 * 60 * 1000;

interface SpotsResponse {
  success: boolean;
  data: SpotSummaryDTO[];
  unavailable: { id: string; name: string }[];
  updatedAt: string;
  dataUpdatedAt: string | null;
  error?: string;
}

function readSpotFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get('spot');
}

/**
 * Interactive home. `guide` is static, server-rendered content (the spot guide)
 * so the page is meaningful to search engines and link previews before any
 * client data loads.
 */
export function HomeClient({ guide }: { guide?: React.ReactNode }) {
  // The clock is read on the client only: prerendering must not freeze "now"
  const [now, setNow] = useState<LocalMoment | null>(null);
  const [selection, setSelection] = useState<TimeSelection | null>(null);
  const [summaries, setSummaries] = useState<SpotSummaryDTO[]>([]);
  const [unavailable, setUnavailable] = useState<SpotsResponse['unavailable']>([]);
  const [dataUpdatedAt, setDataUpdatedAt] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [reportingSpot, setReportingSpot] = useState<Spot | null>(null);
  const [reportsVersion, setReportsVersion] = useState(0);

  // Read the clock and the deep link (?spot=<id>) once mounted; Back closes the report
  useEffect(() => {
    const sync = () => setSelectedSpotId(readSpotFromUrl());
    const init = requestAnimationFrame(() => {
      const current = canaryNow();
      setNow(current);
      setSelection({ ...current, isLive: true });
      sync();
    });
    window.addEventListener('popstate', sync);
    return () => {
      cancelAnimationFrame(init);
      window.removeEventListener('popstate', sync);
    };
  }, []);

  const openSpot = useCallback((spotId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('spot', spotId);
    window.history.pushState(null, '', url);
    setSelectedSpotId(spotId);
  }, []);

  const closeSpot = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete('spot');
    window.history.pushState(null, '', url);
    setSelectedSpotId(null);
  }, []);

  const goLive = useCallback(() => {
    const current = canaryNow();
    setNow(current);
    setSelection({ ...current, isLive: true });
    setReloadToken((t) => t + 1);
  }, []);

  // Keep "now" and live data fresh while the page is open
  useEffect(() => {
    const id = setInterval(() => {
      setNow(canaryNow());
      setSelection((s) => (s?.isLive ? { ...canaryNow(), isLive: true } : s));
      setReloadToken((t) => t + 1);
    }, LIVE_REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!selection) return;
    const controller = new AbortController();
    const url = selection.isLive ? '/api/spots' : `/api/spots?date=${selection.dateStr}&hour=${selection.hour}`;

    // Debounce scrubbing so dragging the slider does not fire a request per hour
    const timer = setTimeout(async () => {
      setIsRefreshing(true);
      try {
        const res = await fetch(url, { signal: controller.signal });
        const json = (await res.json()) as SpotsResponse;
        if (!json.success) throw new Error(json.error || 'No se pudieron cargar los spots');
        setSummaries(json.data);
        setUnavailable(json.unavailable ?? []);
        setDataUpdatedAt(json.dataUpdatedAt);
        setError(null);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setError('No se pudieron cargar las condiciones. Revisa tu conexión.');
      } finally {
        if (!controller.signal.aborted) setIsRefreshing(false);
      }
    }, selection.isLive ? 0 : 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [selection, reloadToken]);

  const modeLabel = !selection || !now
    ? ''
    : selection.isLive
    ? 'En directo'
    : selection.dateStr < now.dateStr || (selection.dateStr === now.dateStr && selection.hour < now.hour)
    ? 'Histórico'
    : 'Previsión';
  const webcamCount = summaries.filter((s) => s.spot.webcam?.iframeUrl).length;

  return (
    <>
      <SiteHeader dataUpdatedAt={dataUpdatedAt} isRefreshing={isRefreshing} isLive={selection?.isLive ?? true} onRefresh={goLive} />

      <main className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="pt-8 text-xs uppercase tracking-[0.14em] text-ocean sm:pt-14">
          <h1 className="inline">Parte de olas de Gran Canaria</h1>
          <span className="text-ink-3"> · 20 spots · oleaje, viento, marea y webcams</span>
        </div>

        {now && selection ? (
        <section className="pt-6" aria-label="Día y hora">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg text-ink">
              ¿Cuándo quieres surfear?{' '}
              <span className="text-ink-3">
                {capitalize(formatLongDate(selection.dateStr))} · {formatHour(selection.hour)}
              </span>
            </h2>
            <p className="inline-flex items-center gap-2 text-xs text-ink-3">
              {selection.isLive && <span className="size-1.5 rounded-full bg-accent animate-pulse-soft" aria-hidden />}
              {modeLabel}
            </p>
          </div>
          <TimeControl today={now.dateStr} currentHour={now.hour} value={selection} onChange={setSelection} />
        </section>

        ) : (
          <div className="pt-6" aria-busy="true">
            <div className="h-7 w-80 max-w-full rounded bg-line/70 animate-pulse-soft" />
            <div className="mt-6 h-36 rounded-2xl bg-line/50 animate-pulse-soft" />
          </div>
        )}

        {error && (
          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-warn-soft px-4 py-3 text-sm text-warn" role="alert">
            {error}
            <button onClick={() => setReloadToken((t) => t + 1)} className="font-medium underline underline-offset-4">
              Reintentar
            </button>
          </div>
        )}

        <div className="mt-12 sm:mt-24">
          {summaries.length && now && selection ? (
            <Hero summaries={summaries} selection={selection} today={now.dateStr} currentHour={now.hour} onSelectSpot={openSpot} />
          ) : (
            !error && <HeroSkeleton />
          )}
        </div>

        {unavailable.length > 0 && (
          <p className="mt-10 text-sm text-ink-3">
            Sin datos de Open-Meteo ahora mismo para {unavailable.map((u) => u.name).join(', ')}.
          </p>
        )}

        {summaries.length > 0 && (
          <>
            <PageSection id="spots" index="01" title="Todos los spots" intro="Ordenados por la nota del momento elegido. Toca un spot para ver su informe completo.">
              <SpotList summaries={summaries} onSelectSpot={openSpot} isRefreshing={isRefreshing} />
            </PageSection>

            <PageSection id="mapa" index="02" title="La isla" intro="Cada costa recibe el mar de una forma distinta. Así está cada rincón ahora.">
              <IslandMap summaries={summaries} onSelectSpot={openSpot} />
            </PageSection>

            {webcamCount > 0 && (
              <PageSection id="webcams" index="03" title="Webcams" intro={`${webcamCount} cámaras en directo. Ábrelas para comprobar el mar antes de salir.`}>
                <WebcamGallery summaries={summaries} onSelectSpot={openSpot} />
              </PageSection>
            )}
          </>
        )}

        {guide}
      </main>

      <SiteFooter />

      {now && selection && (
      <SpotDrawer
        spotId={selectedSpotId}
        initialDate={selection.dateStr}
        today={now.dateStr}
        currentHour={now.hour}
        onClose={closeSpot}
        onReport={setReportingSpot}
        refreshKey={reportsVersion}
      />
      )}
      <ReportDialog
        spot={reportingSpot}
        onClose={() => setReportingSpot(null)}
        onSubmitted={() => {
          setReportsVersion((v) => v + 1);
          setReloadToken((t) => t + 1);
        }}
      />
    </>
  );
}

function PageSection({
  id,
  index,
  title,
  intro,
  children,
}: {
  id: string;
  index: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="reveal mt-20 sm:mt-36" aria-labelledby={`${id}-title`}>
      <div className="mb-8 grid gap-3 sm:mb-10 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-end">
        <div>
          <p className="eyebrow inline-flex items-center gap-2 tabular-nums !text-ocean">
            <svg viewBox="0 0 28 8" className="h-2 w-7 text-sun" aria-hidden>
              <path d="M1 4c3 0 3-3 6.5-3S11 7 14 7s3.5-6 6.5-6S24 4 27 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            {index}
          </p>
          <h2 id={`${id}-title`} className="display mt-2 text-[2.75rem] leading-none sm:text-6xl">
            {title}
          </h2>
        </div>
        <p className="max-w-md text-ink-2 sm:justify-self-end">{intro}</p>
      </div>
      {children}
    </section>
  );
}

function HeroSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando condiciones">
      <div className="h-5 w-64 rounded bg-line/70 animate-pulse-soft" />
      <div className="mt-4 h-20 w-full max-w-xl rounded bg-line/70 animate-pulse-soft" />
      <div className="mt-6 h-5 w-full max-w-2xl rounded bg-line/50 animate-pulse-soft" />
      <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-14 rounded bg-line/50 animate-pulse-soft" />
        ))}
      </div>
    </div>
  );
}
