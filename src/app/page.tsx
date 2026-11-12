'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from '@/presentation/components/Navbar';
import { ZoneSelector, FilterOption } from '@/presentation/components/ZoneSelector';
import { SpotCard } from '@/presentation/components/SpotCard';
import { SpotDetailModal } from '@/presentation/components/SpotDetailModal';
import { CameraUploadModal } from '@/presentation/components/CameraUploadModal';
import { PrivateGateModal } from '@/presentation/components/PrivateGateModal';
import { ScoreRadialGauge } from '@/presentation/components/telemetry/ScoreRadialGauge';
import { DirectionCompass } from '@/presentation/components/telemetry/DirectionCompass';
import { TelemetrySkeleton } from '@/presentation/components/telemetry/TelemetrySkeleton';
import { SpotSummaryDTO } from '@/application/dtos/SpotSummaryDTO';
import { Spot } from '@/domain/models/Spot';
import {
  Waves,
  Wind,
  Video,
  ChevronRight,
  Zap,
  Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [summaries, setSummaries] = useState<SpotSummaryDTO[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>('top');
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [reportingSpot, setReportingSpot] = useState<Spot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  // Check auth status
  useEffect(() => {
    fetch('/api/auth/verify')
      .then((res) => res.json())
      .then((data) => {
        setIsAuthenticated(Boolean(data.authenticated));
      })
      .catch(() => {
        setIsAuthenticated(false);
      });
  }, []);

  // Manual refresh handler
  const loadSpots = useCallback(async (isSilent = false) => {
    if (isSilent) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/spots');
      const data = await res.json();
      if (data.success) {
        setSummaries(data.data);
        setLastUpdated(data.updatedAt);
      } else {
        setError(data.error || 'Error cargando datos');
      }
    } catch (err) {
      setError((err as Error).message || 'Error de conexión');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch spots once authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    let isCancelled = false;

    const fetchInitialSpots = async () => {
      try {
        const res = await fetch('/api/spots');
        const data = await res.json();
        if (isCancelled) return;
        if (data.success) {
          setSummaries(data.data);
          setLastUpdated(data.updatedAt);
        } else {
          setError(data.error || 'Error cargando datos');
        }
      } catch (err) {
        if (!isCancelled) setError((err as Error).message || 'Error de conexión');
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    fetchInitialSpots();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated]);

  // Counts per tab
  const spotCounts = useMemo(() => {
    const counts: Record<string, number> = {
      top: 0,
      'las-palmas': 0,
      'costa-norte': 0,
      'telde-este': 0,
      'sur-sureste': 0,
    };

    summaries.forEach((s) => {
      counts[s.spot.zone] = (counts[s.spot.zone] || 0) + 1;
      if (s.score.overallScore >= 65) {
        counts.top += 1;
      }
    });

    return counts;
  }, [summaries]);

  // Filter spots based on selection
  const filteredSpots = useMemo(() => {
    if (selectedFilter === 'top') {
      return [...summaries]
        .sort((a, b) => b.score.overallScore - a.score.overallScore)
        .slice(0, 8);
    }
    return summaries.filter((s) => s.spot.zone === selectedFilter);
  }, [summaries, selectedFilter]);

  // Top spot recommendation (#1 overall)
  const topSpot = useMemo(() => {
    if (summaries.length === 0) return null;
    return summaries[0]; // Already sorted by overallScore descending from API
  }, [summaries]);

  if (isAuthenticated === false) {
    return <PrivateGateModal onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Top Telemetry Floating Navbar */}
      <Navbar
        onRefresh={() => loadSpots(true)}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
        onOpenQuickReport={() => {
          if (topSpot) setReportingSpot(topSpot.spot);
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Spotlight Hero: #1 Ranked Spot in Gran Canaria */}
        {topSpot && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl glass-panel-elevated p-6 sm:p-8 shadow-2xl border border-cyan-500/30 group"
          >
            {/* Ambient Spotlight Blur */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-cyan-500/15 via-blue-600/10 to-transparent rounded-full blur-3xl pointer-events-none -mr-32 -mt-32" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-xs font-black tracking-widest uppercase">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>#1 BAÑO DEL DÍA EN GRAN CANARIA</span>
                </div>

                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                    {topSpot.spot.name}
                  </h1>
                  {topSpot.spot.webcam && (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-red-950/80 border border-red-700/60 text-red-400 text-xs font-bold">
                      <Video className="w-3.5 h-3.5" />
                      <span>CAM LIVE</span>
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                  {topSpot.score.recommendation} — {topSpot.score.pros.join(' · ')}
                </p>

                {/* Micro Telemetry Pills */}
                <div className="flex flex-wrap items-center gap-2.5 pt-2 text-xs">
                  <div className="bg-slate-950/80 px-3.5 py-2 rounded-xl border border-white/5 flex items-center space-x-2">
                    <Waves className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-bold text-white tabular-nums">
                      {topSpot.conditions.primarySwell.heightM.toFixed(1)}m · {topSpot.conditions.primarySwell.periodSec.toFixed(0)}s
                    </span>
                    <DirectionCompass
                      degrees={topSpot.conditions.primarySwell.directionDeg}
                      compassDir={topSpot.conditions.primarySwell.compassDir}
                      type="swell"
                    />
                  </div>

                  <div className="bg-slate-950/80 px-3.5 py-2 rounded-xl border border-white/5 flex items-center space-x-2">
                    <Wind className="w-3.5 h-3.5 text-blue-400" />
                    <span className="font-bold text-white tabular-nums">
                      {Math.round(topSpot.conditions.wind.speedKmh)} km/h
                    </span>
                    <DirectionCompass
                      degrees={topSpot.conditions.wind.directionDeg}
                      compassDir={topSpot.conditions.wind.compassDir}
                      type="wind"
                    />
                  </div>

                  <div className="bg-purple-950/60 px-3.5 py-2 rounded-xl border border-purple-800/80 text-purple-300 font-bold flex items-center space-x-1.5 tabular-nums">
                    <Zap className="w-3 h-3 text-purple-400 fill-purple-400" />
                    <span>{topSpot.energy.energyKj.toLocaleString('es-ES')} kJ</span>
                  </div>
                </div>
              </div>

              {/* Gauge and CTA button */}
              <div className="flex sm:flex-row lg:flex-col items-center lg:items-end justify-between gap-5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/5">
                <div className="flex items-center space-x-3 text-right">
                  <div className="hidden sm:block text-right">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      SpotScore
                    </span>
                    <span className="text-xs font-semibold text-emerald-400">
                      {topSpot.score.pros[0] || 'Condiciones Óptimas'}
                    </span>
                  </div>
                  <ScoreRadialGauge score={topSpot.score.overallScore} size={72} strokeWidth={6} />
                </div>

                <button
                  onClick={() => setSelectedSpotId(topSpot.spot.id)}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-xl shadow-cyan-500/25 transition duration-200 flex items-center space-x-2"
                >
                  <span>Ver Webcam & Telemetría</span>
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Zone Selector Interactive Pills */}
        <div className="sticky top-16 z-30 bg-slate-950/90 backdrop-blur-md pt-2 pb-2">
          <ZoneSelector
            selectedFilter={selectedFilter}
            onSelectFilter={setSelectedFilter}
            spotCounts={spotCounts}
          />
        </div>

        {/* Shimmer Loading State */}
        {isLoading && <TelemetrySkeleton />}

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Animated Spots Grid */}
        {!isLoading && (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            <AnimatePresence mode="popLayout">
              {filteredSpots.map((summary, idx) => (
                <SpotCard
                  key={summary.spot.id}
                  summary={summary}
                  rankIndex={selectedFilter === 'top' ? idx : undefined}
                  onSelectSpot={(id) => setSelectedSpotId(id)}
                  onOpenReportModal={(id) => {
                    const s = summaries.find((item) => item.spot.id === id);
                    if (s) setReportingSpot(s.spot);
                  }}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* Spot Detail & Webcam Modal */}
      <SpotDetailModal
        spotId={selectedSpotId}
        onClose={() => setSelectedSpotId(null)}
        onOpenReportModal={(id) => {
          const s = summaries.find((item) => item.spot.id === id);
          if (s) setReportingSpot(s.spot);
        }}
      />

      {/* Real-time Camera Upload Modal with Verification Scanner */}
      <CameraUploadModal
        spot={reportingSpot}
        onClose={() => setReportingSpot(null)}
        onReportSubmitted={() => loadSpots(true)}
      />
    </div>
  );
}
