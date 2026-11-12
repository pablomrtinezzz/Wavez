'use client';

import React, { useState } from 'react';
import { MarineConditions } from '@/domain/models/MarineConditions';
import { Waves, Wind, Clock } from 'lucide-react';
import { cn } from '@/presentation/lib/utils';

interface ForecastSparklineProps {
  hourlyData: MarineConditions[];
  className?: string;
}

export const ForecastSparkline: React.FC<ForecastSparklineProps> = ({
  hourlyData,
  className,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!hourlyData || hourlyData.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-500">
        Previsión horaria en proceso de sincronización...
      </div>
    );
  }

  // Take the first 24 hours of forecast
  const points = hourlyData.slice(0, 24);
  const heights = points.map((p) => p.totalWaveHeightM || p.primarySwell.heightM || 0.8);
  const minHeight = Math.max(0, Math.min(...heights) * 0.8);
  const maxHeight = Math.max(1.8, Math.max(...heights) * 1.25);

  const width = 600;
  const height = 140;
  const paddingX = 24;
  const paddingY = 20;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Generate SVG coordinates
  const coords = points.map((p, idx) => {
    const x = paddingX + (idx / (points.length - 1)) * chartWidth;
    const h = p.totalWaveHeightM || p.primarySwell.heightM || 0.8;
    const y = height - paddingY - ((h - minHeight) / (maxHeight - minHeight)) * chartHeight;
    return { x, y, point: p, height: h };
  });

  // Create smooth SVG curve path
  const pathD = coords.reduce((acc, curr, idx, arr) => {
    if (idx === 0) return `M ${curr.x} ${curr.y}`;
    const prev = arr[idx - 1];
    const cp1x = prev.x + (curr.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (curr.x - prev.x) / 2;
    const cp2y = curr.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
  }, '');

  // Closed path for fill gradient
  const areaD = `${pathD} L ${coords[coords.length - 1].x} ${height - paddingY} L ${coords[0].x} ${height - paddingY} Z`;

  const activeData = hoveredIndex !== null ? coords[hoveredIndex] : coords[0];

  return (
    <div className={cn('bg-slate-950/60 border border-white/5 rounded-2xl p-4 sm:p-5', className)}>
      {/* Header Info */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Waves className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Evolución Mar de Fondo (Próximas 24 Horas)
          </span>
        </div>

        {activeData && (
          <div className="flex items-center space-x-3 text-xs bg-slate-900/90 border border-slate-700/60 px-3 py-1 rounded-xl">
            <span className="text-slate-400 flex items-center space-x-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>
                {new Date(activeData.point.timestamp).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </span>
            <span className="font-extrabold text-cyan-300 tabular-nums">
              {activeData.height.toFixed(1)}m · {activeData.point.primarySwell.periodSec.toFixed(0)}s
            </span>
            <span className="text-slate-400 flex items-center space-x-1">
              <Wind className="w-3 h-3 text-blue-400" />
              <span>{Math.round(activeData.point.wind.speedKmh)} km/h {activeData.point.wind.compassDir}</span>
            </span>
          </div>
        )}
      </div>

      {/* SVG Responsive Container */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#0891B2" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#0891B2" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeDasharray="3 3"
          />
          <line
            x1={paddingX}
            y1={height / 2}
            x2={width - paddingX}
            y2={height / 2}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeDasharray="3 3"
          />
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="rgba(255, 255, 255, 0.1)"
          />

          {/* Area Fill */}
          <path d={areaD} fill="url(#waveGradient)" />

          {/* Line Stroke */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#strokeGradient)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Interactive Points */}
          {coords.map((c, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <g key={idx}>
                {/* Invisible hover target */}
                <rect
                  x={c.x - (chartWidth / points.length) / 2}
                  y={0}
                  width={chartWidth / points.length}
                  height={height}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                />
                {/* Dot */}
                {(isHovered || idx % 4 === 0) && (
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={isHovered ? 5 : 3}
                    fill={isHovered ? '#FFFFFF' : '#06B6D4'}
                    stroke="#0A1424"
                    strokeWidth="2"
                    className="transition-all duration-150"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Time Labels */}
        <div className="flex justify-between px-6 pt-1 text-[10px] text-slate-500 font-medium tabular-nums">
          {coords
            .filter((_, idx) => idx % 4 === 0)
            .map((c, idx) => (
              <span key={idx}>
                {new Date(c.point.timestamp).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
};
