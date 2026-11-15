'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { addDays } from '@/domain/models/LocalTime';
import { formatDayParts, formatHour } from '@/presentation/lib/format';
import { cn } from '@/presentation/lib/utils';

export interface TimeSelection {
  dateStr: string;
  hour: number;
  isLive: boolean;
}

interface TimeControlProps {
  /** Today in Gran Canaria; the strip is always anchored to it. */
  today: string;
  currentHour: number;
  value: TimeSelection;
  onChange: (value: TimeSelection) => void;
}

/** Matches the marine adapter: 7 past days, today and 6 forecast days. */
const PAST_DAYS = 7;
const FUTURE_DAYS = 6;

export function TimeControl({ today, currentHour, value, onChange }: TimeControlProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const days = Array.from({ length: PAST_DAYS + FUTURE_DAYS + 1 }, (_, i) => addDays(today, i - PAST_DAYS));

  const select = (dateStr: string, hour: number) => {
    onChange({ dateStr, hour, isLive: dateStr === today && hour === currentHour });
  };

  // Keep the selected day visible in the horizontal strip
  useEffect(() => {
    const el = stripRef.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
    el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [value.dateStr]);

  // Step through the day one hour at a time
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      const v = valueRef.current;
      onChange({ dateStr: v.dateStr, hour: (v.hour + 1) % 24, isLive: false });
    }, 1400);
    return () => clearInterval(id);
  }, [isPlaying, onChange]);

  // Shortcuts for the questions people actually ask
  const tomorrow = addDays(today, 1);
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay(); // 0 = Sunday
  const saturday = addDays(today, weekday === 6 ? 7 : (6 - weekday + 7) % 7);
  const presets: { label: string; dateStr: string; hour: number; live?: boolean }[] = [
    { label: 'Ahora', dateStr: today, hour: currentHour, live: true },
    { label: 'Mañana temprano', dateStr: tomorrow, hour: 8 },
    { label: 'Mañana por la tarde', dateStr: tomorrow, hour: 17 },
    ...(saturday !== tomorrow && saturday <= addDays(today, FUTURE_DAYS) ? [{ label: 'Este sábado', dateStr: saturday, hour: 9 }] : []),
  ];
  const isPresetActive = (p: (typeof presets)[number]) =>
    p.live ? value.isLive : !value.isLive && value.dateStr === p.dateStr && value.hour === p.hour;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Atajos">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => {
              setIsPlaying(false);
              onChange({ dateStr: p.dateStr, hour: p.hour, isLive: Boolean(p.live) });
            }}
            aria-pressed={isPresetActive(p)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition',
              isPresetActive(p) ? 'border-ocean bg-ocean text-sand' : 'border-line-strong text-ink-2 hover:border-ink hover:text-ink'
            )}
          >
            {p.live && <span className={cn('size-1.5 rounded-full', isPresetActive(p) ? 'bg-sun' : 'bg-q-good')} aria-hidden />}
            {p.label}
          </button>
        ))}
      </div>

      <div ref={stripRef} className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 scrollbar-none" role="group" aria-label="Día">
        {days.map((d) => {
          const { weekday, day } = formatDayParts(d);
          const selected = d === value.dateStr;
          const isToday = d === today;
          const isPast = d < today;
          return (
            <button
              key={d}
              aria-pressed={selected}
              onClick={() => {
                setIsPlaying(false);
                select(d, isToday ? currentHour : value.hour);
              }}
              className={cn(
                'flex w-14 shrink-0 flex-col items-center rounded-lg py-2 transition',
                selected ? 'bg-ocean text-sand' : isPast ? 'hover:bg-line/60' : 'bg-paper/60 hover:bg-sea',
                !selected && isPast && 'text-ink-3'
              )}
            >
              <span className={cn('text-[11px]', selected ? 'text-sun' : isToday ? 'text-accent font-medium' : 'text-ink-3')}>
                {isToday ? 'Hoy' : weekday}
              </span>
              <span className="mt-0.5 text-lg tabular-nums">{day}</span>
            </button>
          );
        })}
      </div>

      <p className="-mt-2 flex justify-between text-[11px] text-ink-3" aria-hidden>
        <span>← Lo que hubo (7 días)</span>
        <span>Previsión (6 días) →</span>
      </p>

      <div className="flex items-center gap-4">
        <span className="w-12 text-sm font-medium text-ink tabular-nums">{formatHour(value.hour)}</span>
        <input
          type="range"
          min={0}
          max={23}
          value={value.hour}
          onChange={(e) => {
            setIsPlaying(false);
            select(value.dateStr, Number(e.target.value));
          }}
          className="range flex-1"
          aria-label="Hora del día"
          aria-valuetext={formatHour(value.hour)}
        />
        <button
          onClick={() => setIsPlaying((p) => !p)}
          className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line-strong text-ink-2 transition hover:border-ink hover:text-ink"
          aria-label={isPlaying ? 'Pausar recorrido horario' : 'Recorrer el día hora a hora'}
          title={isPlaying ? 'Pausar' : 'Recorrer el día'}
        >
          {isPlaying ? <Pause className="size-3.5 fill-current" /> : <Play className="ml-0.5 size-3.5 fill-current" />}
        </button>
      </div>
    </div>
  );
}
