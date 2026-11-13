'use client';

import React, { useState } from 'react';
import { SpotSummaryDTO } from '@/application/dtos/SpotSummaryDTO';
import { WebcamViewer } from './WebcamViewer';
import { ScoreRadialGauge } from './telemetry/ScoreRadialGauge';
import { Video, Waves, Wind, ChevronRight, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

interface WebcamWallViewProps {
  summaries: SpotSummaryDTO[];
  onSelectSpot: (spotId: string) => void;
}

export const WebcamWallView: React.FC<WebcamWallViewProps> = ({
  summaries,
  onSelectSpot,
}) => {
  // Filter spots that have a webcam configured
  const spotsWithCam = summaries.filter((s) => Boolean(s.spot.webcam?.iframeUrl));
  const [activeCamSpotId, setActiveCamSpotId] = useState<string>(spotsWithCam[0]?.spot.id || '');

  const activeSpot = spotsWithCam.find((s) => s.spot.id === activeCamSpotId) || spotsWithCam[0];

  return (
    <div className="space-y-6">
      {/* Featured Active Webcam Canvas */}
      {activeSpot && (
        <div className="glass-panel-elevated rounded-3xl p-5 sm:p-6 border border-cyan-500/30 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center space-x-3">
              <ScoreRadialGauge score={activeSpot.score.overallScore} size={48} />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-md bg-red-950 text-red-400 border border-red-700/60 text-[10px] font-black uppercase flex items-center space-x-1">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                    </span>
                    <span>CANAL EN VIVO</span>
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    {activeSpot.spot.location.municipality}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">{activeSpot.spot.name}</h3>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs bg-slate-950/80 px-4 py-2 rounded-xl border border-white/5">
              <span className="flex items-center space-x-1 text-slate-300">
                <Waves className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold tabular-nums">
                  {activeSpot.conditions.primarySwell.heightM.toFixed(1)}m {activeSpot.conditions.primarySwell.periodSec.toFixed(0)}s
                </span>
              </span>
              <span>·</span>
              <span className="flex items-center space-x-1 text-slate-300">
                <Wind className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-bold tabular-nums">
                  {Math.round(activeSpot.conditions.wind.speedKmh)} km/h {activeSpot.conditions.wind.compassDir}
                </span>
              </span>
              <button
                onClick={() => onSelectSpot(activeSpot.spot.id)}
                className="ml-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center space-x-1"
              >
                <span>Detalle</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <WebcamViewer webcam={activeSpot.spot.webcam} spotName={activeSpot.spot.name} />
        </div>
      )}

      {/* Grid of All Available Webcams in Gran Canaria */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center space-x-2">
            <Video className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-300">
              Pabellón de Cámaras de Gran Canaria ({spotsWithCam.length} Disponibles)
            </h4>
          </div>
          <span className="text-xs text-slate-500">Selecciona para conmutar</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {spotsWithCam.map((summary) => {
            const isSelected = summary.spot.id === activeCamSpotId;

            return (
              <motion.div
                key={summary.spot.id}
                whileHover={{ y: -3 }}
                onClick={() => setActiveCamSpotId(summary.spot.id)}
                className={`glass-panel p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/30 shadow-lg shadow-cyan-500/10'
                    : 'border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {summary.spot.location.municipality}
                  </span>
                  <div className="flex items-center space-x-1 text-[10px] font-bold text-cyan-300">
                    <Eye className="w-3 h-3" />
                    <span>{isSelected ? 'Activo' : 'Ver'}</span>
                  </div>
                </div>

                <h5 className="text-sm font-black text-white truncate mb-2">{summary.spot.name}</h5>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
                  <span className="tabular-nums font-bold text-slate-200">
                    {summary.conditions.primarySwell.heightM.toFixed(1)}m · {summary.conditions.primarySwell.periodSec.toFixed(0)}s
                  </span>
                  <span className="tabular-nums text-slate-400">
                    {Math.round(summary.conditions.wind.speedKmh)} km/h
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
