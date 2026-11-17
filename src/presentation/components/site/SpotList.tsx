'use client';

import React, { useMemo, useState } from 'react';
import { Search, Video, Camera } from 'lucide-react';
import { SpotSummaryDTO } from '@/application/dtos/SpotSummaryDTO';
import { isDirectionInRange } from '@/domain/models/MarineConditions';
import { DirectionArrow, QualityDot, ScoreBadge } from '@/presentation/components/ui/primitives';
import {
  BREAK_LABEL,
  QUALITY,
  ISLAND_NAME,
  QUALITY_ORDER,
  ZONE_LABEL,
  describeWind,
  formatTide,
} from '@/presentation/lib/format';
import { cn } from '@/presentation/lib/utils';
import { webcamsOfSpot } from '@/infrastructure/webcams';

type SortKey = 'score' | 'height' | 'energy' | 'name';

const SORTS: { id: SortKey; label: string }[] = [
  { id: 'score', label: 'Mejores condiciones' },
  { id: 'height', label: 'Más tamaño' },
  { id: 'energy', label: 'Más energía' },
  { id: 'name', label: 'Nombre' },
];

/** Accent-insensitive search ("cicer" finds "Cícer"). */
function normalize(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

const zoneOf = (s: SpotSummaryDTO): string => s.spot.zone;
const islandOf = (s: SpotSummaryDTO): string => s.spot.island;

export interface SpotGroup {
  id: string;
  label: string;
}

interface SpotListProps {
  summaries: SpotSummaryDTO[];
  onSelectSpot: (spotId: string) => void;
  isRefreshing?: boolean;
  /** Filter chips: the island's zones, or the islands on the archipelago page. */
  groups: SpotGroup[];
  groupBy: 'zone' | 'island';
  /** Label of the "everything" chip. */
  allLabel: string;
}

export function SpotList({ summaries, onSelectSpot, isRefreshing, groups, groupBy, allLabel }: SpotListProps) {
  const groupOf = groupBy === 'zone' ? zoneOf : islandOf;
  const [zone, setZone] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('score');

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: summaries.length };
    summaries.forEach((s) => (c[groupOf(s)] = (c[groupOf(s)] ?? 0) + 1));
    return c;
  }, [summaries, groupOf]);

  const rows = useMemo(() => {
    const q = normalize(query.trim());
    return summaries
      .filter((s) => zone === 'all' || groupOf(s) === zone)
      .filter(
        (s) =>
          !q ||
          normalize(s.spot.name).includes(q) ||
          normalize(s.spot.location.municipality).includes(q) ||
          normalize(BREAK_LABEL[s.spot.breakType]).includes(q)
      )
      .sort((a, b) => {
        if (sort === 'height') return b.conditions.primarySwell.heightM - a.conditions.primarySwell.heightM;
        if (sort === 'energy') return b.energy.energyKj - a.energy.energyKj;
        if (sort === 'name') return a.spot.name.localeCompare(b.spot.name, 'es');
        return b.score.overallScore - a.score.overallScore;
      });
  }, [summaries, zone, query, sort, groupOf]);

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col gap-4 border-b border-line pb-4 md:flex-row md:items-end md:justify-between">
        <nav aria-label="Filtrar por zona" className="fade-x -mx-1 flex gap-1 overflow-x-auto scrollbar-none">
          {[{ id: 'all', label: allLabel }, ...groups].map((z) => (
            <button
              key={z.id}
              onClick={() => setZone(z.id)}
              aria-pressed={zone === z.id}
              className={cn(
                'whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition',
                zone === z.id ? 'bg-ink text-sand' : 'text-ink-2 hover:bg-line/60 hover:text-ink'
              )}
            >
              {z.label}
              <span className={cn('ml-1.5 tabular-nums', zone === z.id ? 'text-sand/60' : 'text-ink-3')}>
                {counts[z.id] ?? 0}
              </span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <label className="relative flex-1 md:w-56 md:flex-none">
            <span className="sr-only">Buscar spot</span>
            <Search className="pointer-events-none absolute left-0 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar spot o municipio"
              className="w-full border-b border-line-strong bg-transparent py-1.5 pl-6 text-sm text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none"
            />
          </label>
          <label className="shrink-0">
            <span className="sr-only">Ordenar</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="cursor-pointer border-b border-line-strong bg-transparent py-1.5 pr-1 text-sm text-ink-2 focus:border-ink focus:outline-none"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* How to read the score */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line py-3 text-xs text-ink-2">
        <span className="text-ink-3">Nota de 0 a 10 según tamaño, viento, periodo y marea de cada spot:</span>
        {QUALITY_ORDER.map((q) => (
          <span key={q} className="inline-flex items-center gap-1.5">
            <QualityDot quality={q} />
            {QUALITY[q].label}
            <span className="text-ink-3 tabular-nums">{q === 'flat' ? '< 3' : `${QUALITY[q].min.toFixed(1).replace('.0', '')}+`}</span>
          </span>
        ))}
      </div>

      {/* Column headings (desktop) */}
      <div className="hidden grid-cols-[3.5rem_minmax(0,2.2fr)_minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,1.3fr)_minmax(0,1fr)_4.5rem] gap-4 border-b border-line py-2.5 text-xs text-ink-3 lg:grid">
        <span>Nota</span>
        <span>Spot</span>
        <span>Condiciones</span>
        <span>Oleaje</span>
        <span>Viento</span>
        <span>Marea</span>
        <span className="text-right">Energía</span>
      </div>

      <ol className={cn('transition-opacity', isRefreshing && 'opacity-60')}>
        {rows.map((s, i) => (
          <SpotRow key={s.spot.id} summary={s} rank={sort === 'score' ? i + 1 : undefined} onSelect={onSelectSpot} showIsland={groupBy === 'island'} />
        ))}
      </ol>

      {rows.length === 0 && (
        <p className="py-16 text-center text-sm text-ink-3">
          Ningún spot coincide con «{query}»{zone !== 'all' && ` en ${groups.find((g) => g.id === zone)?.label ?? ''}`}.
        </p>
      )}
    </div>
  );
}

function SpotRow({
  summary,
  rank,
  onSelect,
  showIsland,
}: {
  summary: SpotSummaryDTO;
  rank?: number;
  onSelect: (id: string) => void;
  showIsland?: boolean;
}) {
  const { spot, conditions, score, energy } = summary;
  const swell = conditions.primarySwell;
  const wind = conditions.wind;
  const isOffshore = isDirectionInRange(
    wind.directionDeg,
    spot.idealConditions.favorableWindDegrees.min,
    spot.idealConditions.favorableWindDegrees.max
  );
  const windInfo = describeWind(wind.speedKmh, isOffshore);

  return (
    <li className="border-b border-line">
      <button
        onClick={() => onSelect(spot.id)}
        className="group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 py-4 text-left transition hover:bg-paper/70 lg:grid-cols-[3.5rem_minmax(0,2.2fr)_minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,1.3fr)_minmax(0,1fr)_4.5rem] lg:py-5"
      >
        <span className="relative">
          <ScoreBadge score={score.overallScore} quality={score.quality} size="sm" className="lg:h-10 lg:w-12 lg:text-base" />
          {rank && (
            <span className="absolute -left-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-sand text-[9px] text-ink-3 tabular-nums ring-1 ring-line">
              {rank}
            </span>
          )}
        </span>

        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="truncate text-base font-medium text-ink group-hover:underline group-hover:underline-offset-4">
              {spot.name}
            </span>
            {webcamsOfSpot(spot.id).length > 0 && <Video className="size-3.5 shrink-0 text-ink-3" aria-label="Con webcam" />}
            {summary.recentReportCount > 0 && <Camera className="size-3.5 shrink-0 text-accent" aria-label="Con fotos recientes" />}
          </span>
          <span className="mt-0.5 block truncate text-xs text-ink-3">
            {showIsland ? `${ISLAND_NAME[spot.island]} · ` : ''}
            {ZONE_LABEL[spot.zone]} · {spot.location.municipality} · {BREAK_LABEL[spot.breakType]}
          </span>
        </span>

        <span className="flex lg:items-start">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-ink"
            style={{ background: QUALITY[score.quality].tint }}
          >
            <QualityDot quality={score.quality} />
            {QUALITY[score.quality].label}
          </span>
        </span>

        {/* On small screens the measurements collapse into one line */}
        <span className="col-span-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-2 lg:contents">
          <span className="inline-flex items-center gap-1 tabular-nums">
            <span className="text-ink">{swell.heightM.toFixed(1)} m</span>· {Math.round(swell.periodSec)} s
            <DirectionArrow degrees={swell.directionDeg} className="text-ink-3" />
            {swell.compassDir}
          </span>
          <span className="inline-flex items-center gap-1 tabular-nums">
            <span className="text-ink">{Math.round(wind.speedKmh)}</span> km/h
            <DirectionArrow degrees={wind.directionDeg} className="text-ink-3" />
            {wind.compassDir}
            <span
              className={cn(
                'ml-1 rounded px-1.5 py-0.5 text-[11px]',
                windInfo.tone === 'good'
                  ? 'bg-q-good/12 text-[#1f7a52]'
                  : windInfo.tone === 'bad'
                  ? 'bg-q-poor/12 text-danger'
                  : 'bg-line/60 text-ink-2'
              )}
            >
              {windInfo.label}
            </span>
          </span>
          <span className="text-sm">{conditions.tide ? formatTide(conditions.tide) : '—'}</span>
          <span className="tabular-nums lg:text-right">
            {energy.energyKj.toLocaleString('es-ES')} <span className="text-ink-3">kJ</span>
          </span>
        </span>
      </button>
    </li>
  );
}
