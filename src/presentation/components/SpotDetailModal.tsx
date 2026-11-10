'use client';

import React, { useEffect, useState } from 'react';
import { SpotDetailDTO } from '@/application/dtos/SpotSummaryDTO';
import { WebcamViewer } from './WebcamViewer';
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
  Compass,
} from 'lucide-react';

interface SpotDetailModalProps {
  spotId: string | null;
  onClose: () => void;
  onOpenReportModal: (spotId: string) => void;
}

export const SpotDetailModal: React.FC<SpotDetailModalProps> = ({
  spotId,
  onClose,
  onOpenReportModal,
}) => {
  const [detail, setDetail] = useState<SpotDetailDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!spotId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/spots/${spotId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success) {
          setDetail(data.data);
        } else {
          setError(data.error || 'Error cargando datos');
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
  }, [spotId]);

  if (!spotId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-800 bg-slate-950/60 sticky top-0 z-10">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {detail ? detail.spot.name : 'Cargando spot...'}
            </h2>
            {detail && (
              <p className="text-xs sm:text-sm text-slate-400 flex items-center space-x-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {detail.spot.location.municipality} · Lat {detail.spot.location.lat.toFixed(3)}, Lng{' '}
                  {detail.spot.location.lng.toFixed(3)}
                </span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {loading && (
            <div className="py-16 text-center text-slate-400">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm">Obteniendo condiciones en tiempo real y webcam...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-sm">
              {error}
            </div>
          )}

          {detail && !loading && (
            <>
              {/* Webcam Component (if configured) */}
              <WebcamViewer webcam={detail.webcam} spotName={detail.spot.name} />

              {/* Conditions & Scores */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Score Card */}
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase">Índice del Spot</span>
                    <div className="flex items-baseline space-x-2 mt-2">
                      <span className="text-4xl font-extrabold text-cyan-400">
                        {detail.score.overallScore}
                      </span>
                      <span className="text-sm text-slate-500">/ 100</span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium mt-1">
                      {detail.score.recommendation}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Swell</span>
                      <span className="font-bold text-white">{detail.score.swellScore} / 40</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Viento</span>
                      <span className="font-bold text-white">{detail.score.windScore} / 35</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Periodo</span>
                      <span className="font-bold text-white">{detail.score.periodScore} / 25</span>
                    </div>
                  </div>
                </div>

                {/* Marine Physical Parameters */}
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl md:col-span-2 space-y-4">
                  <span className="text-xs text-slate-400 font-semibold uppercase">
                    Parámetros Actuales (Open-Meteo + Surf-Forecast)
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <Waves className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Mar de fondo</span>
                      </span>
                      <p className="text-base font-bold text-white mt-1">
                        {detail.conditions.primarySwell.heightM.toFixed(1)} m · {detail.conditions.primarySwell.periodSec.toFixed(0)} s
                      </p>
                      <p className="text-xs text-cyan-300 font-medium">
                        {detail.conditions.primarySwell.compassDir} ({detail.conditions.primarySwell.directionDeg}°)
                      </p>
                    </div>

                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <Wind className="w-3.5 h-3.5 text-blue-400" />
                        <span>Viento (10m)</span>
                      </span>
                      <p className="text-base font-bold text-white mt-1">
                        {Math.round(detail.conditions.wind.speedKmh)} km/h
                      </p>
                      <p className="text-xs text-slate-300">
                        Rachas {Math.round(detail.conditions.wind.gustsKmh)} · {detail.conditions.wind.compassDir}
                      </p>
                    </div>

                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <Zap className="w-3.5 h-3.5 text-purple-400" />
                        <span>Energía Surf-Forecast</span>
                      </span>
                      <p className="text-base font-bold text-purple-300 mt-1">
                        {detail.energy.energyKj} kJ
                      </p>
                      <p className="text-xs text-slate-400">
                        {detail.energy.source === 'scraped' ? 'Scrapeado oficial' : 'Fórmula estimada'}
                      </p>
                    </div>
                  </div>

                  {/* Pros & Cons list */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2">
                    <div className="space-y-1">
                      {detail.score.pros.map((p, idx) => (
                        <div key={idx} className="flex items-center space-x-1.5 text-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1">
                      {detail.score.cons.map((c, idx) => (
                        <div key={idx} className="flex items-center space-x-1.5 text-amber-300">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Community Reports / Photo Stream */}
              <div className="border border-slate-800 rounded-2xl p-4 sm:p-5 bg-slate-950/40">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <Camera className="w-4 h-4 text-cyan-400" />
                      <span>Fotos y Reportes de la Comunidad</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Verificación en tiempo real con metadatos EXIF y GPS
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      onOpenReportModal(detail.spot.id);
                    }}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5"
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
                        className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
                      >
                        <div className="relative aspect-video bg-black overflow-hidden">
                          <img
                            src={report.photoUrl}
                            alt={`Reporte de ${detail.spot.name}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {report.isRealtimeVerified && (
                            <div className="absolute top-2 left-2 bg-emerald-950/90 border border-emerald-500/80 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1 backdrop-blur-md">
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                              <span>En Vivo Verificado</span>
                            </div>
                          )}
                        </div>

                        <div className="p-3 text-xs space-y-1.5">
                          {report.userNote && (
                            <p className="text-slate-200 font-medium italic">&quot;{report.userNote}&quot;</p>
                          )}
                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>{new Date(report.capturedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                            </span>
                            {report.conditionSnapshot && (
                              <span className="text-cyan-400">
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};
