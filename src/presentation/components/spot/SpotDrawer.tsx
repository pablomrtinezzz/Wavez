'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Camera, ShieldCheck, Sunrise, Sunset } from 'lucide-react';
import { SpotDetailDTO } from '@/application/dtos/SpotSummaryDTO';
import { SpotHourlyEvolutionDTO } from '@/application/usecases/GetSpotHourlyEvolutionUseCase';
import { SpotClimatology } from '@/domain/models/SeasonalClimatology';
import { Spot } from '@/domain/models/Spot';
import { isDirectionInRange } from '@/domain/models/MarineConditions';
import { addDays } from '@/domain/models/LocalTime';
import { DayChart } from '@/presentation/components/charts/DayChart';
import { SeasonChart } from '@/presentation/components/charts/SeasonChart';
import { WebcamEmbed } from './WebcamEmbed';
import { DirectionArrow, Figure, QualityDot, Spinner } from '@/presentation/components/ui/primitives';
import {
  BREAK_LABEL,
  QUALITY,
  SKILL_LABEL,
  ZONE_LABEL,
  describeWind,
  formatLocalClock,
  formatLongDate,
  formatRelativeTime,
  formatScore,
  formatTide,
  capitalize,
  degreesToCompassRange,
} from '@/presentation/lib/format';
import { TIDE_PHASE_LABEL } from '@/domain/models/Tide';
import { cn } from '@/presentation/lib/utils';
import { apiGet } from '@/presentation/lib/api';

interface SpotDrawerProps {
  spotId: string | null;
  /** Date shown first in the day chart (the one selected on the page). */
  initialDate: string;
  today: string;
  currentHour: number;
  onClose: () => void;
  onReport: (spot: Spot) => void;
  /** Bump to refetch the live detail (e.g. after uploading a photo). */
  refreshKey?: number;
}

const CROWD_LABEL: Record<SpotClimatology['crowdFactor'], string> = {
  low: 'Poca gente',
  medium: 'Gente moderada',
  high: 'Mucha gente',
  extreme: 'Masificado',
};

type Load<T> = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: T };

/** Fetches a JSON resource and tracks its lifecycle; resets when the key changes. */
function useResource<T>(url: string | null): Load<T> {
  const [state, setState] = useState<{ url: string | null; load: Load<T> }>({ url, load: { status: 'loading' } });
  const current = state.url === url ? state.load : ({ status: 'loading' } as Load<T>);

  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    apiGet<T>(url, controller.signal)
      .then((data) => setState({ url, load: { status: 'ready', data } }))
      .catch((err: Error) => {
        if (err.name !== 'AbortError') setState({ url, load: { status: 'error', message: err.message } });
      });
    return () => controller.abort();
  }, [url]);

  return current;
}

export function SpotDrawer(props: SpotDrawerProps) {
  if (!props.spotId) return null;
  // Remount per spot so local state (selected day) starts fresh
  return <SpotDrawerPanel key={props.spotId} {...props} spotId={props.spotId} />;
}

function SpotDrawerPanel({ spotId, initialDate, today, currentHour, onClose, onReport, refreshKey = 0 }: SpotDrawerProps & { spotId: string }) {
  const [date, setDate] = useState(initialDate);
  const closeRef = useRef<HTMLButtonElement>(null);
  const detail = useResource<SpotDetailDTO>(`/api/spots/${spotId}${refreshKey ? `?r=${refreshKey}` : ''}`);
  const timeline = useResource<SpotHourlyEvolutionDTO>(`/api/spots/${spotId}/timeline?date=${date}`);
  const climate = useResource<SpotClimatology>(`/api/spots/${spotId}/climatology`);

  useEffect(() => {
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const d = detail.status === 'ready' ? detail.data : null;
  const minDate = addDays(today, -7);
  const maxDate = addDays(today, 6);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="spot-title">
      <button aria-label="Cerrar" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-ink/30 backdrop-blur-[2px] animate-fade-in" />

      <div className="relative flex h-full w-full max-w-3xl flex-col overflow-y-auto bg-sand shadow-2xl animate-slide-in">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-sand/90 px-5 py-3 backdrop-blur sm:px-10">
          <span className="eyebrow">{d ? [...new Set([ZONE_LABEL[d.spot.zone], d.spot.location.municipality])].join(' · ') : 'Cargando'}</span>
          <button
            ref={closeRef}
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full text-ink-2 transition hover:bg-line/70 hover:text-ink"
            aria-label="Cerrar informe"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="px-5 pb-16 pt-8 sm:px-10">
          {detail.status === 'loading' && (
            <div className="flex items-center gap-3 py-24 text-sm text-ink-3">
              <Spinner /> Cargando informe…
            </div>
          )}
          {detail.status === 'error' && <p className="py-24 text-sm text-danger">{detail.message}</p>}

          {d && (
            <article className="animate-fade-in">
              {/* Title */}
              <header>
                <h2 id="spot-title" className="display text-5xl sm:text-6xl">{d.spot.name}</h2>
                <p className="mt-3 text-sm text-ink-3">
                  {BREAK_LABEL[d.spot.breakType]} · {SKILL_LABEL[d.spot.skillLevel]}
                </p>
                <p className="mt-4 max-w-xl leading-relaxed text-ink-2">{d.spot.description}</p>
              </header>

              {/* Now */}
              <Section title="Ahora">
                <NowFigures detail={d} />
              </Section>

              {d.webcam?.iframeUrl && (
                <Section title="Webcam">
                  <WebcamEmbed webcam={d.webcam} spotName={d.spot.name} />
                </Section>
              )}

              <Section title="Por qué esta nota">
                <ScoreBreakdown detail={d} />
              </Section>

              {/* Day */}
              <Section
                title={date === today ? 'Hoy, hora a hora' : capitalize(formatLongDate(date))}
                aside={
                  <div className="flex items-center gap-1">
                    <DayStepButton label="Día anterior" disabled={date <= minDate} onClick={() => setDate(addDays(date, -1))}>
                      <ChevronLeft className="size-4" />
                    </DayStepButton>
                    {date !== today && (
                      <button onClick={() => setDate(today)} className="px-2 text-xs text-ink-2 hover:text-ink">
                        Hoy
                      </button>
                    )}
                    <DayStepButton label="Día siguiente" disabled={date >= maxDate} onClick={() => setDate(addDays(date, 1))}>
                      <ChevronRight className="size-4" />
                    </DayStepButton>
                  </div>
                }
              >
                {timeline.status === 'loading' && <ChartSkeleton />}
                {timeline.status === 'error' && <p className="text-sm text-ink-3">{timeline.message}</p>}
                {timeline.status === 'ready' && (
                  <>
                    <p className="mb-5 text-sm leading-relaxed text-ink-2">
                      {timeline.data.bestWindow ? (
                        <>
                          <span className="text-ink">Mejor ventana:</span> {timeline.data.bestWindow.summary.replace(/^Ventana óptima /, '')}
                        </>
                      ) : (
                        'Sin una ventana clara: el mar no acompaña en las horas de luz.'
                      )}
                    </p>
                    <DayChart data={timeline.data} referenceHour={date === today ? currentHour : undefined} />
                  </>
                )}
              </Section>

              {/* Season */}
              <Section title="Temporada">
                {climate.status === 'loading' && <ChartSkeleton />}
                {climate.status === 'error' && <p className="text-sm text-ink-3">{climate.message}</p>}
                {climate.status === 'ready' && <SeasonSection climate={climate.data} currentMonth={Number(today.slice(5, 7))} />}
              </Section>

              <Section title="Ficha del spot">
                <SpotSpecs detail={d} />
              </Section>

              {/* Community */}
              <Section
                title="Fotos de la comunidad"
                aside={
                  <button
                    onClick={() => onReport(d.spot)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-ink px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-ink hover:text-sand"
                  >
                    <Camera className="size-3.5" /> Subir foto
                  </button>
                }
              >
                <Reports detail={d} />
              </Section>
            </article>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-14">
      <div className="mb-5 flex items-center justify-between gap-4 border-b border-line pb-3">
        <h3 className="text-lg font-medium text-ink">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

function DayStepButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded-full text-ink-2 transition hover:bg-line/70 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

function ChartSkeleton() {
  return <div className="h-52 rounded-lg bg-line/50 animate-pulse-soft" />;
}

function NowFigures({ detail }: { detail: SpotDetailDTO }) {
  const { conditions, score, spot, energy, daylight } = detail;
  const isOffshore = isDirectionInRange(
    conditions.wind.directionDeg,
    spot.idealConditions.favorableWindDegrees.min,
    spot.idealConditions.favorableWindDegrees.max
  );
  const wind = describeWind(conditions.wind.speedKmh, isOffshore);

  return (
    <>
      <div className="mb-8 flex items-baseline gap-4">
        <span className="text-6xl font-medium tracking-tight tabular-nums">{formatScore(score.overallScore)}</span>
        <span className="flex flex-col text-sm text-ink-2">
          <span className="inline-flex items-center gap-1.5 text-ink">
            <QualityDot quality={score.quality} /> {QUALITY[score.quality].label}
          </span>
          {score.recommendation}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3">
        <Figure
          label="Oleaje"
          value={`${conditions.primarySwell.heightM.toFixed(1)} m`}
          detail={
            <>
              {Math.round(conditions.primarySwell.periodSec)} s
              <DirectionArrow degrees={conditions.primarySwell.directionDeg} className="text-ink-3" />
              {conditions.primarySwell.compassDir}
            </>
          }
        />
        <Figure
          label="Viento"
          value={`${Math.round(conditions.wind.speedKmh)} km/h`}
          detail={
            <>
              <DirectionArrow degrees={conditions.wind.directionDeg} className="text-ink-3" />
              {conditions.wind.compassDir} · rachas {Math.round(conditions.wind.gustsKmh)} · {wind.label.toLowerCase()}
            </>
          }
        />
        <Figure
          label="Marea"
          value={conditions.tide ? capitalize(TIDE_PHASE_LABEL[conditions.tide.phase]) : '—'}
          detail={conditions.tide ? `${formatTide(conditions.tide).split(', ')[1]} · ${conditions.tide.heightM >= 0 ? '+' : ''}${conditions.tide.heightM.toFixed(2)} m` : 'sin datos'}
        />
        <Figure
          label="Agua"
          value={conditions.seaSurfaceTemperatureC !== undefined ? `${conditions.seaSurfaceTemperatureC.toFixed(1)} °C` : '—'}
        />
        <Figure
          label="Energía"
          value={`${energy.energyKj.toLocaleString('es-ES')} kJ`}
          detail={energy.source === 'scraped' ? 'Surf-Forecast' : 'estimada con H² · T'}
        />
        {daylight && (
          <Figure
            label="Luz"
            value={
              <span className="inline-flex items-center gap-3 text-xl">
                <span className="inline-flex items-center gap-1"><Sunrise className="size-4 text-ink-3" />{formatLocalClock(daylight.sunrise)}</span>
                <span className="inline-flex items-center gap-1"><Sunset className="size-4 text-ink-3" />{formatLocalClock(daylight.sunset)}</span>
              </span>
            }
          />
        )}
      </dl>
    </>
  );
}

function ScoreBreakdown({ detail }: { detail: SpotDetailDTO }) {
  const { score } = detail;
  const parts = [
    { label: 'Oleaje y dirección', value: score.swellScore, max: 40 },
    { label: 'Viento', value: score.windScore, max: 35 },
    { label: 'Periodo', value: score.periodScore, max: 25 },
  ];
  return (
    <div className="grid gap-10 sm:grid-cols-2">
      <div className="space-y-4">
        {parts.map((p) => (
          <div key={p.label}>
            <div className="flex justify-between text-sm">
              <span className="text-ink-2">{p.label}</span>
              <span className="text-ink tabular-nums">
                {p.value}<span className="text-ink-3">/{p.max}</span>
              </span>
            </div>
            <div className="mt-1.5 h-1 rounded-full bg-accent-soft">
              <div className="h-full rounded-full bg-accent" style={{ width: `${(p.value / p.max) * 100}%` }} />
            </div>
          </div>
        ))}
        {score.tideAdjustment !== 0 && (
          <p className="text-sm text-ink-2">
            Marea: <span className="text-warn tabular-nums">{score.tideAdjustment}</span>
          </p>
        )}
      </div>
      <ul className="space-y-2.5 text-sm">
        {score.pros.map((p) => (
          <li key={p} className="flex gap-2.5 text-ink">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
            <span><span className="sr-only">A favor: </span>{p}</span>
          </li>
        ))}
        {score.cons.map((c) => (
          <li key={c} className="flex gap-2.5 text-ink-2">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full border border-warn" aria-hidden />
            <span><span className="sr-only">En contra: </span>{c}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SeasonSection({ climate, currentMonth }: { climate: SpotClimatology; currentMonth: number }) {
  return (
    <div>
      <p className="text-sm text-ink-3">Mejor época</p>
      <p className="display mt-1 text-3xl">{climate.bestSeasonLabel}</p>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-2">{climate.seasonSummary}</p>
      <div className="mt-8">
        <SeasonChart months={climate.monthlyConsistency} currentMonth={currentMonth} />
      </div>
      <dl className="mt-8 grid gap-x-8 gap-y-5 text-sm sm:grid-cols-2">
        <Spec label="Swell ideal" value={climate.optimalSwellWindow} />
        <Spec label="Viento favorable" value={climate.optimalWindRegime} />
        <Spec label="Marea" value={climate.tideDescription} />
        <Spec label="Ambiente" value={`${CROWD_LABEL[climate.crowdFactor]} en días buenos`} />
      </dl>
      <p className="mt-8 border-l-2 border-accent pl-4 text-sm leading-relaxed text-ink-2">{climate.historicalNotes}</p>
      {climate.riskFactors.length > 0 && (
        <div className="mt-6 rounded-lg bg-warn-soft px-4 py-3 text-sm">
          <p className="font-medium text-warn">Precauciones</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-ink-2">
            {climate.riskFactors.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SpotSpecs({ detail }: { detail: SpotDetailDTO }) {
  const ideal = detail.spot.idealConditions;
  return (
    <dl className="grid gap-x-8 gap-y-5 text-sm sm:grid-cols-2">
      <Spec label="Tamaño que aguanta" value={`${ideal.minSwellHeightM} – ${ideal.maxSwellHeightM} m`} />
      <Spec label="Periodo mínimo" value={`${ideal.minPeriodSec} s`} />
      <Spec label="Dirección de swell" value={degreesToCompassRange(ideal.optimalSwellDegrees)} />
      <Spec label="Viento terral" value={`${degreesToCompassRange(ideal.favorableWindDegrees)} · hasta ${ideal.maxFavorableWindKmh} km/h`} />
      <Spec label="Marea preferida" value={ideal.preferredTide === 'all' ? 'Cualquiera' : capitalize(TIDE_PHASE_LABEL[ideal.preferredTide])} />
      <Spec label="Coordenadas" value={`${detail.spot.location.lat.toFixed(3)}, ${detail.spot.location.lng.toFixed(3)}`} />
    </dl>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-ink-3">{label}</dt>
      <dd className="mt-0.5 text-ink">{value}</dd>
    </div>
  );
}

function Reports({ detail }: { detail: SpotDetailDTO }) {
  const [now] = useState(() => Date.now());
  if (!detail.reports.length) {
    return (
      <p className="text-sm text-ink-3">
        Nadie ha subido fotos en las últimas horas. Si estás en {detail.spot.name.split(' (')[0]}, ayuda al resto con una foto del pico.
      </p>
    );
  }
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {detail.reports.map((r) => (
        <figure key={r.id}>
          {/* eslint-disable-next-line @next/next/no-img-element -- user photos are inline data URLs */}
          <img src={r.photoUrl} alt={`Foto de ${detail.spot.name}`} className="aspect-[4/3] w-full rounded-lg object-cover" loading="lazy" />
          <figcaption className="mt-2 space-y-1 text-xs text-ink-3">
            <span className="flex items-center gap-2">
              {formatRelativeTime(r.capturedAt, now)}
              {r.isRealtimeVerified && (
                <span className={cn('inline-flex items-center gap-1 text-accent')}>
                  <ShieldCheck className="size-3.5" /> Verificada
                </span>
              )}
              {r.conditionSnapshot && (
                <span className="tabular-nums">
                  · {r.conditionSnapshot.waveHeightM.toFixed(1)} m · {Math.round(r.conditionSnapshot.periodSec)} s · {r.conditionSnapshot.windCompass}
                </span>
              )}
            </span>
            {r.userNote && <span className="block text-sm text-ink-2">«{r.userNote}»</span>}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
