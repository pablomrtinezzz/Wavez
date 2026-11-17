'use client';

import React from 'react';
import { SpotSummaryDTO } from '@/application/dtos/SpotSummaryDTO';
import { Webcam } from '@/domain/models/Webcam';
import { WebcamEmbed } from '@/presentation/components/spot/WebcamEmbed';
import { ScoreBadge } from '@/presentation/components/ui/primitives';
import { ISLAND_NAME } from '@/presentation/lib/format';

interface WebcamGalleryProps {
  webcams: Webcam[];
  summaries: SpotSummaryDTO[];
  onSelectSpot: (spotId: string) => void;
  /** Name the island under each camera (archipelago page). */
  showIsland?: boolean;
}

/**
 * Cameras with the spots they show and those spots' current score. Players
 * that run inside Wavez come first; cameras on other sites follow.
 */
export function WebcamGallery({ webcams, summaries, onSelectSpot, showIsland }: WebcamGalleryProps) {
  const byId = new Map(summaries.map((s) => [s.spot.id, s]));
  const ordered = [...webcams].sort((a, b) => Number(a.source.kind === 'link') - Number(b.source.kind === 'link'));

  return (
    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {ordered.map((w) => {
        const spots = [...w.spotsInView, ...w.spotsNearby].map((id) => byId.get(id)).filter((s): s is SpotSummaryDTO => Boolean(s));
        return (
          <article key={w.id} className="min-w-0">
            <WebcamEmbed webcam={w} />
            {showIsland && <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-ocean">{ISLAND_NAME[w.island]}</p>}
            {spots.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {spots.map((s) => (
                  <li key={s.spot.id}>
                    <button
                      onClick={() => onSelectSpot(s.spot.id)}
                      className="inline-flex items-center gap-2 rounded-full border border-line bg-paper/70 py-1 pl-1 pr-3 text-sm text-ink transition hover:border-line-strong hover:bg-paper"
                    >
                      <ScoreBadge score={s.score.overallScore} quality={s.score.quality} size="sm" className="h-6 w-9 rounded-full text-xs" />
                      {s.spot.name.split(' (')[0]}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-ink-3">Para ver el estado del mar en esta costa.</p>
            )}
          </article>
        );
      })}
    </div>
  );
}
