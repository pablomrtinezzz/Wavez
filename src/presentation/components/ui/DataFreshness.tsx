'use client';

import React, { useEffect, useState } from 'react';
import { formatRelativeTime } from '@/presentation/lib/format';
import { cn } from '@/presentation/lib/utils';

/** Data older than this is flagged (the scheduled refresh runs every ~15 min, but may be delayed). */
const STALE_AFTER_MS = 3 * 60 * 60 * 1000;

/**
 * "Datos actualizados hace 15 min (14:30)": when the marine data was
 * downloaded by the scheduled job, re-rendered every minute.
 */
export function DataFreshness({
  updatedAt,
  className,
  compact = false,
}: {
  updatedAt?: string | null;
  className?: string;
  /** Short form for tight spaces ("hace 20 min"); the full text stays in the tooltip. */
  compact?: boolean;
}) {
  // The clock is read in the browser only (never during prerendering)
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const first = requestAnimationFrame(() => setNow(Date.now()));
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      cancelAnimationFrame(first);
      clearInterval(id);
    };
  }, []);

  if (!updatedAt || now === null) return null;
  const clock = new Date(updatedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Atlantic/Canary' });
  const isStale = now - Date.parse(updatedAt) > STALE_AFTER_MS;

  return (
    <span
      className={cn('tabular-nums', isStale && 'text-warn', className)}
      title={`Datos de Open-Meteo descargados a las ${clock}`}
    >
      {compact ? formatRelativeTime(updatedAt, now) : `Datos actualizados ${formatRelativeTime(updatedAt, now)} (${clock})`}
    </span>
  );
}
