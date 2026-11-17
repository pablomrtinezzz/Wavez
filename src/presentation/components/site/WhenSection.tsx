'use client';

import React from 'react';
import { LocalMoment } from '@/domain/models/LocalTime';
import { capitalize, formatHour, formatLongDate } from '@/presentation/lib/format';
import { TimeControl, TimeSelection } from './TimeControl';

/** "¿Cuándo quieres surfear?": the day and hour every forecast on the page refers to. */
export function WhenSection({
  now,
  selection,
  modeLabel,
  onChange,
}: {
  now: LocalMoment | null;
  selection: TimeSelection | null;
  modeLabel: string;
  onChange: (value: TimeSelection) => void;
}) {
  if (!now || !selection) {
    return (
      <div className="pt-6" aria-busy="true">
        <div className="h-7 w-80 max-w-full rounded bg-line/70 animate-pulse-soft" />
        <div className="mt-6 h-36 rounded-2xl bg-line/50 animate-pulse-soft" />
      </div>
    );
  }
  return (
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
      <TimeControl today={now.dateStr} currentHour={now.hour} value={selection} onChange={onChange} />
    </section>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-warn-soft px-4 py-3 text-sm text-warn" role="alert">
      {message}
      <button onClick={onRetry} className="font-medium underline underline-offset-4">
        Reintentar
      </button>
    </div>
  );
}
