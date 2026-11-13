'use client';

import React, { useEffect, useState } from 'react';
import { SpotDetailDTO } from '@/application/dtos/SpotSummaryDTO';
import { WebcamViewer } from './WebcamViewer';
import { ScoreRadialGauge } from './telemetry/ScoreRadialGauge';
import { DirectionCompass } from './telemetry/DirectionCompass';
import { ForecastSparkline } from './telemetry/ForecastSparkline';
import { HourlyEvolutionChart } from './HourlyEvolutionChart';
import { SeasonalClimatologyViewer } from './SeasonalClimatologyViewer';
import { getWindClassification, formatScoreToTen, cn } from '@/presentation/lib/utils';
import {
  X,
  Waves,
  Wind,
  Zap,
  CheckCircle2,
  AlertCircle,
  Camera,
  MapPin,
  Clock,
  ShieldCheck,
  TrendingUp,
  Calendar,
  Activity,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ModalTab = 'live' | 'evolution' | 'climatology';

interface SpotDetailModalProps {
  spotId: string | null;
  initialDate?: string;
  onClose: () => void;
  onOpenReportModal: (spotId: string) => void;
}

export const SpotDetailModal: React.FC<SpotDetailModalProps> = ({
  spotId,
  initialDate,
  onClose,
  onOpenReportModal,
}) => {
  const [detail, setDetail] = useState<SpotDetailDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ModalTab>('live');
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || '2026-11-13'
  );

  useEffect(() => {
    if (!initialDate) {
      setSelectedDate(new Date().toISOString().split('T')[0]);
    }
  }, [initialDate]);

  useEffect(() => {
    if (!spotId) return;

    let isMounted = true;
    const loadDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/spots/${spotId}`);
        const data = await res.json();
        if (!isMounted) return;
        if (data.success) {
          setDetail(data.data);
        } else {
          setError(data.error || 'Error cargando datos');
        }
      } catch (err) {
        if (!isMounted) return;
        setError((err as Error).message || 'Error de red');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDetail();

    return () => {
      isMounted = false;
    };
  }, [spotId]);

  if (!spotId) return null;

  const isOffshore = detail
    ? detail.score.pros.some((p) => p.toLowerCase().includes('offshore') || p.toLowerCase().includes('terral'))
    : false;
  const windClass = detail ? getWindClassification(detail.conditions.wind.speedKmh, isOffshore) : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md overflow-hidden">
        {/* Backdrop click */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          onClick={onClose}
        />

        {/* Modal Window: Bottom sheet on mobile, centered dialog on desktop */}
        <motion.div
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-4xl bg-slate-900/95 border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col z-10"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-white/10 bg-slate-950/80 sticky top-0 z-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {detail && <ScoreRadialGauge score={detail.score.overallScore} size={48} />}
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {detail ? detail.spot.name : 'Cargando spot...'}
                  </h2>
                  {detail && (
                    <p className="text-xs text-slate-400 flex items-center space-x-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>
                        {detail.spot.location.municipality} · Lat {detail.spot.location.lat.toFixed(3)}, Lng{' '}
                        {detail.spot.location.lng.toFixed(3)}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-2 mt-4 pt-2 border-t border-white/5 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveTab('live')}
                className={cn(
                  'flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap',
                  activeTab === 'live'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                )}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>En Directo & Webcam</span>
              </button>

              <button
                onClick={() => setActiveTab('evolution')}
                className={cn(
                  'flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap',
                  activeTab === 'evolution'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                )}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Evolución Horaria 24h</span>
              </button>

              <button
                onClick={() => setActiveTab('climatology')}
                className={cn(
                  'flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap',
                  activeTab === 'climatology'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                )}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Climatología & Temporadas</span>
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
            {loading && (
              <div className="py-20 text-center text-slate-400">
                <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm font-semibold">Sincronizando telemetría y webcams en directo...</p>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-300 text-sm">
                {error}
              </div>
            )}

            {detail && !loading && (
              <>
                {/* TAB 1: Live & Webcam */}
                {activeTab === 'live' && (
                  <div className="space-y-6">
                    {/* 1. Official Webcam Stream */}
                    <WebcamViewer webcam={detail.webcam} spotName={detail.spot.name} />

                    {/* 2. Forecast Evolution Sparkline (24h) */}
                    <ForecastSparkline hourlyData={detail.hourlyForecast} />

                    {/* 3. Deep Telemetry Matrix */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Score Breakdown Card */}
                      <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between border border-white/5">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Índice Algorítmico
                          </span>
                          <div className="flex items-baseline space-x-2 mt-2">
                            <span className="text-4xl font-black text-cyan-400 tabular-nums">
                              {formatScoreToTen(detail.score.overallScore)}
                            </span>
                            <span className="text-sm font-bold text-slate-500">/ 10</span>
                          </div>
                          <p className="text-xs text-slate-300 font-semibold mt-1">
                            {detail.score.recommendation}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/5 space-y-2 text-xs">
                          <div>
                            <div className="flex justify-between text-slate-400 mb-1">
                              <span>Swell y Dirección</span>
                              <span className="font-black text-white">{detail.score.swellScore} / 40</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${(detail.score.swellScore / 40) * 100}%` }}
                                className="h-full bg-cyan-400 rounded-full"
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-slate-400 mb-1">
                              <span>Viento (Offshore / Glassy)</span>
                              <span className="font-black text-white">{detail.score.windScore} / 35</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${(detail.score.windScore / 35) * 100}%` }}
                                className="h-full bg-emerald-400 rounded-full"
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-slate-400 mb-1">
                              <span>Periodo Oceánico</span>
                              <span className="font-black text-white">{detail.score.periodScore} / 25</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${(detail.score.periodScore / 25) * 100}%` }}
                                className="h-full bg-blue-400 rounded-full"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Physical Parameters Card */}
                      <div className="glass-panel p-5 rounded-2xl md:col-span-2 space-y-4 border border-white/5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Parámetros Físicos en Tiempo Real
                        </span>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-white/5">
                            <span className="text-[10px] font-bold text-slate-400 flex items-center space-x-1 uppercase">
                              <Waves className="w-3 h-3 text-cyan-400" />
                              <span>Mar de Fondo</span>
                            </span>
                            <p className="text-base font-black text-white mt-1 tabular-nums">
                              {detail.conditions.primarySwell.heightM.toFixed(1)}m · {detail.conditions.primarySwell.periodSec.toFixed(0)}s
                            </p>
                            <div className="mt-1">
                              <DirectionCompass
                                degrees={detail.conditions.primarySwell.directionDeg}
                                compassDir={detail.conditions.primarySwell.compassDir}
                                type="swell"
                              />
                            </div>
                          </div>

                          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-white/5">
                            <span className="text-[10px] font-bold text-slate-400 flex items-center space-x-1 uppercase">
                              <Wind className="w-3 h-3 text-blue-400" />
                              <span>Viento (10m)</span>
                            </span>
                            <p className="text-base font-black text-white mt-1 tabular-nums">
                              {Math.round(detail.conditions.wind.speedKmh)} km/h
                            </p>
                            <div className="mt-1 flex items-center space-x-1.5">
                              <DirectionCompass
                                degrees={detail.conditions.wind.directionDeg}
                                compassDir={detail.conditions.wind.compassDir}
                                type="wind"
                              />
                              {windClass && (
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
                              )}
                            </div>
                          </div>

                          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-white/5">
                            <span className="text-[10px] font-bold text-slate-400 flex items-center space-x-1 uppercase">
                              <Zap className="w-3 h-3 text-purple-400" />
                              <span>Surf-Forecast</span>
                            </span>
                            <p className="text-base font-black text-purple-300 mt-1 tabular-nums">
                              {detail.energy.energyKj.toLocaleString('es-ES')} kJ
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1">
                              {detail.energy.source === 'scraped' ? 'Medición oficial live' : 'Fórmula estimada'}
                            </p>
                          </div>
                        </div>

                        {/* Highlights Analysis */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                          <div className="space-y-1.5">
                            {detail.score.pros.map((p, idx) => (
                              <div key={idx} className="flex items-center space-x-2 text-emerald-300 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                                <span>{p}</span>
                              </div>
                            ))}
                          </div>
                          <div className="space-y-1.5">
                            {detail.score.cons.map((c, idx) => (
                              <div key={idx} className="flex items-center space-x-2 text-amber-300 font-medium">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                                <span>{c}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 4. Community Crowd Photos Gallery */}
                    <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-black text-white flex items-center space-x-2">
                            <Camera className="w-4 h-4 text-cyan-400" />
                            <span>Reportes y Fotos de la Comunidad</span>
                          </h3>
                          <p className="text-xs text-slate-400">
                            Inspección visual con certificación EXIF y geolocalización GPS
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            onClose();
                            onOpenReportModal(detail.spot.id);
                          }}
                          className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 shadow-md shadow-cyan-900/40"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Subir Foto Ahora</span>
                        </button>
                      </div>

                      {detail.reports.length === 0 ? (
                        <div className="py-8 text-center text-slate-500 text-xs">
                          No hay fotos comunitarias en las últimas 24h para este spot. ¡Sé el primero en reportar!
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {detail.reports.map((report) => (
                            <div
                              key={report.id}
                              className="bg-slate-950/80 border border-white/10 rounded-2xl overflow-hidden shadow-lg"
                            >
                              <div className="relative aspect-video bg-black overflow-hidden group">
                                <img
                                  src={report.photoUrl}
                                  alt={`Reporte de ${detail.spot.name}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  loading="lazy"
                                />
                                {report.isRealtimeVerified && (
                                  <div className="absolute top-2.5 left-2.5 bg-emerald-950/90 border border-emerald-500/80 text-emerald-300 text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center space-x-1.5 backdrop-blur-md shadow-md">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>VERIFICADO EN VIVO</span>
                                  </div>
                                )}
                              </div>

                              <div className="p-3.5 text-xs space-y-2">
                                {report.userNote && (
                                  <p className="text-slate-200 font-medium italic">
                                    &quot;{report.userNote}&quot;
                                  </p>
                                )}
                                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
                                  <span className="flex items-center space-x-1 text-slate-400">
                                    <Clock className="w-3 h-3 text-cyan-400" />
                                    <span>
                                      {new Date(report.capturedAt).toLocaleTimeString('es-ES', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </span>
                                  {report.conditionSnapshot && (
                                    <span className="text-cyan-300 font-semibold tabular-nums">
                                      {report.conditionSnapshot.waveHeightM}m · {report.conditionSnapshot.periodSec}s · {report.conditionSnapshot.windCompass}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: 24h Hourly Evolution */}
                {activeTab === 'evolution' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-white/10">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-bold text-slate-300">Fecha de Análisis:</span>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        Simulación de 00:00 a 23:00
                      </span>
                    </div>

                    <HourlyEvolutionChart spotId={detail.spot.id} dateStr={selectedDate} />
                  </div>
                )}

                {/* TAB 3: Climatology & Seasons */}
                {activeTab === 'climatology' && (
                  <div>
                    <SeasonalClimatologyViewer spotId={detail.spot.id} />
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
