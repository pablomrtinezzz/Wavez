'use client';

import React from 'react';
import { SpotSummaryDTO } from '@/application/dtos/SpotSummaryDTO';
import { ConditionQuality } from '@/domain/models/SpotScore';
import {
  Waves,
  Wind,
  Video,
  Camera,
  ChevronRight,
  Flame,
  Zap,
  Info,
} from 'lucide-react';

interface SpotCardProps {
  summary: SpotSummaryDTO;
  onSelectSpot: (spotId: string) => void;
  onOpenReportModal: (spotId: string) => void;
}

export const SpotCard: React.FC<SpotCardProps> = ({
  summary,
  onSelectSpot,
  onOpenReportModal,
}) => {
  const { spot, conditions, energy, score, latestReport } = summary;

  const qualityBadgeConfig: Record<
    ConditionQuality,
    { label: string; bg: string; text: string; border: string }
  > = {
    firing: {
      label: 'Épico 🔥',
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-300',
      border: 'border-emerald-500/50',
    },
    good: {
      label: 'Muy Bueno',
      bg: 'bg-teal-500/15',
      text: 'text-teal-300',
      border: 'border-teal-500/40',
    },
    fair: {
      label: 'Surfeable',
      bg: 'bg-amber-500/15',
      text: 'text-amber-300',
      border: 'border-amber-500/40',
    },
    poor: {
      label: 'Difícil',
      bg: 'bg-rose-500/15',
      text: 'text-rose-300',
      border: 'border-rose-500/40',
    },
    flat: {
      label: 'Plato',
      bg: 'bg-slate-700/30',
      text: 'text-slate-400',
      border: 'border-slate-700',
    },
  };

  const badge = qualityBadgeConfig[score.quality];

  // Energy color scale (kJ)
  const getEnergyColor = (kj: number) => {
    if (kj >= 1800) return 'text-purple-400 bg-purple-950/50 border-purple-800';
    if (kj >= 1200) return 'text-cyan-400 bg-cyan-950/50 border-cyan-800';
    if (kj >= 600) return 'text-emerald-400 bg-emerald-950/50 border-emerald-800';
    return 'text-slate-400 bg-slate-800 border-slate-700';
  };

  const breakTypeLabels: Record<string, string> = {
    'beach-break': 'Arena',
    'reef-break': 'Arrecife / Roca',
    'point-break': 'Pointbreak',
    slab: 'Laja / Slab',
  };

  return (
    <div className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all duration-200 shadow-lg hover:shadow-cyan-950/20 flex flex-col justify-between">
      <div>
        {/* Header: Name, Municipality, Quality Badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-white group-hover:text-cyan-400">
                {spot.name}
              </h3>
              {spot.webcam && (
                <span
                  title="Webcam disponible"
                  className="p-1 rounded-md bg-red-950/60 text-red-400 border border-red-800/60"
                >
                  <Video className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {spot.location.municipality} · {breakTypeLabels[spot.breakType] || spot.breakType}
            </p>
          </div>

          <div
            className={`px-3 py-1 rounded-xl text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border} flex items-center space-x-1 shrink-0`}
          >
            <span>{score.overallScore}</span>
            <span className="text-[10px] opacity-75">/100</span>
          </div>
        </div>

        {/* Marine Metrics Grid */}
        <div className="grid grid-cols-3 gap-2.5 my-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          {/* Swell Height & Period */}
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 flex items-center space-x-1">
              <Waves className="w-3 h-3 text-cyan-400" />
              <span>Mar de fondo</span>
            </span>
            <span className="text-sm font-extrabold text-white mt-1">
              {conditions.primarySwell.heightM.toFixed(1)}m · {conditions.primarySwell.periodSec.toFixed(0)}s
            </span>
            <span className="text-[10px] text-cyan-300 font-medium">
              {conditions.primarySwell.compassDir} ({conditions.primarySwell.directionDeg}°)
            </span>
          </div>

          {/* Wind */}
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 flex items-center space-x-1">
              <Wind className="w-3 h-3 text-blue-400" />
              <span>Viento</span>
            </span>
            <span className="text-sm font-extrabold text-white mt-1">
              {Math.round(conditions.wind.speedKmh)} km/h
            </span>
            <span className="text-[10px] text-slate-300 font-medium">
              {conditions.wind.compassDir} ({conditions.wind.directionDeg}°)
            </span>
          </div>

          {/* Surf-Forecast Energy (kJ) */}
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 flex items-center space-x-1">
              <Zap className="w-3 h-3 text-purple-400" />
              <span>Surf-Forecast</span>
            </span>
            <div className="mt-1">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-md border ${getEnergyColor(
                  energy.energyKj
                )}`}
              >
                {energy.energyKj} kJ
              </span>
            </div>
            <span className="text-[9px] text-slate-500 mt-0.5">
              {energy.source === 'scraped' ? 'En vivo' : 'Estimado'}
            </span>
          </div>
        </div>

        {/* Highlights / Pros */}
        {score.pros.length > 0 && (
          <div className="text-xs text-emerald-400/90 mb-3 flex items-center space-x-1.5">
            <Flame className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
            <span className="truncate">{score.pros[0]}</span>
          </div>
        )}

        {/* Recent Report Indicator */}
        {latestReport && (
          <div className="text-[11px] bg-slate-800/60 border border-slate-700/60 text-slate-300 px-3 py-1.5 rounded-lg mb-3 flex items-center justify-between">
            <span className="flex items-center space-x-1.5 truncate">
              <Camera className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">Foto reciente ({latestReport.isRealtimeVerified ? 'Verificada' : 'Comunidad'})</span>
            </span>
            <span className="text-[10px] text-slate-400 shrink-0">
              hace {Math.round((Date.now() - new Date(latestReport.capturedAt).getTime()) / 60000)} min
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex items-center space-x-2 border-t border-slate-800/80">
        <button
          onClick={() => onSelectSpot(spot.id)}
          className="flex-1 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-medium text-xs py-2 px-3 rounded-xl transition duration-150 flex items-center justify-center space-x-1"
        >
          <span>Ver Detalle {spot.webcam ? '& Cam' : ''}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onOpenReportModal(spot.id)}
          title="Subir foto del spot ahora"
          className="bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white p-2 rounded-xl border border-slate-700 transition duration-150"
        >
          <Camera className="w-4 h-4 text-cyan-400" />
        </button>
      </div>
    </div>
  );
};
