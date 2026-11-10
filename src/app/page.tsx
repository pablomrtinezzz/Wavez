'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from '@/presentation/components/Navbar';
import { ZoneSelector, FilterOption } from '@/presentation/components/ZoneSelector';
import { SpotCard } from '@/presentation/components/SpotCard';
import { SpotDetailModal } from '@/presentation/components/SpotDetailModal';
import { CameraUploadModal } from '@/presentation/components/CameraUploadModal';
import { PrivateGateModal } from '@/presentation/components/PrivateGateModal';
import { SpotSummaryDTO } from '@/application/dtos/SpotSummaryDTO';
import { Spot, ZoneId } from '@/domain/models/Spot';
import {
  Flame,
  Waves,
  Compass,
  Wind,
  ShieldCheck,
  Video,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

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

  // Fetch spots and conditions
  const loadSpots = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
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

  useEffect(() => {
    if (isAuthenticated) {
      loadSpots();
    }
  }, [isAuthenticated, loadSpots]);

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

  // Top spot recommendation (hero)
  const topSpot = useMemo(() => {
    if (summaries.length === 0) return null;
    return summaries[0]; // Already sorted by overallScore descending from API
  }, [summaries]);

  if (isAuthenticated === false) {
    return <PrivateGateModal onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        onRefresh={() => loadSpots(true)}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Spotlight Hero: "El Spot del Día" */}
        {topSpot && !isLoading && (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 p-5 sm:p-7 shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold tracking-wide">
                  <Flame className="w-3.5 h-3.5 text-cyan-400" />
                  <span>MEJOR OPCIÓN AHORA EN GRAN CANARIA</span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  {topSpot.spot.name}
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 font-medium">
                  {topSpot.score.recommendation} — {topSpot.score.pros.join(' · ')}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                  <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center space-x-1.5">
                    <Waves className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      {topSpot.conditions.primarySwell.heightM.toFixed(1)}m · {topSpot.conditions.primarySwell.periodSec.toFixed(0)}s {topSpot.conditions.primarySwell.compassDir}
                    </span>
                  </div>

                  <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center space-x-1.5">
                    <Wind className="w-3.5 h-3.5 text-blue-400" />
                    <span>
                      {Math.round(topSpot.conditions.wind.speedKmh)} km/h {topSpot.conditions.wind.compassDir}
                    </span>
                  </div>

                  <div className="bg-purple-950/60 px-3 py-1.5 rounded-xl border border-purple-800/80 text-purple-300 font-bold flex items-center space-x-1.5">
                    <span>{topSpot.energy.energyKj} kJ (Surf-Forecast)</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex md:flex-col items-center md:items-end justify-between gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Puntuación Algorítmica</span>
                  <div className="text-3xl sm:text-4xl font-black text-cyan-400">
                    {topSpot.score.overallScore} <span className="text-base text-slate-500 font-normal">/ 100</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedSpotId(topSpot.spot.id)}
                  className="bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-lg shadow-cyan-500/25 transition duration-150 flex items-center space-x-2"
                >
                  <span>Ver Webcam & Previsión</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Zone Selector Bar */}
        <div className="sticky top-16 z-20 bg-slate-950/90 backdrop-blur-md pt-2 pb-3">
          <ZoneSelector
            selectedFilter={selectedFilter}
            onSelectFilter={setSelectedFilter}
            spotCounts={spotCounts}
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-24 text-center text-slate-400">
            <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm font-medium">Cruzando Open-Meteo Marine y Surf-Forecast...</p>
            <p className="text-xs text-slate-500 mt-1">Calculando calidad y olas en Gran Canaria</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Spots Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSpots.map((summary) => (
              <SpotCard
                key={summary.spot.id}
                summary={summary}
                onSelectSpot={(id) => setSelectedSpotId(id)}
                onOpenReportModal={(id) => {
                  const s = summaries.find((item) => item.spot.id === id);
                  if (s) setReportingSpot(s.spot);
                }}
              />
            ))}
          </div>
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

      {/* Real-time Camera Upload Modal */}
      <CameraUploadModal
        spot={reportingSpot}
        onClose={() => setReportingSpot(null)}
        onReportSubmitted={() => loadSpots(true)}
      />
    </div>
  );
}
