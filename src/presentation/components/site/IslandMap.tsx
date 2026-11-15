'use client';

import React, { useState } from 'react';
import { SpotSummaryDTO } from '@/application/dtos/SpotSummaryDTO';
import { ConditionQuality } from '@/domain/models/SpotScore';
import { QUALITY, formatScore } from '@/presentation/lib/format';
import { QualityDot } from '@/presentation/components/ui/primitives';

/** Simplified Gran Canaria coastline (lat, lng), clockwise from Las Canteras. */
const COAST: [number, number][] = [
  [28.128, -15.452], [28.142, -15.441], [28.158, -15.441], [28.176, -15.43], [28.181, -15.414],
  [28.172, -15.398], [28.155, -15.405], [28.135, -15.414], [28.11, -15.416], [28.08, -15.411],
  [28.05, -15.395], [28.025, -15.383], [28.0, -15.371], [27.97, -15.368], [27.935, -15.37],
  [27.9, -15.378], [27.865, -15.388], [27.835, -15.405], [27.812, -15.43], [27.795, -15.47],
  [27.782, -15.51], [27.762, -15.55], [27.738, -15.578], [27.737, -15.605], [27.746, -15.64],
  [27.755, -15.675], [27.77, -15.705], [27.79, -15.735], [27.815, -15.765], [27.85, -15.79],
  [27.9, -15.81], [27.95, -15.83], [27.995, -15.825], [28.04, -15.8], [28.075, -15.755],
  [28.1, -15.715], [28.135, -15.705], [28.162, -15.7], [28.178, -15.672], [28.17, -15.64],
  [28.16, -15.61], [28.153, -15.58], [28.149, -15.545], [28.143, -15.51], [28.136, -15.48],
];

const BOUNDS = { minLat: 27.71, maxLat: 28.2, minLng: -15.85, maxLng: -15.35 };
const LNG_SCALE = Math.cos((28 * Math.PI) / 180); // keep the island's real proportions
const SCALE = 1000;
const W = (BOUNDS.maxLng - BOUNDS.minLng) * LNG_SCALE * SCALE;
const H = (BOUNDS.maxLat - BOUNDS.minLat) * SCALE;

function project(lat: number, lng: number) {
  return {
    x: (lng - BOUNDS.minLng) * LNG_SCALE * SCALE,
    y: (BOUNDS.maxLat - lat) * SCALE,
  };
}

const COAST_PATH =
  COAST.map(([lat, lng], i) => {
    const { x, y } = project(lat, lng);
    return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ') + ' Z';

interface IslandMapProps {
  summaries: SpotSummaryDTO[];
  onSelectSpot: (spotId: string) => void;
}

export function IslandMap({ summaries, onSelectSpot }: IslandMapProps) {
  const [focusId, setFocusId] = useState<string | null>(null);
  const focused = summaries.find((s) => s.spot.id === focusId) ?? summaries[0];

  // Draw better spots last so they sit on top where markers overlap
  const ordered = [...summaries].sort((a, b) => a.score.overallScore - b.score.overallScore);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
      <div className="relative">
        <svg viewBox={`-20 -20 ${W + 40} ${H + 40}`} className="h-auto w-full" role="group" aria-label="Mapa de spots de Gran Canaria">
          <path d={COAST_PATH} fill="var(--color-paper)" stroke="var(--color-line-strong)" strokeWidth="1.5" strokeLinejoin="round" />
          <text x={project(27.96, -15.6).x} y={project(27.96, -15.6).y} textAnchor="middle" fontSize="13" letterSpacing="3" fill="var(--color-ink-3)">
            GRAN CANARIA
          </text>

          {ordered.map((s) => {
            const { x, y } = project(s.spot.location.lat, s.spot.location.lng);
            const isFocused = s.spot.id === focused?.spot.id;
            return (
              <g
                key={s.spot.id}
                role="button"
                tabIndex={0}
                aria-label={`${s.spot.name}: ${QUALITY[s.score.quality].label}, ${formatScore(s.score.overallScore)} sobre 10`}
                className="cursor-pointer outline-none"
                onPointerEnter={() => setFocusId(s.spot.id)}
                onFocus={() => setFocusId(s.spot.id)}
                onClick={() => onSelectSpot(s.spot.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectSpot(s.spot.id);
                  }
                }}
              >
                {/* Generous hit area */}
                <circle cx={x} cy={y} r="16" fill="transparent" />
                <circle
                  cx={x}
                  cy={y}
                  r={isFocused ? 9 : 6.5}
                  fill={QUALITY[s.score.quality].color}
                  stroke="var(--color-paper)"
                  strokeWidth="2.5"
                  className="transition-[r] duration-150"
                />
                {isFocused && <circle cx={x} cy={y} r="14" fill="none" stroke="var(--color-ink)" strokeWidth="1" />}
              </g>
            );
          })}
        </svg>
        <MapLegend />
      </div>

      {focused && (
        <div className="border-t border-line pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0" aria-live="polite">
          <p className="eyebrow">{focused.spot.location.municipality}</p>
          <h3 className="display mt-2 text-3xl">{focused.spot.name}</h3>
          <p className="mt-3 flex items-center gap-2 text-sm text-ink-2">
            <QualityDot quality={focused.score.quality} />
            {QUALITY[focused.score.quality].label} · {formatScore(focused.score.overallScore)}/10
          </p>
          <p className="mt-1 text-sm text-ink-2 tabular-nums">
            {focused.conditions.primarySwell.heightM.toFixed(1)} m · {Math.round(focused.conditions.primarySwell.periodSec)} s{' '}
            {focused.conditions.primarySwell.compassDir} · viento {Math.round(focused.conditions.wind.speedKmh)} km/h{' '}
            {focused.conditions.wind.compassDir}
          </p>
          <button
            onClick={() => onSelectSpot(focused.spot.id)}
            className="mt-5 text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            Ver informe completo →
          </button>
        </div>
      )}
    </div>
  );
}

export function MapLegend() {
  const order: ConditionQuality[] = ['flat', 'poor', 'fair', 'good', 'firing'];
  return (
    <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-2" aria-label="Leyenda de calidad">
      {order.map((q) => (
        <li key={q} className="inline-flex items-center gap-1.5">
          <QualityDot quality={q} />
          {QUALITY[q].label}
        </li>
      ))}
    </ul>
  );
}
