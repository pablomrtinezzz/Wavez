'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { SpotSummaryDTO } from '@/application/dtos/SpotSummaryDTO';
import { Spot } from '@/domain/models/Spot';
import { canaryNow, LocalMoment } from '@/domain/models/LocalTime';
import { AccessGate } from '@/presentation/components/site/AccessGate';
import { SiteFooter, SiteHeader } from '@/presentation/components/site/SiteChrome';
import { TimeControl, TimeSelection } from '@/presentation/components/site/TimeControl';
import { Hero } from '@/presentation/components/site/Hero';
import { SpotList } from '@/presentation/components/site/SpotList';
import { IslandMap } from '@/presentation/components/site/IslandMap';
import { WebcamGallery } from '@/presentation/components/site/WebcamGallery';
import { SpotDrawer } from '@/presentation/components/spot/SpotDrawer';
import { ReportDialog } from '@/presentation/components/spot/ReportDialog';
import { Spinner } from '@/presentation/components/ui/primitives';
import { UNAUTHORIZED_EVENT } from '@/presentation/lib/api';
import { capitalize, formatHour, formatLongDate } from '@/presentation/lib/format';

/** Live data is re-fetched this often while the tab stays open. */
const LIVE_REFRESH_MS = 10 * 60 * 1000;

interface SpotsResponse {
  success: boolean;
  data: SpotSummaryDTO[];
  unavailable: { id: string; name: string }[];
  updatedAt: string;
  error?: string;
}

function readSpotFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get('spot');
}

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  // The clock is read on the client only: prerendering must not freeze "now"
  const [now, setNow] = useState<LocalMoment | null>(null);
  const [selection, setSelection] = useState<TimeSelection | null>(null);
  const [summaries, setSummaries] = useState<SpotSummaryDTO[]>([]);
  const [unavailable, setUnavailable] = useState<SpotsResponse['unavailable']>([]);
  const [updatedAt, setUpdatedAt] = useState<string>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [reportingSpot, setReportingSpot] = useState<Spot | null>(null);
  const [reportsVersion, setReportsVersion] = useState(0);

  // Session check, and back to the gate whenever the API says the session expired
  useEffect(() => {
    fetch('/api/auth/verify')
      .then((res) => res.json())
      .then((data) => setIsAuthenticated(Boolean(data.authenticated)))
      .catch(() => setIsAuthenticated(false))
      .finally(() => {
        const current = canaryNow();
        setNow(current);
        setSelection({ ...current, isLive: true });
      });
    const onUnauthorized = () => setIsAuthenticated(false);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  // Deep links: ?spot=<id> opens the report and the back button closes it
  useEffect(() => {
    const sync = () => setSelectedSpotId(readSpotFromUrl());
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
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
    if (!isAuthenticated || !selection) return;
    const controller = new AbortController();
    const url = selection.isLive ? '/api/spots' : `/api/spots?date=${selection.dateStr}&hour=${selection.hour}`;

    // Debounce scrubbing so dragging the slider does not fire a request per hour
    const timer = setTimeout(async () => {
      setIsRefreshing(true);
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (res.status === 401) {
          setIsAuthenticated(false);
          return;
        }
        const json = (await res.json()) as SpotsResponse;
        if (!json.success) throw new Error(json.error || 'No se pudieron cargar los spots');
        setSummaries(json.data);
        setUnavailable(json.unavailable ?? []);
        setUpdatedAt(json.updatedAt);
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
  }, [isAuthenticated, selection, reloadToken]);

  const logout = async () => {
    await fetch('/api/auth/verify', { method: 'DELETE' }).catch(() => null);
    setIsAuthenticated(false);
    setSummaries([]);
  };

  if (isAuthenticated === null || !now || !selection) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AccessGate onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  const modeLabel = selection.isLive
    ? 'En directo'
    : selection.dateStr < now.dateStr || (selection.dateStr === now.dateStr && selection.hour < now.hour)
    ? 'Histórico'
    : 'Previsión';
  const webcamCount = summaries.filter((s) => s.spot.webcam?.iframeUrl).length;

  return (
    <>
      <SiteHeader updatedAt={updatedAt} isRefreshing={isRefreshing} onRefresh={goLive} onLogout={logout} />

      <main className="mx-auto max-w-6xl px-5 sm:px-8">
        <section className="pt-10 sm:pt-14" aria-label="Día y hora">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm text-ink-2">
              {capitalize(formatLongDate(selection.dateStr))} · {formatHour(selection.hour)}
            </p>
            <p className="inline-flex items-center gap-2 text-xs text-ink-3">
              {selection.isLive && <span className="size-1.5 rounded-full bg-accent animate-pulse-soft" aria-hidden />}
              {modeLabel}
            </p>
          </div>
          <TimeControl today={now.dateStr} currentHour={now.hour} value={selection} onChange={setSelection} />
        </section>

        {error && (
          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-warn-soft px-4 py-3 text-sm text-warn" role="alert">
            {error}
            <button onClick={() => setReloadToken((t) => t + 1)} className="font-medium underline underline-offset-4">
              Reintentar
            </button>
          </div>
        )}

        <div className="mt-16 sm:mt-24">
          {summaries.length ? (
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
      </main>

      <SiteFooter />

      <SpotDrawer
        spotId={selectedSpotId}
        initialDate={selection.dateStr}
        today={now.dateStr}
        currentHour={now.hour}
        onClose={closeSpot}
        onReport={setReportingSpot}
        refreshKey={reportsVersion}
      />
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
    <section id={id} className="mt-28 sm:mt-36" aria-labelledby={`${id}-title`}>
      <div className="mb-10 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-end">
        <div>
          <p className="eyebrow tabular-nums">{index}</p>
          <h2 id={`${id}-title`} className="display mt-2 text-5xl sm:text-6xl">
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
