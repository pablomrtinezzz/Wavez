'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { SpotSummaryDTO } from '@/application/dtos/SpotSummaryDTO';
import { isDirectionInRange } from '@/domain/models/MarineConditions';
import { DirectionArrow, Figure, QualityDot } from '@/presentation/components/ui/primitives';
import { QUALITY, describeWind, formatHour, formatLongDate, formatScore, formatTide } from '@/presentation/lib/format';
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
    <section className="animate-fade-in" aria-labelledby="hero-title">
      <p className="text-base text-ink-2 sm:text-lg">{headline(selection, today, currentHour, isFlat)}</p>
      <h1 id="hero-title" className="display mt-2 text-[clamp(3rem,9vw,6.5rem)] text-ink">
        <button onClick={() => onSelectSpot(spot.id)} className="text-left hover:text-accent transition-colors">
          {spot.name}
        </button>
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-2 sm:text-lg">
        <span className="inline-flex items-center gap-2 text-ink">
          <QualityDot quality={score.quality} className="size-2.5" />
          {QUALITY[score.quality].label}, {formatScore(score.overallScore)} sobre 10.
        </span>{' '}
        {score.pros.slice(0, 2).join('. ')}
        {score.pros.length ? '.' : ''}
        {score.cons[0] && <> Ojo: {score.cons[0].charAt(0).toLowerCase() + score.cons[0].slice(1)}.</>}
      </p>

      <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-line pt-8 sm:grid-cols-3 lg:grid-cols-5">
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
          detail={top.energy.source === 'scraped' ? 'Surf-Forecast' : 'estimada'}
        />
      </dl>

      <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
        <button
          onClick={() => onSelectSpot(spot.id)}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-sand transition hover:bg-accent"
        >
          Ver informe de {spot.name.split(' (')[0]} <ArrowRight className="size-4" />
        </button>
        {runnersUp.length > 0 && (
          <p className="text-sm text-ink-3">
            También:{' '}
            {runnersUp.map((s, i) => (
              <React.Fragment key={s.spot.id}>
                {i > 0 && ', '}
                <button onClick={() => onSelectSpot(s.spot.id)} className="text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink hover:decoration-ink">
                  {s.spot.name.split(' (')[0]}
                </button>{' '}
                <span className="tabular-nums">{formatScore(s.score.overallScore)}</span>
              </React.Fragment>
            ))}
          </p>
        )}
      </div>
    </section>
  );
}
