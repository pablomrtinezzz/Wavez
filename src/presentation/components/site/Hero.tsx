'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { SpotSummaryDTO } from '@/application/dtos/SpotSummaryDTO';
import { isDirectionInRange } from '@/domain/models/MarineConditions';
import { DataDisclaimer, DirectionArrow, Figure, ScoreBadge } from '@/presentation/components/ui/primitives';
import { QUALITY, describeWind, formatHour, formatLongDate, formatTide } from '@/presentation/lib/format';
import { TimeSelection } from './TimeControl';

interface HeroProps {
  summaries: SpotSummaryDTO[];
  selection: TimeSelection;
  today: string;
  currentHour: number;
  onSelectSpot: (spotId: string) => void;
}

function headline(selection: TimeSelection, today: string, currentHour: number, isFlat: boolean): string {
  if (selection.isLive) return isFlat ? 'Hoy la isla está casi plato. Lo más aprovechable' : 'Ahora mismo, la mejor ola está en';
  const when =
    selection.dateStr === today ? `Hoy a las ${formatHour(selection.hour)}` : `El ${formatLongDate(selection.dateStr)} a las ${formatHour(selection.hour)}`;
  const isPast = selection.dateStr < today || (selection.dateStr === today && selection.hour < currentHour);
  const tense = isPast ? 'fue' : 'será';
  return isFlat ? `${when}, poca cosa. Lo más aprovechable` : `${when}, lo mejor ${tense}`;
}

export function Hero({ summaries, selection, today, currentHour, onSelectSpot }: HeroProps) {
  const ranked = [...summaries].sort((a, b) => b.score.overallScore - a.score.overallScore);
  const top = ranked[0];
  if (!top) return null;

  const { spot, conditions, score } = top;
  const isFlat = score.quality === 'flat' || score.quality === 'poor';
  const isOffshore = isDirectionInRange(
    conditions.wind.directionDeg,
    spot.idealConditions.favorableWindDegrees.min,
    spot.idealConditions.favorableWindDegrees.max
  );
  const wind = describeWind(conditions.wind.speedKmh, isOffshore);
  const runnersUp = ranked.slice(1, 4).filter((s) => s.score.quality !== 'flat');

  return (
    <section
      className="relative isolate overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,var(--color-ocean-deep),var(--color-ocean)_70%)] px-6 py-10 text-sand animate-fade-in sm:px-12 sm:py-14"
      aria-labelledby="hero-title"
    >
      {/* Sun and swell lines, purely decorative */}
      <span aria-hidden className="pointer-events-none absolute right-6 top-6 -z-10 size-16 rounded-full bg-sun sm:right-10 sm:top-10 sm:size-24" />
      <svg aria-hidden viewBox="0 0 1200 200" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 w-full opacity-25">
        <path d="M0 120C150 120 220 60 400 60S650 140 800 140 1050 80 1200 90" fill="none" stroke="var(--color-sand)" strokeWidth="2" />
        <path d="M0 160C180 160 260 110 430 110S680 175 840 175 1060 130 1200 135" fill="none" stroke="var(--color-sand)" strokeWidth="2" />
      </svg>

      <p className="pr-20 text-base text-sand/75 sm:pr-32 sm:text-lg">{headline(selection, today, currentHour, isFlat)}</p>
      <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-4 lg:pr-32">
        <h1 id="hero-title" className="display text-[clamp(2.75rem,8vw,6rem)] text-sand">
          <button onClick={() => onSelectSpot(spot.id)} className="text-left transition-opacity hover:opacity-80">
            {spot.name}
          </button>
        </h1>
        <ScoreBadge score={score.overallScore} quality={score.quality} size="lg" className="mb-2 shadow-lg shadow-black/20" />
      </div>
      <p className="mt-5 max-w-2xl text-base leading-relaxed text-sand/80 sm:text-lg">
        <span className="font-medium text-sand">{QUALITY[score.quality].label}.</span>{' '}
        {score.pros.slice(0, 2).join('. ')}
        {score.pros.length ? '.' : ''}
        {score.cons[0] && <> Ojo: {score.cons[0].charAt(0).toLowerCase() + score.cons[0].slice(1)}.</>}
      </p>

      <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-7 border-t border-sand/15 pt-8 sm:grid-cols-3 lg:grid-cols-5 [&_dd]:text-sand [&_dt]:text-sand/60 [&_dd+dd]:text-sand/70">
        <Figure
          label="Oleaje"
          value={`${conditions.primarySwell.heightM.toFixed(1)} m`}
          detail={
            <>
              {Math.round(conditions.primarySwell.periodSec)} s
              <DirectionArrow degrees={conditions.primarySwell.directionDeg} />
              {conditions.primarySwell.compassDir}
            </>
          }
        />
        <Figure
          label="Viento"
          value={`${Math.round(conditions.wind.speedKmh)} km/h`}
          detail={
            <>
              <DirectionArrow degrees={conditions.wind.directionDeg} />
              {conditions.wind.compassDir} · {wind.label.toLowerCase()}
            </>
          }
        />
        <Figure
          label="Marea"
          value={conditions.tide ? formatTide(conditions.tide).split(',')[0] : '—'}
          detail={conditions.tide ? formatTide(conditions.tide).split(', ')[1] : 'sin datos'}
        />
        <Figure
          label="Agua"
          value={conditions.seaSurfaceTemperatureC !== undefined ? `${conditions.seaSurfaceTemperatureC.toFixed(1)} °C` : '—'}
          detail={
            conditions.seaSurfaceTemperatureC === undefined
              ? 'sin datos'
              : conditions.seaSurfaceTemperatureC >= 22
              ? 'neopreno 3/2 o shorty'
              : conditions.seaSurfaceTemperatureC >= 19
              ? 'neopreno 3/2'
              : 'neopreno 4/3'
          }
        />
        <Figure
          label="Energía"
          value={`${top.energy.energyKj.toLocaleString('es-ES')} kJ`}
          detail="índice H² · T"
        />
      </dl>

      <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
        <button
          onClick={() => onSelectSpot(spot.id)}
          className="inline-flex items-center gap-2 rounded-full bg-sun px-5 py-3 text-sm font-medium text-ink transition hover:bg-sand"
        >
          Webcam y previsión de {spot.name.split(' (')[0]} <ArrowRight className="size-4" />
        </button>
        {runnersUp.length > 0 && (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-sand/70">
            También:
            {runnersUp.map((s) => (
              <button
                key={s.spot.id}
                onClick={() => onSelectSpot(s.spot.id)}
                className="inline-flex items-center gap-2 rounded-full bg-sand/10 py-1 pl-1 pr-3 text-sand transition hover:bg-sand/20"
              >
                <ScoreBadge score={s.score.overallScore} quality={s.score.quality} size="sm" className="h-6 w-9 rounded-full text-xs" />
                {s.spot.name.split(' (')[0]}
              </button>
            ))}
          </p>
        )}
      </div>

      <DataDisclaimer tone="dark" className="mt-8 max-w-2xl" />
    </section>
  );
}
