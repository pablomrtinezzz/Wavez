'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUpRight, Video } from 'lucide-react';
import { webcamsOfIsland } from '@/infrastructure/webcams';
import { SpotSummaryDTO } from '@/application/dtos/SpotSummaryDTO';
import { ISLANDS, IslandId } from '@/domain/models/Island';
import { QUALITY } from '@/presentation/lib/format';
import { ScoreBadge } from '@/presentation/components/ui/primitives';
import { ISLAND_COASTS, boundsOf } from './islandGeometry';

/** The island's outline, scaled to fit a small square. */
export function IslandSilhouette({ island, className }: { island: IslandId; className?: string }) {
  const path = useMemo(() => {
    const rings = ISLAND_COASTS[island];
    const b = boundsOf(rings);
    const lngScale = Math.cos((((b.minLat + b.maxLat) / 2) * Math.PI) / 180);
    const w = (b.maxLng - b.minLng) * lngScale;
    const h = b.maxLat - b.minLat;
    const size = Math.max(w, h);
    const ox = (size - w) / 2;
    const oy = (size - h) / 2;
    return rings
      .map(
        (ring) =>
          ring
            .map(([lat, lng], i) => {
              const x = ((ox + (lng - b.minLng) * lngScale) / size) * 100;
              const y = ((oy + (b.maxLat - lat)) / size) * 100;
              return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(' ') + ' Z'
      )
      .join(' ');
  }, [island]);
  return (
    <svg viewBox="-4 -4 108 108" className={className} aria-hidden>
      <path d={path} fill="currentColor" />
    </svg>
  );
}

/** One card per island: its best spot right now and how many are worth a session. */
export function IslandCards({ summaries }: { summaries: SpotSummaryDTO[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {ISLANDS.map((island) => {
        const spots = summaries.filter((s) => s.spot.island === island.id);
        const best = [...spots].sort((a, b) => b.score.overallScore - a.score.overallScore)[0];
        const surfable = spots.filter((s) => QUALITY[s.score.quality].rank >= QUALITY.fair.rank).length;
        return (
          <li key={island.id}>
            <Link
              href={`/${island.id}`}
              className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-paper/70 p-5 transition hover:-translate-y-0.5 hover:border-line-strong hover:bg-paper hover:shadow-[0_18px_40px_-24px_rgba(14,26,36,0.35)] sm:p-6"
            >
              <IslandSilhouette
                island={island.id}
                className="pointer-events-none absolute -right-6 -top-6 size-32 text-sea transition-colors group-hover:text-accent-soft"
              />
              <div className="relative flex items-start justify-between gap-3">
                <h3 className="display text-[2.4rem] leading-none text-ink">{island.name}</h3>
                <ArrowUpRight className="mt-1 size-5 shrink-0 text-ink-3 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
              </div>
              <p className="relative mt-3 max-w-[90%] text-sm leading-relaxed text-ink-2">{island.summary}</p>
              <p className="relative mt-3 inline-flex items-center gap-1.5 text-xs text-ink-3">
                {spots.length} spots
                {webcamsOfIsland(island.id).length > 0 && (
                  <>
                    <span aria-hidden>·</span>
                    <Video className="size-3.5" aria-hidden /> {webcamsOfIsland(island.id).length}{' '}
                    {webcamsOfIsland(island.id).length === 1 ? 'webcam' : 'webcams'}
                  </>
                )}
              </p>

              <div className="relative mt-auto pt-6">
                {best ? (
                  <div className="flex items-center gap-3 border-t border-line pt-4">
                    <ScoreBadge score={best.score.overallScore} quality={best.score.quality} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{best.spot.name}</p>
                      <p className="text-xs text-ink-3">
                        {surfable === 0
                          ? `Ningún spot surfeable de ${spots.length}`
                          : `${surfable} de ${spots.length} ${spots.length === 1 ? 'spot surfeable' : 'spots surfeables'}`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="border-t border-line pt-4 text-xs text-ink-3">Sin datos ahora mismo</p>
                )}
              </div>
            </Link>
          </li>
        );
      })}
      <li>
        <a
          href="#ranking"
          className="group flex h-full min-h-48 flex-col justify-between rounded-3xl bg-[linear-gradient(135deg,var(--color-ocean-deep),var(--color-ocean))] p-5 text-sand transition hover:-translate-y-0.5 sm:p-6"
        >
          <span className="display text-[2.4rem] leading-none">¿No sabes a cuál ir?</span>
          <span className="mt-6 inline-flex items-center gap-2 text-sm text-sand/80 group-hover:text-sand">
            Todos los spots de Canarias por nota <ArrowDown className="size-4 transition group-hover:translate-y-0.5" aria-hidden />
          </span>
        </a>
      </li>
    </ul>
  );
}
