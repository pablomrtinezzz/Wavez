'use client';

import { useCallback, useEffect, useState } from 'react';
import { SpotSummaryDTO } from '@/application/dtos/SpotSummaryDTO';
import { IslandId } from '@/domain/models/Island';
import { canaryNow, LocalMoment } from '@/domain/models/LocalTime';
import { TimeSelection } from './TimeControl';

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

/**
 * Conditions for every spot of one island (or the whole archipelago) at the
 * selected hour, kept fresh while the page is open.
 */
export function useForecast(island?: IslandId) {
  // The clock is read on the client only: prerendering must not freeze "now"
  const [now, setNow] = useState<LocalMoment | null>(null);
  const [selection, setSelection] = useState<TimeSelection | null>(null);
  const [summaries, setSummaries] = useState<SpotSummaryDTO[]>([]);
  const [unavailable, setUnavailable] = useState<SpotsResponse['unavailable']>([]);
  const [dataUpdatedAt, setDataUpdatedAt] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const init = requestAnimationFrame(() => {
      const current = canaryNow();
      setNow(current);
      setSelection({ ...current, isLive: true });
    });
    return () => cancelAnimationFrame(init);
  }, []);

  const goLive = useCallback(() => {
    const current = canaryNow();
    setNow(current);
    setSelection({ ...current, isLive: true });
    setReloadToken((t) => t + 1);
  }, []);

  const reload = useCallback(() => setReloadToken((t) => t + 1), []);

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
    const params = new URLSearchParams();
    if (island) params.set('island', island);
    if (!selection.isLive) {
      params.set('date', selection.dateStr);
      params.set('hour', String(selection.hour));
    }
    const query = params.toString();
    const url = `/api/spots${query ? `?${query}` : ''}`;

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
  }, [selection, reloadToken, island]);

  const modeLabel = !selection || !now
    ? ''
    : selection.isLive
      ? 'En directo'
      : selection.dateStr < now.dateStr || (selection.dateStr === now.dateStr && selection.hour < now.hour)
        ? 'Histórico'
        : 'Previsión';

  return {
    now,
    selection,
    setSelection,
    summaries,
    unavailable,
    dataUpdatedAt,
    isRefreshing,
    error,
    goLive,
    reload,
    modeLabel,
  };
}

/**
 * The spot report open in the drawer, mirrored in the URL (?spot=<id>) so it
 * can be shared and closed with Back. Only ids from the catalogue are
 * accepted: the value ends up in request paths.
 */
export function useSpotParam(knownIds: ReadonlySet<string>) {
  const [spotId, setSpotId] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      const id = new URLSearchParams(window.location.search).get('spot');
      setSpotId(id && knownIds.has(id) ? id : null);
    };
    const init = requestAnimationFrame(sync);
    window.addEventListener('popstate', sync);
    return () => {
      cancelAnimationFrame(init);
      window.removeEventListener('popstate', sync);
    };
  }, [knownIds]);

  const open = useCallback(
    (id: string) => {
      if (!knownIds.has(id)) return;
      const url = new URL(window.location.href);
      url.searchParams.set('spot', id);
      window.history.pushState(null, '', url);
      setSpotId(id);
    },
    [knownIds]
  );

  const close = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete('spot');
    window.history.pushState(null, '', url);
    setSpotId(null);
  }, []);

  return { spotId, open, close };
}
