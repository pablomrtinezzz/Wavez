'use client';

import React from 'react';
import { GraduationCap, Mountain, TrendingUp, Wind } from 'lucide-react';
import { SpotSummaryDTO } from '@/application/dtos/SpotSummaryDTO';
import { ISLAND_NAME, QUALITY } from '@/presentation/lib/format';
import { PickId, pickSpots } from '@/presentation/lib/picks';
import { ScoreBadge } from '@/presentation/components/ui/primitives';
import { cn } from '@/presentation/lib/utils';

const ICONS: Record<PickId, React.ComponentType<{ className?: string }>> = {
  learn: GraduationCap,
  intermediate: TrendingUp,
  advanced: Mountain,
  glassy: Wind,
};

/** "Hoy para ti": the best spot right now for each kind of surfer. */
export function LevelPicks({
  summaries,
  onSelectSpot,
  showIsland,
}: {
  summaries: SpotSummaryDTO[];
  onSelectSpot: (spotId: string) => void;
  showIsland?: boolean;
}) {
  const picks = pickSpots(summaries);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {picks.map((pick) => {
        const Icon = ICONS[pick.id];
        const [top, ...rest] = pick.spots;
        return (
          <section key={pick.id} className="flex flex-col rounded-3xl border border-line bg-paper/70 p-5" aria-labelledby={`pick-${pick.id}`}>
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-full bg-sea text-ocean">
                <Icon className="size-4" />
              </span>
              <div>
                <h3 id={`pick-${pick.id}`} className="text-sm font-medium text-ink">
                  {pick.title}
                </h3>
                <p className="text-xs text-ink-3">{pick.hint}</p>
              </div>
            </div>

            {top ? (
              <>
                <button onClick={() => onSelectSpot(top.spot.id)} className="group mb-4 mt-5 text-left">
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      {showIsland && <span className="block text-[11px] uppercase tracking-[0.14em] text-ocean">{ISLAND_NAME[top.spot.island]}</span>}
                      <span className="display block text-3xl leading-tight text-ink group-hover:underline group-hover:decoration-sun group-hover:underline-offset-4">
                        {top.spot.name.split(' (')[0]}
                      </span>
                    </span>
                    <ScoreBadge score={top.score.overallScore} quality={top.score.quality} size="md" className="shrink-0" />
                  </span>
                  <span className="mt-2 block text-sm text-ink-2 tabular-nums">
                    {top.conditions.primarySwell.heightM.toFixed(1)} m · {Math.round(top.conditions.primarySwell.periodSec)} s · viento{' '}
                    {Math.round(top.conditions.wind.speedKmh)} km/h
                  </span>
                </button>
                {rest.length > 0 && (
                  <ul className="mt-auto space-y-1 border-t border-line pt-3 text-sm" aria-label="Otras opciones">
                    {rest.map((s) => (
                      <li key={s.spot.id}>
                        <button onClick={() => onSelectSpot(s.spot.id)} className="flex w-full items-center justify-between gap-2 py-1 text-left text-ink-2 hover:text-ink">
                          <span className="truncate">
                            {s.spot.name.split(' (')[0]}
                            {showIsland && <span className="text-ink-3"> · {ISLAND_NAME[s.spot.island]}</span>}
                          </span>
                          <span
                            className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs tabular-nums')}
                            style={{ background: QUALITY[s.score.quality].tint }}
                          >
                            {(s.score.overallScore / 10).toFixed(1)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <p className="mt-5 text-sm text-ink-3">Hoy no hay nada surfeable para este perfil.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
