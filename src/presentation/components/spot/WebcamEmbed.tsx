'use client';

import React, { useState } from 'react';
import { Play, ExternalLink } from 'lucide-react';
import { WebcamConfig } from '@/domain/models/Spot';
import { isApprovedWebcamUrl, cn } from '@/presentation/lib/utils';

interface WebcamEmbedProps {
  webcam: WebcamConfig;
  spotName: string;
  /** Load the stream immediately instead of waiting for a click. */
  autoLoad?: boolean;
  className?: string;
}

/**
 * In2theBeach player loaded on demand: each embed is a full video player, so
 * a gallery of ten only starts streaming the ones the user actually opens.
 */
export function WebcamEmbed({ webcam, spotName, autoLoad = false, className }: WebcamEmbedProps) {
  const [loaded, setLoaded] = useState(autoLoad);
  const url = webcam.iframeUrl;

  if (!url || !isApprovedWebcamUrl(url)) {
    return (
      <div className={cn('flex aspect-video items-center justify-center rounded-lg bg-line/50 text-sm text-ink-3', className)}>
        Webcam no disponible
      </div>
    );
  }

  return (
    <figure className={className}>
      <div className="relative aspect-video overflow-hidden rounded-lg bg-ink">
        {loaded ? (
          <iframe
            src={url}
            title={`Webcam en directo de ${spotName}`}
            className="absolute inset-0 size-full border-0"
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-popups"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <button
            onClick={() => setLoaded(true)}
            className="group absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_30%_20%,#1d3442,#0e1a24)] text-sand"
            aria-label={`Ver webcam en directo de ${spotName}`}
          >
            <span className="flex size-12 items-center justify-center rounded-full border border-sand/40 transition group-hover:scale-105 group-hover:border-sand">
              <Play className="ml-0.5 size-5 fill-current" />
            </span>
            <span className="text-sm text-sand/80">Ver en directo</span>
          </button>
        )}
      </div>
      {webcam.attributionUrl && (
        <figcaption className="mt-2 flex items-center justify-between gap-3 text-xs text-ink-3">
          <span className="truncate">{webcam.attributionTitle ?? 'In2theBeach'}</span>
          <a
            href={webcam.attributionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 hover:text-ink"
          >
            in2thebeach.es <ExternalLink className="size-3" />
          </a>
        </figcaption>
      )}
    </figure>
  );
}
