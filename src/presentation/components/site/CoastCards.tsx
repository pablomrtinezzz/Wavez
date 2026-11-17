'use client';

import React, { useMemo } from 'react';
import { SpotSummaryDTO } from '@/application/dtos/SpotSummaryDTO';
import { IslandId, getIsland } from '@/domain/models/Island';
import { QUALITY } from '@/presentation/lib/format';
import { zoneStates } from '@/presentation/lib/picks';
import { ScoreBadge } from '@/presentation/components/ui/primitives';
import { ISLAND_COASTS, boundsOf } from './islandGeometry';

/** The island outline with one zone's spots lit up. */
function ZoneLocator({ island, summaries, zone }: { island: IslandId; summaries: SpotSummaryDTO[]; zone: string }) {
  const geo = useMemo(() => {
    const rings = ISLAND_COASTS[island];
    const b = boundsOf(rings);
    const k = Math.cos((((b.minLat + b.maxLat) / 2) * Math.PI) / 180);
    const w = (b.maxLng - b.minLng) * k;
    const h = b.maxLat - b.minLat;
    const size = Math.max(w, h);
    const project = (lat: number, lng: number) => ({
      x: (((size - w) / 2 + (lng - b.minLng) * k) / size) * 100,
      y: (((size - h) / 2 + (b.maxLat - lat)) / size) * 100,
    });
    const path = rings
      .map((r) => r.map(([lat, lng], i) => `${i ? 'L' : 'M'}${project(lat, lng).x.toFixed(1)},${project(lat, lng).y.toFixed(1)}`).join(' ') + ' Z')
      .join(' ');
    return { project, path };
  }, [island]);

  return (
    <svg viewBox="-6 -6 112 112" className="size-20 shrink-0" aria-hidden>
      <path d={geo.path} fill="#e9dfc7" stroke="#8fb3c2" strokeWidth={1} strokeLinejoin="round" />
      {summaries.map((s) => {
        const p = geo.project(s.spot.location.lat, s.spot.location.lng);
        const mine = s.spot.zone === zone;
        return (
          <circle
            key={s.spot.id}
            cx={p.x}
            cy={p.y}
            r={mine ? 4.5 : 2.5}
            fill={mine ? QUALITY[s.score.quality].color : 'var(--color-line-strong)'}
            stroke="#fff"
            strokeWidth={mine ? 1.5 : 0.8}
          />
        );
      })}
    </svg>
  );
}

/** "Por costas": which side of the island is working right now. */
export function CoastCards({ island, summaries, onSelectSpot }: { island: IslandId; summaries: SpotSummaryDTO[]; onSelectSpot: (id: string) => void }) {
  const info = getIsland(island);
  const states = zoneStates(
    summaries,
    info.zones.map((z) => z.id)
  ).sort((a, b) => (b.best?.score.overallScore ?? -1) - (a.best?.score.overallScore ?? -1));

  return (
    <ol className="grid gap-4 sm:grid-cols-2">
      {states.map((st, i) => {
        const label = info.zones.find((z) => z.id === st.zone)!.label;
        return (
          <li key={st.zone}>
            <article className="flex h-full items-center gap-4 rounded-3xl border border-line bg-paper/70 p-4 sm:p-5">
              <ZoneLocator island={island} summaries={summaries} zone={st.zone} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-xs text-ink-3">
                  {i === 0 && st.best && QUALITY[st.best.score.quality].rank >= QUALITY.fair.rank && (
                    <span className="rounded-full bg-sun-soft px-2 py-0.5 font-medium text-warn">La mejor costa ahora</span>
                  )}
                  <span>
                    {st.surfable} de {st.total} {st.total === 1 ? 'spot surfeable' : 'surfeables'}
                  </span>
                </p>
                <h3 className="display mt-1 text-3xl text-ink">{label}</h3>
                {st.best && (
                  <button onClick={() => onSelectSpot(st.best!.spot.id)} className="mt-2 flex w-full items-center gap-2 text-left text-sm text-ink-2 hover:text-ink">
                    <ScoreBadge score={st.best.score.overallScore} quality={st.best.score.quality} size="sm" className="h-6 w-9 rounded-full text-xs" />
                    <span className="truncate">{st.best.spot.name}</span>
                  </button>
                )}
              </div>
            </article>
          </li>
        );
      })}
    </ol>
  );
}
