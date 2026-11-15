'use client';

import React from 'react';
import { SpotSummaryDTO } from '@/application/dtos/SpotSummaryDTO';
import { WebcamEmbed } from '@/presentation/components/spot/WebcamEmbed';
import { QualityLabel } from '@/presentation/components/ui/primitives';
import { ZONE_LABEL } from '@/presentation/lib/format';

interface WebcamGalleryProps {
  summaries: SpotSummaryDTO[];
  onSelectSpot: (spotId: string) => void;
}

export function WebcamGallery({ summaries, onSelectSpot }: WebcamGalleryProps) {
  const withCam = summaries.filter((s) => s.spot.webcam?.iframeUrl);

  return (
    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {withCam.map((s) => (
        <article key={s.spot.id}>
          <WebcamEmbed webcam={s.spot.webcam!} spotName={s.spot.name} />
          <div className="mt-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <button onClick={() => onSelectSpot(s.spot.id)} className="text-left font-medium text-ink hover:underline underline-offset-4">
                {s.spot.name}
              </button>
              <p className="text-xs text-ink-3">{ZONE_LABEL[s.spot.zone]} · {s.spot.location.municipality}</p>
            </div>
            <QualityLabel quality={s.score.quality} className="shrink-0 text-xs" />
          </div>
        </article>
      ))}
    </div>
  );
}
