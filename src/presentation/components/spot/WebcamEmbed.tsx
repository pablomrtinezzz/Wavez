'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { ExternalLink, Play, Video } from 'lucide-react';
import { Webcam, relationTo } from '@/domain/models/Webcam';
import { isApprovedWebcamUrl, cn } from '@/presentation/lib/utils';
import { getActiveWebcam, setActiveWebcam, useActiveWebcam } from '@/presentation/lib/activeWebcam';

interface WebcamViewProps {
  webcam: Webcam;
  /** When shown for a spot, say whether the camera points at it or at a nearby beach. */
  spotId?: string;
  /** Load the stream immediately instead of waiting for a click. */
  autoLoad?: boolean;
  className?: string;
}

/** Calm sea behind the play button, so an unloaded player still looks like a window on the coast. */
function SeaPoster({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_30%_20%,#1d3442,#0e1a24)]">
      <svg aria-hidden viewBox="0 0 400 225" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-1/2 w-full opacity-30">
        <path d="M0 150 Q50 135 100 150 T200 150 T300 150 T400 150" fill="none" stroke="#f6f4ef" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <path d="M0 180 Q60 165 120 180 T240 180 T360 180 T480 180" fill="none" stroke="#f2c46d" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
      {children}
    </div>
  );
}

/** How often a provider's still picture is reloaded while it is on screen. */
const STILL_REFRESH_MS = 60_000;

/**
 * A provider's live still, reloaded every minute while visible. The plain
 * <img> keeps it a direct request to the provider, as their embed code does.
 */
function LiveStill({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLImageElement>(null);
  const [stamp, setStamp] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !timer) timer = setInterval(() => setStamp(Date.now()), STILL_REFRESH_MS);
      if (!entry.isIntersecting && timer) {
        clearInterval(timer);
        timer = null;
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer) clearInterval(timer);
    };
  }, []);

  if (failed) return <SeaPoster>{null}</SeaPoster>;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- third-party live still, not an optimisable asset
    <img
      ref={ref}
      src={stamp ? `${src}?t=${stamp}` : src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
    />
  );
}

/**
 * A camera on the coast. Embeddable players (In2theBeach) load on demand and
 * only one plays at a time across the page; cameras whose owner does not allow
 * embedding open on the owner's site.
 */
export function WebcamEmbed({ webcam, spotId, autoLoad = false, className }: WebcamViewProps) {
  const playerId = useId();
  const active = useActiveWebcam();
  const loaded = active === playerId;
  const { source } = webcam;
  const embedUrl = source.kind === 'embed' && isApprovedWebcamUrl(source.embedUrl) ? source.embedUrl : null;
  const relation = spotId ? relationTo(webcam, spotId) : null;

  useEffect(() => {
    if (autoLoad && embedUrl) setActiveWebcam(playerId);
    // Release the stream when this player disappears (e.g. the drawer closes)
    return () => {
      if (getActiveWebcam() === playerId) setActiveWebcam(null);
    };
  }, [autoLoad, embedUrl, playerId]);

  return (
    <figure className={className}>
      <div className="relative aspect-video overflow-hidden rounded-xl bg-ink">
        {embedUrl ? (
          loaded ? (
            <>
              <iframe
                src={embedUrl}
                title={`Webcam en directo: ${webcam.name}`}
                className="absolute inset-0 size-full border-0"
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
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
              className="group absolute inset-0 text-sand"
              aria-label={`Ver en directo la webcam de ${webcam.name}`}
            >
              <SeaPoster>
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-ink/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] backdrop-blur">
                  <span className="size-1.5 rounded-full bg-[#e5484d] animate-pulse-soft" aria-hidden />
                  En directo
                </span>
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-full border border-sand/40 bg-ink/20 backdrop-blur-sm transition group-hover:scale-105 group-hover:border-sand">
                    <Play className="ml-0.5 size-5 fill-current" />
                  </span>
                  <span className="text-sm text-sand/80">Ver en directo</span>
                </span>
              </SeaPoster>
            </button>
          )
        ) : (
          <a
            href={source.pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group absolute inset-0 text-sand"
            aria-label={`Ver en directo la webcam de ${webcam.name} en ${source.provider} (se abre en otra pestaña)`}
          >
            {source.kind === 'link' && source.snapshotUrl ? (
              <LiveStill src={source.snapshotUrl} alt={`Imagen reciente de la webcam de ${webcam.name}`} />
            ) : (
              <SeaPoster>{null}</SeaPoster>
            )}
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-ink/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] backdrop-blur">
              <Video className="size-3" aria-hidden />
              {source.kind === 'link' && source.snapshotUrl ? 'Foto en directo' : source.provider}
            </span>
            <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-ink/85 via-ink/50 to-transparent px-3 pb-2.5 pt-8 text-sm">
              <span className="truncate">Ver el vídeo en {source.provider.split(' · ')[0]}</span>
              <ExternalLink className="size-4 shrink-0 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
            </span>
          </a>
        )}
      </div>
      <figcaption className="mt-2 flex items-center justify-between gap-3 text-xs text-ink-3">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-ink-2">{webcam.name}</span>
          {relation && (
            <span
              className={cn(
                'shrink-0 rounded-full px-1.5 py-0.5 text-[10px]',
                relation === 'in-view' ? 'bg-q-good/12 text-[#1f7a52]' : 'bg-line/70 text-ink-2'
              )}
            >
              {relation === 'in-view' ? 'Enfoca el spot' : 'Playa cercana'}
            </span>
          )}
        </span>
        <a href={source.pageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 hover:text-ink">
          {source.provider} <ExternalLink className="size-3" aria-hidden />
        </a>
      </figcaption>
    </figure>
  );
}
