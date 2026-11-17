'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { SpotSummaryDTO } from '@/application/dtos/SpotSummaryDTO';
import { IslandId, getIsland } from '@/domain/models/Island';
import { ArchipelagoPicker } from './ArchipelagoPicker';
import { IslandSilhouette } from './IslandCards';

/** Island page opening: where you are in the archipelago, the island and its numbers. */
export function IslandIntro({
  island,
  summaries,
  spotCount,
  webcamCount,
}: {
  island: IslandId;
  summaries: SpotSummaryDTO[];
  spotCount: number;
  webcamCount: number;
}) {
  const info = getIsland(island);
  return (
    <section className="relative pt-6 sm:pt-10" aria-labelledby="island-title">
      <nav aria-label="Ruta" className="flex items-center gap-1 text-xs text-ink-3">
        <Link href="/" className="hover:text-ink">
          Canarias
        </Link>
        <ChevronRight className="size-3" aria-hidden />
        <span className="text-ink-2" aria-current="page">
          {info.name}
        </span>
      </nav>

      <div className="mt-4 grid items-end gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="relative min-w-0">
          <IslandSilhouette island={island} className="pointer-events-none absolute -left-4 -top-6 -z-10 size-40 text-sea sm:size-52" />
          <p className="text-xs uppercase tracking-[0.14em] text-ocean">Parte de olas</p>
          <h1 id="island-title" className="display mt-1 text-[clamp(3.25rem,11vw,6.5rem)] leading-[0.95] text-ink">
            {info.name}
          </h1>
          <p className="mt-3 max-w-md text-ink-2">{info.summary}</p>
          <dl className="mt-5 flex gap-6 text-sm">
            <div>
              <dt className="text-ink-3">Spots</dt>
              <dd className="display text-3xl text-ink">{spotCount}</dd>
            </div>
            <div>
              <dt className="text-ink-3">Costas</dt>
              <dd className="display text-3xl text-ink">{info.zones.length}</dd>
            </div>
            <div>
              <dt className="text-ink-3">Webcams</dt>
              <dd className="display text-3xl text-ink">{webcamCount}</dd>
            </div>
          </dl>
        </div>
        <div className="min-w-0">
          <p className="mb-1 text-xs text-ink-3">Cambiar de isla</p>
          <ArchipelagoPicker summaries={summaries} current={island} compact />
        </div>
      </div>
    </section>
  );
}
