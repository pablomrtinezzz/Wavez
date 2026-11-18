'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SpotSummaryDTO } from '@/application/dtos/SpotSummaryDTO';
import { ISLANDS, IslandId } from '@/domain/models/Island';
import { WEBCAMS } from '@/infrastructure/webcams';
import { Webcam } from '@/domain/models/Webcam';
import { cn } from '@/presentation/lib/utils';
import { WebcamGallery } from './WebcamGallery';

const FIRST = 6;

/** Players that run inside Wavez first. */
const embedsFirst = (cams: Webcam[]) => [...cams].sort((a, b) => Number(a.source.kind === 'link') - Number(b.source.kind === 'link'));

/** One camera per island in turn, so the first row already shows the whole archipelago. */
function interleaveByIsland(cams: Webcam[]): Webcam[] {
  const queues = ISLANDS.map((i) => embedsFirst(cams.filter((w) => w.island === i.id)));
  const out: Webcam[] = [];
  while (queues.some((q) => q.length)) for (const q of queues) if (q.length) out.push(q.shift()!);
  return out;
}

/** Every camera in the Canaries, filterable by island. */
export function CanaryWebcams({ summaries, onSelectSpot }: { summaries: SpotSummaryDTO[]; onSelectSpot: (id: string) => void }) {
  const [island, setIsland] = useState<IslandId | 'all'>('all');
  const [expanded, setExpanded] = useState(false);
  const cams = island === 'all' ? WEBCAMS : WEBCAMS.filter((w) => w.island === island);
  const ordered = island === 'all' ? interleaveByIsland(cams) : embedsFirst(cams);
  const shown = expanded || island !== 'all' ? ordered : ordered.slice(0, FIRST);
  const live = WEBCAMS.filter((w) => w.source.kind === 'embed').length;

  return (
    <div>
      <div className="fade-x -mx-1 mb-6 flex gap-1 overflow-x-auto px-1 scrollbar-none">
        {[{ id: 'all' as const, name: 'Todas' }, ...ISLANDS].map((i) => {
          const count = i.id === 'all' ? WEBCAMS.length : WEBCAMS.filter((w) => w.island === i.id).length;
          return (
            <button
              key={i.id}
              onClick={() => {
                setIsland(i.id);
                setExpanded(false);
              }}
              aria-pressed={island === i.id}
              className={cn(
                'whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition',
                island === i.id ? 'bg-ink text-sand' : 'text-ink-2 hover:bg-line/60 hover:text-ink'
              )}
            >
              {i.name}
              <span className={cn('ml-1.5 tabular-nums', island === i.id ? 'text-sand/60' : 'text-ink-3')}>{count}</span>
            </button>
          );
        })}
      </div>
      <WebcamGallery webcams={shown} summaries={summaries} onSelectSpot={onSelectSpot} showIsland={island === 'all'} />
      {shown.length < ordered.length && (
        <div className="mt-10 text-center">
          <button
            onClick={() => setExpanded(true)}
            className="rounded-full border border-line-strong px-5 py-2.5 text-sm text-ink transition hover:border-ink"
          >
            Ver las {ordered.length} cámaras
          </button>
        </div>
      )}
      <p className="mt-8 text-sm">
        <Link href="/webcams" className="text-ocean underline decoration-sun underline-offset-4 hover:text-ink">
          Todas las webcams de Canarias, isla por isla
        </Link>
      </p>
      <p className="mt-4 text-xs text-ink-3">
        {live} cámaras se ven aquí mismo gracias a In2theBeach y a canales de YouTube que lo permiten; el resto, sobre todo de SkylineWebcams, no se pueden ver fuera de la web de su autor y se abren allí.
      </p>
    </div>
  );
}
