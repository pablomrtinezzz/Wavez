'use client';

import React from 'react';
import { SpotSummaryDTO } from '@/application/dtos/SpotSummaryDTO';
import { DirectionCompass } from './telemetry/DirectionCompass';
import { getScoreColorTokens, getWindClassification, formatScoreToTen, cn } from '@/presentation/lib/utils';
import { Video, Camera, ChevronRight } from 'lucide-react';

interface CompactTelemetryTableProps {
  summaries: SpotSummaryDTO[];
  onSelectSpot: (spotId: string) => void;
  onOpenReportModal: (spotId: string) => void;
}

export const CompactTelemetryTable: React.FC<CompactTelemetryTableProps> = ({
  summaries,
  onSelectSpot,
  onOpenReportModal,
}) => {
  return (
    <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 border-b border-white/10 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3.5 px-4"># Rank</th>
              <th className="py-3.5 px-4">Spot & Municipio</th>
              <th className="py-3.5 px-4">Fondo</th>
              <th className="py-3.5 px-4">Swell & Periodo</th>
              <th className="py-3.5 px-4">Dirección Swell</th>
              <th className="py-3.5 px-4">Viento</th>
              <th className="py-3.5 px-4">Surf-Forecast</th>
              <th className="py-3.5 px-4 text-center">Score</th>
              <th className="py-3.5 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {summaries.map((s, idx) => {
              const tokens = getScoreColorTokens(s.score.overallScore);
              const isOffshore = s.score.pros.some(
                (p) => p.toLowerCase().includes('offshore') || p.toLowerCase().includes('terral')
              );
              const windClass = getWindClassification(s.conditions.wind.speedKmh, isOffshore);

              return (
                <tr
                  key={s.spot.id}
                  className="hover:bg-slate-900/60 transition-colors cursor-pointer group"
                  onClick={() => onSelectSpot(s.spot.id)}
                >
                  <td className="py-3.5 px-4 font-black text-slate-400 tabular-nums">
                    #{idx + 1}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-white group-hover:text-cyan-300 transition-colors">
                        {s.spot.name}
                      </span>
                      {s.spot.webcam && (
                        <span className="p-0.5 rounded bg-red-950 text-red-400 border border-red-800">
                          <Video className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {s.spot.location.municipality}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-medium capitalize">
                    {s.spot.breakType.replace('-break', '')}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-white tabular-nums">
                    {s.conditions.primarySwell.heightM.toFixed(1)}m ·{' '}
                    <span className="text-cyan-400 font-extrabold">
                      {s.conditions.primarySwell.periodSec.toFixed(0)}s
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <DirectionCompass
                      degrees={s.conditions.primarySwell.directionDeg}
                      compassDir={s.conditions.primarySwell.compassDir}
                      type="swell"
                    />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-1.5">
                      <span className="tabular-nums font-bold text-slate-200">
                        {Math.round(s.conditions.wind.speedKmh)} km/h
                      </span>
                      <span
                        className={cn(
                          'text-[9px] font-black px-1.5 py-0.2 rounded border',
                          windClass.bgClass,
                          windClass.textClass,
                          windClass.borderClass
                        )}
                      >
                        {windClass.label}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 tabular-nums font-black text-purple-300">
                    {s.energy.energyKj} kJ
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-lg text-xs font-black tabular-nums border inline-block',
                        tokens.bg,
                        tokens.text,
                        tokens.border
                      )}
                    >
                      {formatScoreToTen(s.score.overallScore)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => onSelectSpot(s.spot.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        title="Ver detalle"
                      >
                        <ChevronRight className="w-4 h-4 text-cyan-400" />
                      </button>
                      <button
                        onClick={() => onOpenReportModal(s.spot.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        title="Subir foto"
                      >
                        <Camera className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
