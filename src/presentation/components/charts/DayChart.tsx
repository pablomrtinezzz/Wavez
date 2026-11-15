'use client';

import React, { useMemo, useState } from 'react';
import { SpotHourlyEvolutionDTO } from '@/application/usecases/GetSpotHourlyEvolutionUseCase';
import { localHourOf } from '@/domain/models/LocalTime';
import { DirectionArrow, QualityDot, useElementWidth } from '@/presentation/components/ui/primitives';
import { QUALITY, formatHour, formatScore, formatTide } from '@/presentation/lib/format';

interface DayChartProps {
  data: SpotHourlyEvolutionDTO;
  /** Hour highlighted when the pointer is not over the chart (e.g. "now"). */
  referenceHour?: number;
}

const HEIGHT = 200;
const PAD = { top: 24, right: 12, bottom: 24, left: 46 };

function niceStep(max: number): number {
  if (max <= 1) return 0.25;
  if (max <= 2.5) return 0.5;
  if (max <= 5) return 1;
  return 2;
}

/**
 * Single-series wave height over the day. Daylight, the best window and the
 * hover crosshair are drawn as recessive context; quality and wind ride in
 * aligned strips below so the chart keeps one y-axis.
 */
export function DayChart({ data, referenceHour }: DayChartProps) {
  const [containerRef, width] = useElementWidth<HTMLDivElement>();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const points = data.hourlyPoints;

  const referenceIdx = useMemo(() => {
    if (referenceHour !== undefined) {
      const i = points.findIndex((p) => p.hour === referenceHour);
      if (i >= 0) return i;
    }
    if (data.bestWindow) {
      const i = points.findIndex((p) => p.hour === data.bestWindow!.startHour);
      if (i >= 0) return i;
    }
    return 0;
  }, [points, referenceHour, data.bestWindow]);

  const activeIdx = hoverIdx ?? referenceIdx;
  const active = points[activeIdx];

  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const maxH = Math.max(0.5, ...points.map((p) => p.waveHeightM));
  const step = niceStep(maxH);
  const yMax = Math.ceil((maxH * 1.1) / step) * step;
  const ticks = Array.from({ length: Math.round(yMax / step) + 1 }, (_, i) => +(i * step).toFixed(2));

  // x maps hour-of-day (0..24) so gaps in the data stay honest
  const x = (hour: number) => PAD.left + (hour / 23) * innerW;
  const y = (h: number) => PAD.top + innerH - (h / yMax) * innerH;

  const linePath = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.hour).toFixed(1)},${y(p.waveHeightM).toFixed(1)}`).join(' ');
  const areaPath = points.length
    ? `${linePath} L${x(points[points.length - 1].hour).toFixed(1)},${y(0)} L${x(points[0].hour).toFixed(1)},${y(0)} Z`
    : '';

  const sunriseH = data.daylight ? localHourOf(data.daylight.sunrise) + Number(data.daylight.sunrise.slice(14, 16)) / 60 : 7;
  const sunsetH = data.daylight ? localHourOf(data.daylight.sunset) + Number(data.daylight.sunset.slice(14, 16)) / 60 : 19;
  const xHour = (h: number) => PAD.left + (Math.min(23, Math.max(0, h)) / 23) * innerW;

  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const hour = ((e.clientX - rect.left - PAD.left) / innerW) * 23;
    let best = 0;
    points.forEach((p, i) => {
      if (Math.abs(p.hour - hour) < Math.abs(points[best].hour - hour)) best = i;
    });
    setHoverIdx(best);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const delta = e.key === 'ArrowLeft' ? -1 : 1;
    setHoverIdx(Math.min(points.length - 1, Math.max(0, activeIdx + delta)));
  };

  const labelEvery = width < 480 ? 6 : 3;

  return (
    <div className="select-none">
      {/* Readout that follows the crosshair */}
      {active && (
        <div className="mb-3 flex min-h-10 flex-wrap items-baseline gap-x-5 gap-y-1 text-sm" aria-live="polite">
          <span className="font-medium text-ink tabular-nums">{formatHour(active.hour)}</span>
          <span className="inline-flex items-center gap-1 text-ink tabular-nums">
            {active.waveHeightM.toFixed(1)} m · {active.periodSec} s
            <DirectionArrow degrees={active.directionDeg} className="text-ink-3" />
            <span className="text-ink-2">{active.compassDir}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-ink-2 tabular-nums">
            Viento {active.windSpeedKmh} km/h
            <DirectionArrow degrees={active.windDirectionDeg} className="text-ink-3" />
            {active.windCompassDir}
          </span>
          {active.tide && <span className="text-ink-2">Marea {formatTide(active.tide).toLowerCase()}</span>}
          <span className="inline-flex items-center gap-1.5 text-ink-2">
            <QualityDot quality={active.score.quality} />
            {formatScore(active.score.overallScore)} · {QUALITY[active.score.quality].label}
          </span>
        </div>
      )}
      <div ref={containerRef} className="relative">
        {width > 0 && (
          <svg
            width={width}
            height={HEIGHT}
            className="block cursor-crosshair touch-pan-y outline-none"
            onPointerMove={handlePointer}
            onPointerDown={handlePointer}
            onPointerLeave={() => setHoverIdx(null)}
            onKeyDown={handleKey}
            tabIndex={0}
            role="img"
            aria-label={`Altura de ola por hora el ${data.date}. Usa las flechas para recorrer las horas.`}
          >
            {/* Night */}
            <rect x={PAD.left} y={PAD.top} width={Math.max(0, xHour(sunriseH) - PAD.left)} height={innerH} fill="var(--color-sand)" />
            <rect x={xHour(sunsetH)} y={PAD.top} width={Math.max(0, PAD.left + innerW - xHour(sunsetH))} height={innerH} fill="var(--color-sand)" />

            {/* Best window */}
            {data.bestWindow && (
              <g>
                <rect
                  x={xHour(data.bestWindow.startHour)}
                  y={PAD.top}
                  width={Math.max(2, xHour(data.bestWindow.endHour - 1) - xHour(data.bestWindow.startHour))}
                  height={innerH}
                  fill="var(--color-accent-soft)"
                />
                <text x={xHour(data.bestWindow.startHour) + 4} y={PAD.top - 8} fontSize="11" fill="var(--color-accent)">
                  Mejor ventana
                </text>
              </g>
            )}

            {/* Grid + y-axis */}
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={PAD.left + innerW} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeWidth="1" />
                <text x={PAD.left - 8} y={y(t) + 3.5} fontSize="10.5" textAnchor="end" fill="var(--color-ink-3)" className="tabular-nums">
                  {t === 0 ? '0' : `${t}`}
                </text>
              </g>
            ))}
            <text x={PAD.left - 8} y={PAD.top - 8} fontSize="10.5" textAnchor="end" fill="var(--color-ink-3)">
              m
            </text>

            {/* X labels */}
            {points
              .filter((p) => p.hour % labelEvery === 0)
              .map((p) => (
                <text key={p.hour} x={x(p.hour)} y={HEIGHT - 6} fontSize="10.5" textAnchor="middle" fill="var(--color-ink-3)" className="tabular-nums">
                  {String(p.hour).padStart(2, '0')}
                </text>
              ))}

            {/* Series */}
            <path d={areaPath} fill="var(--color-accent)" fillOpacity="0.1" />
            <path d={linePath} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

            {/* Crosshair */}
            {active && (
              <g pointerEvents="none">
                <line x1={x(active.hour)} x2={x(active.hour)} y1={PAD.top} y2={PAD.top + innerH} stroke="var(--color-ink)" strokeOpacity="0.35" strokeWidth="1" />
                <circle cx={x(active.hour)} cy={y(active.waveHeightM)} r="4.5" fill="var(--color-accent)" stroke="var(--color-paper)" strokeWidth="2" />
              </g>
            )}
          </svg>
        )}

      </div>

      {/* Aligned strips: quality and wind per hour */}
      {width > 0 && (
        <div className="mt-2 space-y-1.5" aria-hidden>
          <Strip label="Calidad" width={width} points={points} x={x} activeIdx={activeIdx}>
            {(p) => (
              <span className="block h-2 w-full rounded-[2px]" style={{ background: QUALITY[p.score.quality].color }} />
            )}
          </Strip>
          <Strip label="Viento" width={width} points={points} x={x} activeIdx={activeIdx} every={width < 480 ? 2 : 1}>
            {(p) => (
              <span className="flex flex-col items-center text-[10px] leading-none text-ink-2 tabular-nums">
                <DirectionArrow degrees={p.windDirectionDeg} className="size-3 text-ink-3" />
                <span className="mt-0.5">{p.windSpeedKmh}</span>
              </span>
            )}
          </Strip>
        </div>
      )}

      {/* Accessible table view */}
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-ink-3 hover:text-ink">Ver datos en tabla</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-xs tabular-nums">
            <thead className="text-ink-3">
              <tr className="border-b border-line">
                <th className="py-1.5 font-normal">Hora</th>
                <th className="font-normal">Ola</th>
                <th className="font-normal">Periodo</th>
                <th className="font-normal">Viento</th>
                <th className="font-normal">Marea</th>
                <th className="font-normal">Nota</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.hour} className="border-b border-line/60 text-ink-2">
                  <td className="py-1.5 text-ink">{formatHour(p.hour)}</td>
                  <td>{p.waveHeightM.toFixed(1)} m {p.compassDir}</td>
                  <td>{p.periodSec} s</td>
                  <td>{p.windSpeedKmh} km/h {p.windCompassDir}</td>
                  <td>{p.tide ? formatTide(p.tide) : '—'}</td>
                  <td>{formatScore(p.score.overallScore)} · {QUALITY[p.score.quality].label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function Strip({
  label,
  width,
  points,
  x,
  activeIdx,
  every = 1,
  children,
}: {
  label: string;
  width: number;
  points: SpotHourlyEvolutionDTO['hourlyPoints'];
  x: (hour: number) => number;
  activeIdx: number;
  every?: number;
  children: (p: SpotHourlyEvolutionDTO['hourlyPoints'][number]) => React.ReactNode;
}) {
  const innerW = width - PAD.left - PAD.right;
  // 2px surface gap between neighbouring cells
  const cell = Math.max(4, innerW / 23 - 2);
  return (
    <div className="relative h-6" style={{ width }}>
      <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[10px] text-ink-3">{label}</span>
      {points.map((p, i) =>
        i % every === 0 ? (
          <span
            key={p.hour}
            className="absolute top-1/2 flex -translate-y-1/2 justify-center transition-opacity"
            style={{ left: x(p.hour) - cell / 2, width: cell, opacity: i === activeIdx ? 1 : 0.85 }}
          >
            {children(p)}
          </span>
        ) : null
      )}
    </div>
  );
}
