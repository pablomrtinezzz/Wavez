'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ConditionQuality } from '@/domain/models/SpotScore';
import { QUALITY } from '@/presentation/lib/format';
import { cn } from '@/presentation/lib/utils';

export function QualityDot({ quality, className }: { quality: ConditionQuality; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('inline-block size-2 shrink-0 rounded-full', className)}
      style={{ background: QUALITY[quality].color }}
    />
  );
}

/** Quality is never conveyed by colour alone: the dot always travels with its label. */
export function QualityLabel({ quality, className }: { quality: ConditionQuality; className?: string }) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-ink', className)}
      style={{ background: QUALITY[quality].tint }}
    >
      <QualityDot quality={quality} />
      {QUALITY[quality].label}
    </span>
  );
}

/** The 0-10 score on a tile coloured by its quality band. */
export function ScoreBadge({
  score,
  quality,
  size = 'md',
  className,
}: {
  score: number;
  quality: ConditionQuality;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = {
    sm: 'h-8 w-10 rounded-md text-sm',
    md: 'h-11 w-14 rounded-lg text-lg',
    lg: 'h-20 w-24 rounded-2xl text-4xl',
  };
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center font-medium tabular-nums tracking-tight', sizes[size], className)}
      style={{ background: QUALITY[quality].color, color: QUALITY[quality].onColor }}
      aria-label={`Nota ${(Math.min(100, Math.max(0, score)) / 10).toFixed(1)} sobre 10, ${QUALITY[quality].label}`}
    >
      {(Math.min(100, Math.max(0, score)) / 10).toFixed(1)}
    </span>
  );
}

/**
 * Meteorological directions say where swell/wind come FROM; the arrow points
 * where it travels to, which is how surfers read it on a chart.
 */
export function DirectionArrow({
  degrees,
  className,
  title,
}: {
  degrees: number;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn('size-3.5 shrink-0', className)}
      style={{ transform: `rotate(${degrees + 180}deg)` }}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path
        d="M8 2v11M4 9l4 4 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="rotate(180 8 8)"
      />
    </svg>
  );
}

export function Figure({
  label,
  value,
  detail,
  className,
}: {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1.5 text-xl font-medium tracking-tight text-ink tabular-nums sm:text-2xl">{value}</dd>
      {detail && <dd className="mt-0.5 flex items-center gap-1 text-sm text-ink-2">{detail}</dd>}
    </div>
  );
}

/** Tracks an element's rendered width so SVG charts can draw in real pixels. */
export function useElementWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

/** Reminder that everything shown is model data, not an on-site observation. */
export function DataDisclaimer({ className, tone = 'light' }: { className?: string; tone?: 'light' | 'dark' }) {
  return (
    <p className={cn('flex items-start gap-2 text-xs leading-relaxed', tone === 'dark' ? 'text-sand/65' : 'text-ink-3', className)}>
      <svg viewBox="0 0 16 16" className="mt-0.5 size-3.5 shrink-0" aria-hidden>
        <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 7v4M8 4.6v.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span>
        Información orientativa basada en modelos meteorológicos, no en observación directa. Las condiciones reales pueden cambiar en
        el spot: compruébalas siempre al llegar y no entres al agua si no lo ves claro.
      </span>
    </p>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('inline-block size-4 animate-spin rounded-full border-2 border-line-strong border-t-ink', className)}
    />
  );
}
