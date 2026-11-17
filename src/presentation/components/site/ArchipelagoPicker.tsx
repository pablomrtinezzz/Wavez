'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SpotSummaryDTO } from '@/application/dtos/SpotSummaryDTO';
import { ISLANDS, ISLAND_IDS, IslandId } from '@/domain/models/Island';
import { QUALITY, formatScore } from '@/presentation/lib/format';
import { cn } from '@/presentation/lib/utils';
import { ISLAND_COASTS, boundsOf } from './islandGeometry';

const SCALE = 1000;

/** Projection shared by every island so the archipelago keeps its real layout. */
function useArchipelago() {
  return useMemo(() => {
    const b = boundsOf(ISLAND_IDS.flatMap((id) => ISLAND_COASTS[id]));
    const lngScale = Math.cos((((b.minLat + b.maxLat) / 2) * Math.PI) / 180);
    const project = (lat: number, lng: number) => ({ x: (lng - b.minLng) * lngScale * SCALE, y: (b.maxLat - lat) * SCALE });
    const width = (b.maxLng - b.minLng) * lngScale * SCALE;
    const height = (b.maxLat - b.minLat) * SCALE;
    const islands = ISLAND_IDS.map((id) => {
      const rings = ISLAND_COASTS[id];
      const ib = boundsOf(rings);
      const path = rings
        .map((ring) => ring.map(([lat, lng], i) => `${i ? 'L' : 'M'}${project(lat, lng).x.toFixed(1)},${project(lat, lng).y.toFixed(1)}`).join(' ') + ' Z')
        .join(' ');
      const bottom = project(ib.minLat, (ib.minLng + ib.maxLng) / 2);
      const top = project(ib.maxLat, (ib.minLng + ib.maxLng) / 2);
      return { id, path, bottom, top };
    });
    return { project, width, height, islands };
  }, []);
}

interface ArchipelagoPickerProps {
  summaries: SpotSummaryDTO[];
  /** Island of the current page, highlighted; null on the archipelago page. */
  current?: IslandId | null;
  /** Compact strip for island pages: no spot dots, smaller labels. */
  compact?: boolean;
  className?: string;
}

/**
 * The seven islands in their real positions, each tinted by its best wave
 * right now. Choosing an island opens its page.
 */
export function ArchipelagoPicker({ summaries, current = null, compact = false, className }: ArchipelagoPickerProps) {
  const router = useRouter();
  const geo = useArchipelago();
  const [hover, setHover] = useState<IslandId | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pxWidth, setPxWidth] = useState(1000);
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setPxWidth(e.contentRect.width || 1000));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const best = useMemo(() => {
    const m = new Map<IslandId, SpotSummaryDTO>();
    for (const s of summaries) {
      const prev = m.get(s.spot.island);
      if (!prev || s.score.overallScore > prev.score.overallScore) m.set(s.spot.island, s);
    }
    return m;
  }, [summaries]);

  // On phones the strip scrolls: start with the current island in the middle
  useEffect(() => {
    const el = scrollRef.current;
    const island = geo.islands.find((i) => i.id === current);
    if (!el || !island || el.scrollWidth <= el.clientWidth) return;
    const fraction = (island.bottom.x + geo.width * 0.035) / (geo.width * 1.07);
    el.scrollLeft = fraction * el.scrollWidth - el.clientWidth / 2;
  }, [current, geo]);

  const padX = geo.width * 0.035;
  const vbWidth = geo.width + padX * 2;
  /** Map units per screen pixel: labels and dots keep a constant on-screen size. */
  const u = vbWidth / pxWidth;
  const labelGap = (compact ? 40 : 46) * u;
  const viewBox = `${-padX} ${-geo.height * 0.04} ${vbWidth} ${geo.height * 1.04 + labelGap + 8 * u}`;
  const go = (id: IslandId) => router.push(`/${id}`);

  return (
    <nav aria-label="Elige isla" className={className}>
      <div ref={scrollRef} className={cn('-mx-5 overflow-x-auto px-5 scrollbar-none sm:mx-0 sm:px-0', !compact && 'fade-x')}>
      <svg ref={svgRef} viewBox={viewBox} className={cn('block h-auto w-full', compact ? 'min-w-[560px] sm:min-w-0' : 'min-w-[620px]')} role="list">
        {geo.islands.map(({ id, path }) => {
          const top = best.get(id);
          const isCurrent = id === current;
          const isHover = id === hover;
          const name = ISLANDS.find((i) => i.id === id)!.name;
          const tint = top ? QUALITY[top.score.quality].color : 'var(--color-line-strong)';
          return (
            <g key={id} role="listitem">
              <a
                href={`/${id}`}
                onClick={(e) => {
                  e.preventDefault();
                  go(id);
                }}
                onPointerEnter={() => setHover(id)}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(id)}
                onBlur={() => setHover(null)}
                aria-current={isCurrent ? 'page' : undefined}
                aria-label={`${name}${top ? `: mejor spot ${top.spot.name}, ${formatScore(top.score.overallScore)} sobre 10, ${QUALITY[top.score.quality].label}` : ''}`}
                className="cursor-pointer outline-none"
              >
                {/* Halo, then the island tinted by its best wave */}
                <path
                  d={path}
                  fill="none"
                  stroke={isCurrent || isHover ? tint : '#ffffff'}
                  strokeWidth={(isCurrent || isHover ? 9 : 6) * u}
                  strokeLinejoin="round"
                  opacity={isCurrent || isHover ? 0.35 : 0.7}
                  className="transition-all duration-300"
                />
                <path
                  d={path}
                  fill={top ? `color-mix(in oklab, ${tint} ${isCurrent || isHover ? 55 : 30}%, #efe7d3)` : '#e9dfc7'}
                  stroke={isCurrent ? 'var(--color-ink)' : '#8fb3c2'}
                  strokeWidth={(isCurrent ? 1.6 : 0.9) * u}
                  strokeLinejoin="round"
                  className="transition-all duration-300"
                />
                {!compact &&
                  summaries
                    .filter((s) => s.spot.island === id)
                    .map((s) => {
                      const p = geo.project(s.spot.location.lat, s.spot.location.lng);
                      return <circle key={s.spot.id} cx={p.x} cy={p.y} r={3.2 * u} fill={QUALITY[s.score.quality].color} stroke="#fff" strokeWidth={1.2 * u} pointerEvents="none" />;
                    })}
              </a>
            </g>
          );
        })}
        {/* Names and scores on top of every island, so a neighbour never hides them */}
        {geo.islands.map(({ id, bottom }) => {
          const top = best.get(id);
          const isCurrent = id === current;
          const isHover = id === hover;
          const name = ISLANDS.find((i) => i.id === id)!.name;
          const tint = top ? QUALITY[top.score.quality].color : 'var(--color-line-strong)';
          return (
            <g key={`label-${id}`} transform={`translate(${bottom.x} ${bottom.y + 16 * u})`} pointerEvents="none">
              <text
                textAnchor="middle"
                fontSize={(compact ? 11 : 13) * u}
                fontWeight={isCurrent ? 600 : 500}
                fill={isCurrent || isHover ? 'var(--color-ink)' : 'var(--color-ink-2)'}
                className="transition-colors"
              >
                {name}
              </text>
              {top && (
                <g transform={`translate(0 ${5 * u})`}>
                  <rect x={-16 * u} y={0} width={32 * u} height={(compact ? 17 : 19) * u} rx={9.5 * u} fill={tint} />
                  <text
                    x={0}
                    y={(compact ? 12.5 : 13.5) * u}
                    textAnchor="middle"
                    fontSize={(compact ? 10.5 : 11.5) * u}
                    fontWeight={600}
                    fill={QUALITY[top.score.quality].onColor}
                    className="tabular-nums"
                  >
                    {formatScore(top.score.overallScore)}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      </div>
      {!compact && <p className="mt-1 text-center text-xs text-ink-3 sm:hidden">Desliza para ver todas las islas →</p>}
      {!compact && (
        <p className={cn('mt-2 hidden min-h-5 sm:block text-center text-sm text-ink-2 transition-opacity', hover ? 'opacity-100' : 'opacity-0')} aria-hidden>
          {hover && best.get(hover) ? (
            <>
              Lo mejor en {ISLANDS.find((i) => i.id === hover)!.name}: <span className="font-medium text-ink">{best.get(hover)!.spot.name}</span> ·{' '}
              {QUALITY[best.get(hover)!.score.quality].label}
            </>
          ) : (
            ' '
          )}
        </p>
      )}
    </nav>
  );
}
