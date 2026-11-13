'use client';

import React, { useState } from 'react';
import { SpotSummaryDTO } from '@/application/dtos/SpotSummaryDTO';
import { ScoreRadialGauge } from './telemetry/ScoreRadialGauge';
import { getScoreColorTokens, cn } from '@/presentation/lib/utils';
import { Waves, Video, Compass, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface IslandRadarMapProps {
  summaries: SpotSummaryDTO[];
  onSelectSpot: (spotId: string) => void;
  className?: string;
}

export const IslandRadarMap: React.FC<IslandRadarMapProps> = ({
  summaries,
  onSelectSpot,
  className,
}) => {
  const [hoveredSpotId, setHoveredSpotId] = useState<string | null>(null);

  // Gran Canaria geographic bounding box:
  // Lat: 27.70 to 28.20
  // Lng: -15.75 to -15.35
  const minLat = 27.70;
  const maxLat = 28.22;
  const minLng = -15.75;
  const maxLng = -15.33;

  const mapWidth = 560;
  const mapHeight = 520;
  const padding = 50;

  // Convert lat/lng to SVG canvas coordinates
  const projectCoords = (lat: number, lng: number) => {
    const x = padding + ((lng - minLng) / (maxLng - minLng)) * (mapWidth - padding * 2);
    // Invert Y axis because SVG origin (0,0) is top-left
    const y = mapHeight - padding - ((lat - minLat) / (maxLat - minLat)) * (mapHeight - padding * 2);
    return { x, y };
  };

  const hoveredSummary = summaries.find((s) => s.spot.id === hoveredSpotId);
  const primarySwell = summaries[0]?.conditions.primarySwell;

  return (
    <div className={cn('glass-panel rounded-3xl p-5 sm:p-7 border border-white/10 relative overflow-hidden', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Compass className="w-4 h-4" />
            </span>
            <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
              Radar Geográfico de Gran Canaria
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Mapeo perimetral interactivo de los 20 spots con estado y oleaje en tiempo real
          </p>
        </div>

        {primarySwell && (
          <div className="inline-flex items-center space-x-2 bg-slate-950/80 border border-white/5 px-3 py-1.5 rounded-xl text-xs">
            <Waves className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Swell Dominante:</span>
            <span className="font-bold text-white tabular-nums">
              {primarySwell.heightM.toFixed(1)}m {primarySwell.periodSec.toFixed(0)}s {primarySwell.compassDir}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* SVG Interactive Island Map Canvas */}
        <div className="lg:col-span-8 relative flex items-center justify-center">
          <svg
            viewBox={`0 0 ${mapWidth} ${mapHeight}`}
            className="w-full max-w-[500px] h-auto select-none overflow-visible"
          >
            <defs>
              <radialGradient id="islandGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0B1C33" stopOpacity="0.8" />
                <stop offset="70%" stopColor="#071220" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#040912" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="swellVectorGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Radar Circular Grid Rings */}
            <circle cx={mapWidth / 2} cy={mapHeight / 2} r="210" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" strokeDasharray="3 4" fill="none" />
            <circle cx={mapWidth / 2} cy={mapHeight / 2} r="150" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" strokeDasharray="3 4" fill="none" />
            <circle cx={mapWidth / 2} cy={mapHeight / 2} r="80" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" strokeDasharray="3 4" fill="none" />

            {/* Crosshairs */}
            <line x1={mapWidth / 2} y1="30" x2={mapWidth / 2} y2={mapHeight - 30} stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
            <line x1="30" y1={mapHeight / 2} x2={mapWidth - 30} y2={mapHeight / 2} stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />

            {/* Island Shape Outline (Stylized Gran Canaria Geodesic polygon) */}
            <path
              d="M 285 110 
                 C 320 120, 395 125, 410 160 
                 C 425 195, 430 250, 420 280 
                 C 410 310, 415 365, 380 405 
                 C 345 445, 280 450, 240 435 
                 C 200 420, 160 410, 135 370 
                 C 110 330, 105 280, 120 240 
                 C 135 200, 160 170, 205 135 
                 Z"
              fill="url(#islandGlow)"
              stroke="rgba(6, 182, 212, 0.3)"
              strokeWidth="2"
              className="drop-shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            />

            {/* Center Peak: Pico de las Nieves / Tejeda */}
            <circle cx="270" cy="275" r="3" fill="#64748B" opacity="0.6" />
            <text x="270" y="292" textAnchor="middle" fill="#64748B" fontSize="9" fontWeight="600" letterSpacing="1">
              GRAN CANARIA
            </text>

            {/* Zone Compass labels */}
            <text x={mapWidth / 2} y="22" textAnchor="middle" fill="#06B6D4" fontSize="10" fontWeight="900" letterSpacing="2">
              NORTE (SWELL NW/N)
            </text>
            <text x={mapWidth - 10} y={mapHeight / 2} textAnchor="end" fill="#F59E0B" fontSize="9" fontWeight="800">
              ESTE (TELDE)
            </text>
            <text x={mapWidth / 2} y={mapHeight - 8} textAnchor="middle" fill="#818CF8" fontSize="9" fontWeight="800">
              SUR (MASPALOMAS)
            </text>
            <text x="15" y={mapHeight / 2} textAnchor="start" fill="#64748B" fontSize="9" fontWeight="800">
              OESTE (ALDEA)
            </text>

            {/* 20 Spot Target Nodes */}
            {summaries.map((summary) => {
              const { x, y } = projectCoords(summary.spot.location.lat, summary.spot.location.lng);
              const tokens = getScoreColorTokens(summary.score.overallScore);
              const isHovered = hoveredSpotId === summary.spot.id;
              const hasWebcam = Boolean(summary.spot.webcam);

              return (
                <g
                  key={summary.spot.id}
                  className="cursor-pointer transition-transform"
                  onClick={() => onSelectSpot(summary.spot.id)}
                  onMouseEnter={() => setHoveredSpotId(summary.spot.id)}
                  onMouseLeave={() => setHoveredSpotId(null)}
                >
                  {/* Ping Ring for high score spots */}
                  {summary.score.overallScore >= 75 && (
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 14 : 9}
                      stroke={tokens.ringColor}
                      strokeWidth="1.5"
                      fill="none"
                      opacity="0.4"
                      className="animate-ping"
                    />
                  )}

                  {/* Outer Spot Node Circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 8 : hasWebcam ? 6.5 : 5}
                    fill="#0A1424"
                    stroke={tokens.stroke}
                    strokeWidth={isHovered ? 3 : 2}
                    className="transition-all duration-200"
                  />

                  {/* Inner Core */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 4 : 2.5}
                    fill={tokens.stroke}
                  />

                  {/* Tiny label on hover */}
                  {isHovered && (
                    <g transform={`translate(${x}, ${y - 12})`}>
                      <rect
                        x="-40"
                        y="-16"
                        width="80"
                        height="18"
                        rx="4"
                        fill="#060D17"
                        stroke={tokens.stroke}
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="-4"
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="9"
                        fontWeight="bold"
                      >
                        {summary.spot.name.slice(0, 14)}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected / Hovered Spot Telemetry Preview Box */}
        <div className="lg:col-span-4">
          {hoveredSummary ? (
            <motion.div
              key={hoveredSummary.spot.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-950/90 border border-cyan-500/30 rounded-2xl p-4 shadow-xl space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-black uppercase text-cyan-400">
                      {hoveredSummary.spot.location.municipality}
                    </span>
                    {hoveredSummary.spot.webcam && (
                      <span className="p-0.5 bg-red-950 text-red-400 rounded text-[9px] font-bold flex items-center space-x-0.5 px-1">
                        <Video className="w-2.5 h-2.5" />
                        <span>Live</span>
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-black text-white">{hoveredSummary.spot.name}</h4>
                </div>
                <ScoreRadialGauge score={hoveredSummary.score.overallScore} size={46} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Swell</span>
                  <span className="font-black text-white tabular-nums">
                    {hoveredSummary.conditions.primarySwell.heightM.toFixed(1)}m · {hoveredSummary.conditions.primarySwell.periodSec.toFixed(0)}s
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Viento</span>
                  <span className="font-black text-slate-200 tabular-nums">
                    {Math.round(hoveredSummary.conditions.wind.speedKmh)} km/h {hoveredSummary.conditions.wind.compassDir}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                {hoveredSummary.score.pros[0] || hoveredSummary.score.recommendation}
              </p>

              <button
                onClick={() => onSelectSpot(hoveredSummary.spot.id)}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs py-2 px-3 rounded-xl transition flex items-center justify-center space-x-1"
              >
                <span>Abrir Telemetría & Cam</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ) : (
            <div className="bg-slate-950/50 border border-white/5 rounded-2xl p-6 text-center text-slate-500 text-xs">
              <Compass className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-400">Pasa el ratón o toca un punto</p>
              <p className="mt-1">
                Haz clic en cualquier punto del radar insular para inspeccionar condiciones y webcams en directo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
