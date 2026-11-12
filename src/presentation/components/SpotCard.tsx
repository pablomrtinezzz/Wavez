'use client';

import React from 'react';
import { SpotSummaryDTO } from '@/application/dtos/SpotSummaryDTO';
import { ScoreRadialGauge } from './telemetry/ScoreRadialGauge';
import { DirectionCompass } from './telemetry/DirectionCompass';
import { EnergyBar } from './telemetry/EnergyBar';
import { getScoreColorTokens, getWindClassification, cn } from '@/presentation/lib/utils';
import {
  Waves,
  Wind,
  Video,
  Camera,
  ChevronRight,
  ShieldCheck,
  Award,
  MapPin,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SpotCardProps {
  summary: SpotSummaryDTO;
  rankIndex?: number; // 0-based ranking position (#1, #2, etc.)
  onSelectSpot: (spotId: string) => void;
  onOpenReportModal: (spotId: string) => void;
}

export const SpotCard: React.FC<SpotCardProps> = ({
  summary,
  rankIndex,
  onSelectSpot,
  onOpenReportModal,
}) => {
  const { spot, conditions, energy, score, latestReport } = summary;

  const scoreTokens = getScoreColorTokens(score.overallScore);

  // Check if wind is offshore
  const isOffshore = score.pros.some((p) => p.toLowerCase().includes('offshore') || p.toLowerCase().includes('terral'));
  const windClass = getWindClassification(conditions.wind.speedKmh, isOffshore);

  const breakTypeLabels: Record<string, string> = {
    'beach-break': 'Arena',
    'reef-break': 'Arrecife',
    'point-break': 'Pointbreak',
    slab: 'Laja / Slab',
  };

  const tideLabels: Record<string, string> = {
    low: 'Baja',
    mid: 'Media',
    high: 'Llena',
    all: 'Todas',
  };

  // Rank Badge styling
  const isRanked = rankIndex !== undefined;
  const isTop1 = rankIndex === 0;
  const isTop2 = rankIndex === 1;
  const isTop3 = rankIndex === 2;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="glass-panel hover:glass-panel-elevated rounded-3xl p-5 sm:p-6 transition-all duration-300 shadow-xl flex flex-col justify-between group relative overflow-hidden"
    >
      {/* Subtle top accent gradient */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r transition-opacity duration-300',
          scoreTokens.gradient,
          score.overallScore >= 75 ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'
        )}
      />

      <div>
        {/* Top Header: Ranking Badge, Name, Webcam status, and Radial Score Gauge */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              {isRanked && (
                <div
                  className={cn(
                    'px-2 py-0.5 rounded-lg text-[11px] font-black tabular-nums border flex items-center space-x-1',
                    isTop1
                      ? 'bg-amber-400/20 border-amber-400/60 text-amber-300 shadow-sm shadow-amber-400/20'
                      : isTop2
                      ? 'bg-slate-300/20 border-slate-300/50 text-slate-200'
                      : isTop3
                      ? 'bg-amber-700/20 border-amber-600/50 text-amber-500'
                      : 'bg-slate-800/80 border-slate-700/60 text-slate-400'
                  )}
                >
                  {isTop1 ? <Award className="w-3 h-3 text-amber-400" /> : null}
                  <span>#{rankIndex + 1}</span>
                </div>
              )}

              <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-cyan-300 transition-colors tracking-tight">
                {spot.name}
              </h3>

              {spot.webcam && (
                <span
                  title="Webcam en directo disponible"
                  className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-red-950/80 border border-red-700/60 text-red-400 text-[10px] font-bold"
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                  </span>
                  <Video className="w-3 h-3" />
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span className="flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-slate-500" />
                <span>{spot.location.municipality}</span>
              </span>
              <span>·</span>
              <span className="text-slate-300 font-medium">
                {breakTypeLabels[spot.breakType] || spot.breakType}
              </span>
            </div>
          </div>

          {/* Radial Score Gauge (0.0 - 10.0 scale) */}
          <ScoreRadialGauge score={score.overallScore} size={54} />
        </div>

        {/* 4-Column Telemetry Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4 bg-slate-950/80 border border-white/5 p-3 rounded-2xl">
          {/* 1. Swell */}
          <div className="flex flex-col space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <Waves className="w-2.5 h-2.5 text-cyan-400" />
              <span>Swell</span>
            </span>
            <div className="text-sm font-black text-white tabular-nums tracking-tight">
              {conditions.primarySwell.heightM.toFixed(1)}m{' '}
              <span className="text-cyan-400 font-extrabold text-xs">
                {conditions.primarySwell.periodSec.toFixed(0)}s
              </span>
            </div>
            <DirectionCompass
              degrees={conditions.primarySwell.directionDeg}
              compassDir={conditions.primarySwell.compassDir}
              type="swell"
            />
          </div>

          {/* 2. Wave Energy */}
          <EnergyBar energyKj={energy.energyKj} source={energy.source} />

          {/* 3. Wind */}
          <div className="flex flex-col space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <Wind className="w-2.5 h-2.5 text-blue-400" />
              <span>Viento</span>
            </span>
            <div className="text-sm font-black text-white tabular-nums tracking-tight">
              {Math.round(conditions.wind.speedKmh)}{' '}
              <span className="text-[10px] text-slate-400 font-normal">km/h</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <DirectionCompass
                degrees={conditions.wind.directionDeg}
                compassDir={conditions.wind.compassDir}
                type="wind"
              />
              <span
                className={cn(
                  'text-[9px] font-extrabold px-1.5 py-0.5 rounded border',
                  windClass.bgClass,
                  windClass.textClass,
                  windClass.borderClass
                )}
              >
                {windClass.label}
              </span>
            </div>
          </div>

          {/* 4. Marea Ideal / Estado */}
          <div className="flex flex-col space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Marea Óptima
            </span>
            <div className="text-xs font-bold text-slate-200 mt-0.5">
              {tideLabels[spot.idealConditions.preferredTide]}
            </div>
            <span className="text-[10px] text-slate-500 truncate">
              {score.pros.length > 0 ? score.pros[0] : score.recommendation}
            </span>
          </div>
        </div>

        {/* Recent Community Photo Preview (if exists) */}
        {latestReport && (
          <div className="mb-3 p-2 bg-slate-950/50 rounded-xl border border-white/5 flex items-center space-x-3">
            <div className="relative w-12 h-10 rounded-lg overflow-hidden bg-black shrink-0">
              <img
                src={latestReport.photoUrl}
                alt="Reporte reciente"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {latestReport.isRealtimeVerified && (
                <div className="absolute top-0.5 left-0.5 p-0.5 bg-emerald-950/90 rounded text-emerald-400">
                  <ShieldCheck className="w-2.5 h-2.5" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-300 font-semibold truncate flex items-center space-x-1">
                  <Camera className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>Foto {latestReport.isRealtimeVerified ? 'Verificada' : 'Comunidad'}</span>
                </span>
                <span className="text-slate-500 tabular-nums">
                  {new Date(latestReport.capturedAt).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              {latestReport.userNote && (
                <p className="text-[11px] text-slate-400 truncate italic mt-0.5">
                  &quot;{latestReport.userNote}&quot;
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3 flex items-center space-x-2 border-t border-white/5">
        <button
          onClick={() => onSelectSpot(spot.id)}
          className="flex-1 bg-cyan-600/90 hover:bg-cyan-500 active:bg-cyan-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition duration-150 flex items-center justify-center space-x-1.5 shadow-md shadow-cyan-950/50"
        >
          <span>Telemetría Completa {spot.webcam ? '& Webcam' : ''}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onOpenReportModal(spot.id)}
          title="Tomar o subir foto anti-trampas"
          className="bg-slate-800/90 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white p-2.5 rounded-xl border border-white/10 transition duration-150 shrink-0"
        >
          <Camera className="w-4 h-4 text-cyan-400" />
        </button>
      </div>
    </motion.div>
  );
};
