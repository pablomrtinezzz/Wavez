'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { SpotHourlyEvolutionDTO, HourlyEvolutionPoint } from '@/application/usecases/GetSpotHourlyEvolutionUseCase';
import { DirectionCompass } from './telemetry/DirectionCompass';
import { getScoreColor, formatScoreToTen, cn } from '@/presentation/lib/utils';
import {
  Waves,
  Wind,
  Zap,
  Clock,
  Sparkles,
  AlertCircle,
  ArrowUp,
  Activity,
  Maximize2,
} from 'lucide-react';

interface HourlyEvolutionChartProps {
  spotId: string;
  dateStr: string;
}

/**
 * Builds a natural Catmull-Rom cubic bezier spline through points
 */
function getSmoothSplinePath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let path = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const current = pts[i];
    const next = pts[i + 1];
    const prev = pts[i - 1] || current;
    const nextNext = pts[i + 2] || next;

    const cp1x = current.x + (next.x - prev.x) / 6;
    const cp1y = current.y + (next.y - prev.y) / 6;
    const cp2x = next.x - (nextNext.x - current.x) / 6;
    const cp2y = next.y - (nextNext.y - current.y) / 6;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
  }
  return path;
}

export const HourlyEvolutionChart: React.FC<HourlyEvolutionChartProps> = ({
  spotId,
  dateStr,
}) => {
  const [data, setData] = useState<SpotHourlyEvolutionDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeHourIndex, setActiveHourIndex] = useState<number>(9); // Default to 09:00
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/spots/${spotId}/timeline?date=${dateStr}`)
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return;
        if (json.success) {
          setData(json.data);
          if (json.data.bestWindow) {
            setActiveHourIndex(json.data.bestWindow.startHour);
          }
        } else {
          setError(json.error || 'No se pudieron cargar los datos horarios');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Error de red');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [spotId, dateStr]);

  const activePoint: HourlyEvolutionPoint | null = useMemo(() => {
    if (!data || !data.hourlyPoints.length) return null;
    return data.hourlyPoints.find((p) => p.hour === activeHourIndex) || data.hourlyPoints[0];
  }, [data, activeHourIndex]);

  // Chart Dimensions
  const chartHeight = 140;
  const chartWidth = 760;
  const paddingX = 24;
  const paddingY = 22;
  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;

  const heights = data?.hourlyPoints.map((p) => p.waveHeightM) || [1];
  const maxHeight = Math.max(...heights, 0.6);
  const minHeight = Math.min(...heights, 0);
  const range = maxHeight - minHeight || 1;

  // Build SVG Points
  const svgPoints = useMemo(() => {
    if (!data || !data.hourlyPoints.length) return [];
    return data.hourlyPoints.map((p, i) => {
      const x = paddingX + (i / (data.hourlyPoints.length - 1)) * innerWidth;
      const y = chartHeight - paddingY - ((p.waveHeightM - minHeight) / range) * innerHeight;
      return { x, y, point: p, index: i };
    });
  }, [data, innerWidth, innerHeight, minHeight, range]);

  const smoothCurve = useMemo(() => {
    return getSmoothSplinePath(svgPoints);
  }, [svgPoints]);

  const areaPath = useMemo(() => {
    if (!svgPoints.length) return '';
    return `${smoothCurve} L ${svgPoints[svgPoints.length - 1].x} ${chartHeight} L ${svgPoints[0].x} ${chartHeight} Z`;
  }, [smoothCurve, svgPoints]);

  // Active point coordinates on the SVG canvas
  const activeSvgPoint = useMemo(() => {
    return svgPoints.find((p) => p.point.hour === activeHourIndex) || svgPoints[0];
  }, [svgPoints, activeHourIndex]);

  // Stock-market scrubber handler (touch & mouse)
  const handlePointerScrub = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!svgRef.current || !data || !data.hourlyPoints.length) return;
      const rect = svgRef.current.getBoundingClientRect();
      const relativeX = (e.clientX - rect.left) / rect.width;
      const clampedX = Math.min(1, Math.max(0, relativeX));

      // Map to 0-23 hours
      const targetIndex = Math.round(clampedX * (data.hourlyPoints.length - 1));
      const targetPoint = data.hourlyPoints[targetIndex];

      if (targetPoint && targetPoint.hour !== activeHourIndex) {
        setActiveHourIndex(targetPoint.hour);
      }

      setIsHovering(true);
      const matchedSvgPt = svgPoints[targetIndex];
      if (matchedSvgPt) {
        setCursorPos({ x: matchedSvgPt.x, y: matchedSvgPt.y });
      }
    },
    [data, activeHourIndex, svgPoints]
  );

  const handlePointerLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  if (loading) {
    return (
      <div className="w-full p-8 flex flex-col items-center justify-center text-center space-y-3 bg-slate-950/60 rounded-2xl border border-white/5 animate-pulse">
        <Waves className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="text-sm text-slate-400">Analizando telemetría y evolución horaria 24h...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full p-6 text-center bg-slate-950/60 rounded-2xl border border-rose-500/20 text-rose-300 space-y-2">
        <AlertCircle className="w-6 h-6 mx-auto text-rose-400" />
        <p className="text-sm font-medium">{error || 'Datos no disponibles para esta fecha'}</p>
      </div>
    );
  }

  const scoreTokens = activePoint ? getScoreColor(activePoint.score.overallScore) : getScoreColor(50);

  return (
    <div className="w-full space-y-4 select-none">
      {/* Best Window Highlight Callout */}
      {data.bestWindow && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-emerald-950/70 border border-cyan-500/30 flex items-start space-x-3 shadow-lg">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                Mejor Momento del Día
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Score {data.bestWindow.peakScore.toFixed(1)} / 10
              </span>
            </div>
            <p className="text-xs text-slate-200 mt-1 leading-relaxed">
              {data.bestWindow.summary}
            </p>
          </div>
        </div>
      )}

      {/* Financial/Stock Market Interactive Chart Container */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-950/90 border border-white/10 relative overflow-hidden shadow-2xl backdrop-blur-xl">
        {/* Dynamic Telemetry HUD Ticker (Top Bar) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-2 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Telemetría en Vivo
            </span>
            <span className="px-2.5 py-0.5 rounded-lg bg-cyan-950/80 border border-cyan-700/60 font-mono text-cyan-300 font-extrabold text-xs">
              {activePoint?.timeLabel}
            </span>
          </div>

          {/* Live Values Ticker */}
          {activePoint && (
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1.5 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-white/5">
                <Waves className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-black text-white tabular-nums">{activePoint.waveHeightM}m</span>
                <span className="text-slate-400 text-[11px]">@ {activePoint.periodSec}s</span>
              </div>

              <div className="flex items-center space-x-1.5 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-white/5">
                <Wind className="w-3.5 h-3.5 text-teal-400" />
                <span className="font-black text-white tabular-nums">{activePoint.windSpeedKmh}</span>
                <span className="text-slate-400 text-[11px]">km/h {activePoint.windCompassDir}</span>
              </div>

              <div
                className={cn(
                  'flex items-center space-x-1 px-2.5 py-1 rounded-lg border text-xs font-black shadow-sm',
                  scoreTokens.bg,
                  scoreTokens.text,
                  scoreTokens.border
                )}
              >
                <span>{activePoint.score.scoreOutOfTen.toFixed(1)}</span>
                <span className="text-[10px] opacity-80 uppercase">/ 10</span>
              </div>
            </div>
          )}
        </div>

        {/* Instructions banner on hover */}
        <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
          <span className="flex items-center space-x-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping mr-1" />
            <span>Desliza el puntero o dedo sobre la gráfica para inspeccionar minuto a minuto</span>
          </span>
          <span className="font-mono text-slate-400">00:00 → 23:00</span>
        </div>

        {/* SVG Chart Area with Touch/Pointer Crosshair */}
        <div className="relative w-full touch-none select-none">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-36 sm:h-44 cursor-crosshair overflow-visible"
            preserveAspectRatio="none"
            onPointerMove={handlePointerScrub}
            onPointerDown={handlePointerScrub}
            onPointerLeave={handlePointerLeave}
          >
            <defs>
              {/* Oceanic Gradient */}
              <linearGradient id={`grad-surf-${spotId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#0284c7" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0.0" />
              </linearGradient>

              {/* Glowing Drop-shadow filter */}
              <filter id="glow-wave" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Horizontal Grid lines */}
            <line
              x1={paddingX}
              y1={paddingY}
              x2={chartWidth - paddingX}
              y2={paddingY}
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="4 6"
            />
            <line
              x1={paddingX}
              y1={chartHeight / 2}
              x2={chartWidth - paddingX}
              y2={chartHeight / 2}
              stroke="rgba(255,255,255,0.04)"
              strokeDasharray="4 6"
            />
            <line
              x1={paddingX}
              y1={chartHeight - paddingY}
              x2={chartWidth - paddingX}
              y2={chartHeight - paddingY}
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="4 6"
            />

            {/* Area Fill */}
            <path d={areaPath} fill={`url(#grad-surf-${spotId})`} />

            {/* Smooth Spline Curve */}
            <path
              d={smoothCurve}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow-wave)"
            />

            {/* Daylight Window Background highlight (07:00 - 20:00) */}
            {svgPoints.length >= 21 && (
              <rect
                x={svgPoints[7].x}
                y={paddingY}
                width={svgPoints[20].x - svgPoints[7].x}
                height={chartHeight - paddingY * 2}
                fill="rgba(251, 191, 36, 0.03)"
                stroke="rgba(251, 191, 36, 0.12)"
                strokeDasharray="3 3"
                className="pointer-events-none"
              />
            )}

            {/* Crosshair Vertical Line (Estilo Bolsa) */}
            {activeSvgPoint && (
              <g className="transition-all duration-75">
                <line
                  x1={activeSvgPoint.x}
                  y1={0}
                  x2={activeSvgPoint.x}
                  y2={chartHeight}
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  className="pointer-events-none"
                />

                {/* Pulsating target circle on the curve */}
                <circle
                  cx={activeSvgPoint.x}
                  cy={activeSvgPoint.y}
                  r="7"
                  className="fill-cyan-400/30 animate-ping pointer-events-none"
                />
                <circle
                  cx={activeSvgPoint.x}
                  cy={activeSvgPoint.y}
                  r="5"
                  className="fill-cyan-300 stroke-slate-950 stroke-2 pointer-events-none"
                />
              </g>
            )}

            {/* Invisible Hit Slits for each hour */}
            {svgPoints.map((pt) => (
              <rect
                key={pt.point.hour}
                x={pt.x - innerWidth / 48}
                y={0}
                width={innerWidth / 24}
                height={chartHeight}
                fill="transparent"
                className="cursor-pointer"
                onClick={() => setActiveHourIndex(pt.point.hour)}
              />
            ))}
          </svg>

          {/* Floating Crosshair Tooltip (Clamped to avoid screen overflow) */}
          {activeSvgPoint && activePoint && (
            <div
              className="absolute pointer-events-none transition-all duration-100 z-30"
              style={{
                left: `${(activeSvgPoint.x / chartWidth) * 100}%`,
                top: `${Math.max(8, (activeSvgPoint.y / chartHeight) * 100 - 45)}%`,
                transform:
                  activeSvgPoint.x > chartWidth - 120
                    ? 'translate(-105%, -50%)'
                    : activeSvgPoint.x < 120
                    ? 'translate(5%, -50%)'
                    : 'translate(-50%, -100%)',
              }}
            >
              <div className="bg-slate-950/95 border border-cyan-500/40 px-3 py-2 rounded-xl shadow-2xl backdrop-blur-xl flex flex-col space-y-0.5 text-center whitespace-nowrap min-w-[110px]">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold text-cyan-300 pb-0.5 border-b border-white/10">
                  <span>{activePoint.timeLabel}</span>
                  <span className={scoreTokens.text}>{activePoint.score.scoreOutOfTen.toFixed(1)}/10</span>
                </div>
                <div className="text-xs font-black text-white tabular-nums">
                  {activePoint.waveHeightM}m · {activePoint.periodSec}s
                </div>
                <div className="text-[10px] text-slate-400 tabular-nums">
                  {activePoint.windSpeedKmh} km/h {activePoint.windCompassDir}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 24h Hourly Scrub Strip (Pills with Arrow & Score) */}
        <div className="flex justify-between items-center mt-3 overflow-x-auto pb-1 scrollbar-none gap-1">
          {data.hourlyPoints.map((p) => {
            const isActive = p.hour === activeHourIndex;
            const ptScoreColor = getScoreColor(p.score.overallScore);

            return (
              <button
                key={p.hour}
                onClick={() => setActiveHourIndex(p.hour)}
                className={cn(
                  'flex flex-col items-center py-2 px-1 rounded-xl text-center transition-all min-w-[36px] sm:min-w-[40px] flex-1 border',
                  isActive
                    ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold scale-105 shadow-md shadow-cyan-950/50'
                    : 'bg-slate-950/40 hover:bg-slate-900 border-white/5 text-slate-400 hover:text-slate-200'
                )}
              >
                <span className="text-[10px] font-mono tabular-nums">{p.timeLabel}</span>

                {/* Swell Height */}
                <span className="text-xs font-black text-slate-200 tabular-nums my-0.5">
                  {p.waveHeightM}m
                </span>

                {/* Mini Wind Compass Arrow */}
                <div
                  className="w-3.5 h-3.5 my-0.5 flex items-center justify-center text-slate-400"
                  style={{ transform: `rotate(${p.windDirectionDeg}deg)` }}
                  title={`Viento ${p.windCompassDir} (${p.windSpeedKmh} km/h)`}
                >
                  <ArrowUp className="w-3 h-3 text-cyan-400" />
                </div>

                {/* Tiny Score Pill */}
                <span
                  className={cn(
                    'w-full text-[9px] font-black rounded px-0.5 py-0.2 mt-0.5 border',
                    ptScoreColor.bg,
                    ptScoreColor.text,
                    ptScoreColor.border
                  )}
                >
                  {p.score.scoreOutOfTen.toFixed(1)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Synchronized Detailed Inspector Card */}
      {activePoint && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-slate-300">Detalle Completo a las</span>
              <span className="text-sm font-black text-white font-mono bg-slate-800 px-2 py-0.5 rounded-lg border border-white/5">
                {activePoint.timeLabel}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Calidad:</span>
              <span
                className={cn(
                  'text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-full border',
                  scoreTokens.bg,
                  scoreTokens.text,
                  scoreTokens.border
                )}
              >
                {activePoint.score.scoreOutOfTen.toFixed(1)} / 10 · {activePoint.score.quality.toUpperCase()}
              </span>
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Swell */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
                <Waves className="w-3 h-3 text-cyan-400" />
                <span>Oleaje</span>
              </span>
              <p className="text-base font-black text-white tabular-nums mt-1">
                {activePoint.waveHeightM}m <span className="text-xs text-slate-400 font-normal">@ {activePoint.periodSec}s</span>
              </p>
              <div className="mt-1">
                <DirectionCompass
                  degrees={activePoint.directionDeg}
                  compassDir={activePoint.compassDir}
                  type="swell"
                  size="sm"
                />
              </div>
            </div>

            {/* Energy */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Energía</span>
              </span>
              <p className="text-base font-black text-amber-300 tabular-nums mt-1">
                {activePoint.energyKj.toLocaleString('es-ES')} <span className="text-xs text-slate-400 font-normal">kJ</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Potencia de rompiente
              </p>
            </div>

            {/* Wind */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
                <Wind className="w-3 h-3 text-teal-400" />
                <span>Viento</span>
              </span>
              <p className="text-base font-black text-white tabular-nums mt-1">
                {activePoint.windSpeedKmh} <span className="text-xs text-slate-400 font-normal">km/h</span>
              </p>
              <div className="mt-1">
                <DirectionCompass
                  degrees={activePoint.windDirectionDeg}
                  compassDir={activePoint.windCompassDir}
                  type="wind"
                  size="sm"
                />
              </div>
            </div>

            {/* Recommendation */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Diagnóstico</span>
              <p className="text-xs font-semibold text-slate-200 mt-1 line-clamp-2 leading-tight">
                {activePoint.score.recommendation}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
