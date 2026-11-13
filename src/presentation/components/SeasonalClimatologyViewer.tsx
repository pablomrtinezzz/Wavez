'use client';

import React, { useState, useEffect } from 'react';
import { SpotClimatology } from '@/domain/models/SeasonalClimatology';
import {
  Calendar,
  Compass,
  Wind,
  Waves,
  ShieldAlert,
  Users,
  Lightbulb,
  AlertCircle,
  Award,
} from 'lucide-react';
import { cn } from '@/presentation/lib/utils';

interface SeasonalClimatologyViewerProps {
  spotId: string;
}

export const SeasonalClimatologyViewer: React.FC<SeasonalClimatologyViewerProps> = ({ spotId }) => {
  const [data, setData] = useState<SpotClimatology | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/spots/${spotId}/climatology`)
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return;
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || 'No hay datos climatológicos disponibles');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Error al cargar climatología');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [spotId]);

  if (loading) {
    return (
      <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-white/5 animate-pulse space-y-2">
        <Calendar className="w-6 h-6 mx-auto text-cyan-400 animate-spin" />
        <p className="text-xs text-slate-400">Consultando serie histórica oceanográfica de Gran Canaria...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center bg-slate-950/60 rounded-2xl border border-amber-500/20 text-amber-300 space-y-1">
        <AlertCircle className="w-5 h-5 mx-auto text-amber-400" />
        <p className="text-xs">{error || 'Climatología no disponible'}</p>
      </div>
    );
  }

  const [currentMonth, setCurrentMonth] = useState<number>(11);

  useEffect(() => {
    setCurrentMonth(new Date().getMonth() + 1);
  }, []);

  return (
    <div className="space-y-4">
      {/* Season Badge & Summary Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/20">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              Temporada Estrella
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-cyan-500/20 text-cyan-200 border border-cyan-500/30">
            {data.bestSeasonLabel}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
          {data.seasonSummary}
        </p>
      </div>

      {/* 12-Month Consistency Bar Chart */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Consistencia Histórica (% Días Surfeables por Mes)
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 mr-1" />
            Mes actual marcado
          </span>
        </div>

        {/* 12 Bars */}
        <div className="grid grid-cols-12 gap-1.5 items-end h-28 pt-4 pb-2 border-b border-white/10">
          {data.monthlyConsistency.map((m) => {
            const isCurrent = m.month === currentMonth;
            const barHeightPct = Math.max(12, m.consistencyPct);

            return (
              <div
                key={m.month}
                className="flex flex-col items-center justify-end h-full group relative"
              >
                {/* Tooltip on hover */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-slate-900 border border-white/20 text-[10px] font-mono px-2 py-1 rounded shadow-lg whitespace-nowrap z-20">
                  {m.consistencyPct}% · {m.averageWaveHeightM}m @ {m.averagePeriodSec}s
                </div>

                <div
                  className={cn(
                    'w-full rounded-t-md transition-all group-hover:brightness-125',
                    isCurrent
                      ? 'bg-gradient-to-t from-cyan-600 to-cyan-300 shadow-md shadow-cyan-500/30'
                      : m.consistencyPct >= 70
                      ? 'bg-gradient-to-t from-emerald-700 to-emerald-400'
                      : m.consistencyPct >= 40
                      ? 'bg-gradient-to-t from-cyan-800 to-cyan-600'
                      : 'bg-slate-700'
                  )}
                  style={{ height: `${barHeightPct}%` }}
                />

                <span
                  className={cn(
                    'text-[10px] font-mono mt-1',
                    isCurrent ? 'text-cyan-300 font-bold' : 'text-slate-400'
                  )}
                >
                  {m.monthName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Spot Parameters & Ocean Windows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Optimal Swell Window */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
          <div className="flex items-center space-x-2 text-cyan-400">
            <Waves className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Ventana de Swell Ideal
            </span>
          </div>
          <p className="text-xs font-semibold text-white pt-1">
            {data.optimalSwellWindow}
          </p>
        </div>

        {/* Optimal Wind Regime */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
          <div className="flex items-center space-x-2 text-teal-400">
            <Wind className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Régimen de Viento Favorable
            </span>
          </div>
          <p className="text-xs font-semibold text-white pt-1">
            {data.optimalWindRegime}
          </p>
        </div>

        {/* Best Tide */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
          <div className="flex items-center space-x-2 text-indigo-400">
            <Compass className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Comportamiento con Marea
            </span>
          </div>
          <p className="text-xs text-slate-200 pt-1 leading-relaxed">
            {data.tideDescription}
          </p>
        </div>

        {/* Crowd Factor */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
          <div className="flex items-center space-x-2 text-amber-400">
            <Users className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Factor de Concurrencia (Crowd)
            </span>
          </div>
          <p className="text-xs font-semibold text-white pt-1 capitalize">
            Nivel {data.crowdFactor} en condiciones óptimas
          </p>
        </div>
      </div>

      {/* Local Knowledge & Insider Notes */}
      <div className="p-4 rounded-xl bg-slate-950/70 border border-amber-500/20 space-y-2">
        <div className="flex items-center space-x-2 text-amber-400">
          <Lightbulb className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
            Inteligencia Local & Secretos del Spot
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {data.historicalNotes}
        </p>
      </div>

      {/* Safety & Risk Factors */}
      {data.riskFactors.length > 0 && (
        <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-1.5">
          <div className="flex items-center space-x-2 text-rose-400">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
              Peligros & Factores de Riesgo
            </span>
          </div>
          <ul className="text-xs text-slate-300 list-disc list-inside space-y-0.5">
            {data.riskFactors.map((rf, idx) => (
              <li key={idx}>{rf}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
