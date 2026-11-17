'use client';

import React, { useEffect, useId } from 'react';
import { Play, ExternalLink } from 'lucide-react';
import { WebcamConfig } from '@/domain/models/Spot';
import { isApprovedWebcamUrl, cn } from '@/presentation/lib/utils';
import { getActiveWebcam, setActiveWebcam, useActiveWebcam } from '@/presentation/lib/activeWebcam';

interface WebcamEmbedProps {
  webcam: WebcamConfig;
  spotName: string;
  /** Load the stream immediately instead of waiting for a click. */
  autoLoad?: boolean;
  className?: string;
}

/**
 * In2theBeach player loaded on demand. Each embed is a full video stream, so
 * only one plays at a time: opening another one stops the previous player.
 */
export function WebcamEmbed({ webcam, spotName, autoLoad = false, className }: WebcamEmbedProps) {
  const playerId = useId();
  const active = useActiveWebcam();
  const loaded = active === playerId;
  const url = webcam.iframeUrl;

  useEffect(() => {
    if (autoLoad) setActiveWebcam(playerId);
    // Release the stream when this player disappears (e.g. the drawer closes)
    return () => {
      if (getActiveWebcam() === playerId) setActiveWebcam(null);
    };
  }, [autoLoad, playerId]);

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
          <>
            <iframe
              src={url}
              title={`Webcam en directo de ${spotName}`}
              className="absolute inset-0 size-full border-0"
              allow="autoplay; encrypted-media; fullscreen"
              sandbox="allow-scripts allow-same-origin allow-popups"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <button
              onClick={() => setActiveWebcam(null)}
              className="absolute right-2 top-2 rounded-full bg-ink/70 px-2.5 py-1 text-xs text-sand backdrop-blur transition hover:bg-ink"
            >
              Detener
            </button>
          </>
        ) : (
          <button
            onClick={() => setActiveWebcam(playerId)}
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
