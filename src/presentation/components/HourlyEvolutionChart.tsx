'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { SpotHourlyEvolutionDTO, HourlyEvolutionPoint } from '@/application/usecases/GetSpotHourlyEvolutionUseCase';
import { DirectionCompass } from './telemetry/DirectionCompass';
import { ScoreRadialGauge } from './telemetry/ScoreRadialGauge';
import { getScoreColor, cn } from '@/presentation/lib/utils';
import {
  Waves,
  Wind,
  Zap,
  Clock,
  Sparkles,
  AlertCircle,
  TrendingUp,
  Compass,
  ArrowUp,
} from 'lucide-react';

interface HourlyEvolutionChartProps {
  spotId: string;
  dateStr: string;
}

export const HourlyEvolutionChart: React.FC<HourlyEvolutionChartProps> = ({
  spotId,
  dateStr,
}) => {
  const [data, setData] = useState<SpotHourlyEvolutionDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeHourIndex, setActiveHourIndex] = useState<number>(9); // Default to 09:00

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
          // Set active to best window start or 09:00
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

  // SVG Chart Dimensions
  const chartHeight = 120;
  const chartWidth = 720;
  const paddingX = 20;
  const paddingY = 15;
  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;

  const heights = data.hourlyPoints.map((p) => p.waveHeightM);
  const maxHeight = Math.max(...heights, 0.5);
  const minHeight = Math.min(...heights, 0);
  const range = maxHeight - minHeight || 1;

  // Build SVG Points
  const svgPoints = data.hourlyPoints.map((p, i) => {
    const x = paddingX + (i / (data.hourlyPoints.length - 1)) * innerWidth;
    const y = chartHeight - paddingY - ((p.waveHeightM - minHeight) / range) * innerHeight;
    return { x, y, point: p };
  });

  const linePath = svgPoints.reduce(
    (acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ''
  );

  const areaPath = `${linePath} L ${svgPoints[svgPoints.length - 1].x} ${chartHeight} L ${svgPoints[0].x} ${chartHeight} Z`;

  return (
    <div className="w-full space-y-4">
      {/* Best Window Highlight Callout */}
      {data.bestWindow && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-emerald-950/60 border border-cyan-500/30 flex items-start space-x-3">
          <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                Mejor Momento del Día
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Score {data.bestWindow.peakScore.toFixed(1)} / 10
              </span>
            </div>
            <p className="text-xs text-slate-200 mt-1 leading-relaxed">
              {data.bestWindow.summary}
            </p>
          </div>
        </div>
      )}

      {/* Main 24h Evolution SVG Curve */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Waves className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Curva de Altura y Energía del Swell (00:00 - 23:00)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Pico: <span className="text-cyan-300 font-bold">{data.dailySummary.maxWaveHeightM}m</span> · Periodo medio: <span className="text-cyan-300 font-bold">{data.dailySummary.averagePeriodSec}s</span>
          </span>
        </div>

        {/* Responsive SVG Container */}
        <div className="w-full overflow-x-auto scrollbar-none">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-28 select-none"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={`grad-${spotId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#0891b2" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid horizontal guidelines */}
            <line
              x1={paddingX}
              y1={paddingY}
              x2={chartWidth - paddingX}
              y2={paddingY}
              stroke="rgba(255,255,255,0.08)"
              strokeDasharray="4 4"
            />
            <line
              x1={paddingX}
              y1={chartHeight / 2}
              x2={chartWidth - paddingX}
              y2={chartHeight / 2}
              stroke="rgba(255,255,255,0.05)"
              strokeDasharray="4 4"
            />

            {/* Area Fill */}
            <path d={areaPath} fill={`url(#grad-${spotId})`} />

            {/* Spline Stroke */}
            <path
              d={linePath}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Interactive Circles */}
            {svgPoints.map((pt) => {
              const isActive = pt.point.hour === activeHourIndex;
              return (
                <circle
                  key={pt.point.hour}
                  cx={pt.x}
                  cy={pt.y}
                  r={isActive ? 6 : 3}
                  className={cn(
                    'transition-all duration-150 cursor-pointer',
                    isActive
                      ? 'fill-cyan-300 stroke-white stroke-2'
                      : 'fill-cyan-600 hover:fill-cyan-300'
                  )}
                  onClick={() => setActiveHourIndex(pt.point.hour)}
                />
              );
            })}
          </svg>
        </div>

        {/* 24h Hourly Scrub Strip */}
        <div className="flex justify-between items-center mt-2 overflow-x-auto pb-1 scrollbar-none gap-1">
          {data.hourlyPoints.map((p) => {
            const isActive = p.hour === activeHourIndex;
            const scoreColor = getScoreColor(p.score.overallScore);

            return (
              <button
                key={p.hour}
                onClick={() => setActiveHourIndex(p.hour)}
                className={cn(
                  'flex flex-col items-center py-1.5 px-1.5 rounded-lg text-center transition-all min-w-[38px] flex-1',
                  isActive
                    ? 'bg-cyan-500/20 border border-cyan-400 text-white font-bold scale-105 shadow-sm'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
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
                    scoreColor.bg,
                    scoreColor.text,
                    scoreColor.border
                  )}
                >
                  {p.score.scoreOutOfTen.toFixed(1)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Hour Detailed Inspector Card */}
      {activePoint && (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-slate-300">Telemetría a las</span>
              <span className="text-sm font-black text-white font-mono bg-slate-800 px-2 py-0.5 rounded-md">
                {activePoint.timeLabel}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">SpotScore:</span>
              <span
                className={cn(
                  'text-sm font-black px-2.5 py-0.5 rounded-full border',
                  getScoreColor(activePoint.score.overallScore).bg,
                  getScoreColor(activePoint.score.overallScore).text,
                  getScoreColor(activePoint.score.overallScore).border
                )}
              >
                {activePoint.score.scoreOutOfTen.toFixed(1)} / 10 · {activePoint.score.quality.toUpperCase()}
              </span>
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3">
            {/* Swell */}
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
                <Waves className="w-3 h-3 text-cyan-400" />
                <span>Oleaje</span>
              </span>
              <p className="text-base font-black text-white tabular-nums mt-1">
                {activePoint.waveHeightM}m <span className="text-xs text-slate-400">@ {activePoint.periodSec}s</span>
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
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Energía</span>
              </span>
              <p className="text-base font-black text-amber-300 tabular-nums mt-1">
                {activePoint.energyKj} <span className="text-xs text-slate-400">kJ</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Potencia de rompiente
              </p>
            </div>

            {/* Wind */}
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
                <Wind className="w-3 h-3 text-teal-400" />
                <span>Viento</span>
              </span>
              <p className="text-base font-black text-white tabular-nums mt-1">
                {activePoint.windSpeedKmh} <span className="text-xs text-slate-400">km/h</span>
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
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
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
