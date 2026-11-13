'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from '@/presentation/components/Navbar';
import { ZoneSelector, FilterOption } from '@/presentation/components/ZoneSelector';
import { SpotCard } from '@/presentation/components/SpotCard';
import { SpotDetailModal } from '@/presentation/components/SpotDetailModal';
import { CameraUploadModal } from '@/presentation/components/CameraUploadModal';
import { PrivateGateModal } from '@/presentation/components/PrivateGateModal';
import { IslandRadarMap } from '@/presentation/components/IslandRadarMap';
import { WebcamWallView } from '@/presentation/components/WebcamWallView';
import { CompactTelemetryTable } from '@/presentation/components/CompactTelemetryTable';
import { ObsidianCallout } from '@/presentation/components/ObsidianCallout';
import { TimelineScrubber, TimelineState } from '@/presentation/components/TimelineScrubber';
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
  Search,
  LayoutGrid,
  MapPin,
  TableProperties,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ViewMode = 'bento' | 'radar' | 'webcams' | 'table';
type SortOption = 'score' | 'energy' | 'height' | 'name';

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [summaries, setSummaries] = useState<SpotSummaryDTO[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>('top');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('bento');
  const [sortBy, setSortBy] = useState<SortOption>('score');
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [reportingSpot, setReportingSpot] = useState<Spot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  // Timeline State: 15-day range (-7 days past, today, +7 days forecast) + 24-hour scrubber
  const [timelineState, setTimelineState] = useState<TimelineState>({
    dateStr: '2026-11-13',
    hour: 12,
    isLive: true,
  });

  // Client hydration sync with real browser date/hour
  useEffect(() => {
    const now = new Date();
    setTimelineState({
      dateStr: now.toISOString().split('T')[0],
      hour: now.getHours(),
      isLive: true,
    });
  }, []);

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

  // Fetch spots whenever authentication or timelineState changes
  useEffect(() => {
    if (!isAuthenticated) return;
    let isCancelled = false;

    const fetchSpots = async () => {
      setIsRefreshing(true);
      setError(null);

      try {
        const url = timelineState.isLive
          ? '/api/spots'
          : `/api/spots?date=${timelineState.dateStr}&hour=${timelineState.hour}`;

        const res = await fetch(url);
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
        if (!isCancelled) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    fetchSpots();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, timelineState]);

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

  // Filter and sort spots
  const filteredSpots = useMemo(() => {
    let result = [...summaries];

    // Filter by zone / top
    if (selectedFilter === 'top') {
      result = result.filter((s) => s.score.overallScore >= 60);
      if (result.length < 5) {
        result = [...summaries].slice(0, 6);
      }
    } else {
      result = result.filter((s) => s.spot.zone === selectedFilter);
    }

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.spot.name.toLowerCase().includes(q) ||
          s.spot.location.municipality.toLowerCase().includes(q) ||
          s.spot.breakType.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'score') return b.score.overallScore - a.score.overallScore;
      if (sortBy === 'energy') return b.energy.energyKj - a.energy.energyKj;
      if (sortBy === 'height')
        return b.conditions.primarySwell.heightM - a.conditions.primarySwell.heightM;
      if (sortBy === 'name') return a.spot.name.localeCompare(b.spot.name);
      return 0;
    });

    return result;
  }, [summaries, selectedFilter, searchQuery, sortBy]);

  // Top spot in Gran Canaria for current timeline
  const topSpot = useMemo(() => {
    if (summaries.length === 0) return null;
    return [...summaries].sort((a, b) => b.score.overallScore - a.score.overallScore)[0];
  }, [summaries]);

  // Spots with active webcams count
  const spotsWithWebcamsCount = useMemo(() => {
    return summaries.filter((s) => Boolean(s.spot.webcam)).length;
  }, [summaries]);

  // Reset timeline to live
  const handleResetToLive = () => {
    const now = new Date();
    setTimelineState({
      dateStr: now.toISOString().split('T')[0],
      hour: now.getHours(),
      isLive: true,
    });
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#060D17] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-cyan-400">INICIALIZANDO TELEMETRÍA WAVEZ...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return (
      <PrivateGateModal
        onAuthenticated={() => setIsAuthenticated(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#060D17] flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Navbar with Telemetry Header */}
      <Navbar
        onRefresh={() => {
          handleResetToLive();
        }}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
        onOpenQuickReport={() => {
          if (summaries.length > 0) {
            setReportingSpot(summaries[0].spot);
          }
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Timeline Scrubber: Multi-day (-7 to +7 days) & 24h Hourly simulation */}
        <TimelineScrubber
          timelineState={timelineState}
          onChange={setTimelineState}
          isLoading={isRefreshing}
        />

        {/* Non-live simulation indicator banner */}
        {!timelineState.isLive && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200"
          >
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Visualizando telemetría calculada para el{' '}
                <strong className="text-white font-mono">{timelineState.dateStr}</strong> a las{' '}
                <strong className="text-white font-mono">
                  {String(timelineState.hour).padStart(2, '0')}:00
                </strong>
                . El ranking y puntuaciones reflejan las condiciones estimadas para este instante.
              </span>
            </div>
            <button
              onClick={handleResetToLive}
              className="ml-3 shrink-0 flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition text-[11px]"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Volver a Directo</span>
            </button>
          </motion.div>
        )}

        {/* Spotlight Hero: #1 Ranked Spot in Gran Canaria */}
        {topSpot && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl glass-panel-elevated p-6 sm:p-8 shadow-2xl border border-cyan-500/30 group"
          >
            {/* Ambient Spotlight Blur */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-cyan-500/15 via-blue-600/10 to-transparent rounded-full blur-3xl pointer-events-none -mr-32 -mt-32" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-xs font-black tracking-widest uppercase">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {timelineState.isLive ? '#1 BAÑO DEL DÍA EN GRAN CANARIA' : '#1 EN ESTE HORARIO'}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                    {topSpot.spot.name}
                  </h1>
                  {topSpot.spot.webcam && (
                    <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-700/60 text-red-400 text-xs font-bold">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
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
                  <span>Ver Evolución & Webcams</span>
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Obsidian-Style Daily Briefing Callout */}
        {topSpot && !isLoading && (
          <ObsidianCallout type="surf" title="Resumen Oceanográfico · Gran Canaria">
            Tren de oleaje con <strong>{topSpot.conditions.primarySwell.heightM.toFixed(1)} m</strong> y{' '}
            <strong>{topSpot.conditions.primarySwell.periodSec.toFixed(0)} segundos de periodo</strong> desde el cuadrante{' '}
            <strong>{topSpot.conditions.primarySwell.compassDir}</strong>. Viento medido en{' '}
            <strong>{Math.round(topSpot.conditions.wind.speedKmh)} km/h {topSpot.conditions.wind.compassDir}</strong>.
            {spotsWithWebcamsCount > 0 && (
              <> Disponibles <strong>{spotsWithWebcamsCount} webcams oficiales en vivo</strong> para monitorizar los picos en tiempo real.</>
            )}
          </ObsidianCallout>
        )}

        {/* Control Bar: View Switcher, Search & Sort */}
        <div className="glass-panel rounded-2xl p-3 sm:p-4 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* View Mode Switcher (Bento / Radar / Webcams / Table) */}
          <div className="flex items-center space-x-1 bg-slate-950/80 p-1 rounded-xl border border-white/5 w-full md:w-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => setViewMode('bento')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                viewMode === 'bento'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Bento Cards</span>
            </button>

            <button
              onClick={() => setViewMode('radar')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                viewMode === 'radar'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Mapa Radar</span>
            </button>

            <button
              onClick={() => setViewMode('webcams')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                viewMode === 'webcams'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Muro Webcams ({spotsWithWebcamsCount})</span>
            </button>

            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                viewMode === 'table'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TableProperties className="w-3.5 h-3.5" />
              <span>Matriz Tabla</span>
            </button>
          </div>

          {/* Search Input & Sort Selector */}
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar spot o municipio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-slate-950/80 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 transition cursor-pointer"
              >
                <option value="score">Ordenar: Score</option>
                <option value="energy">Ordenar: kJ Surf-Forecast</option>
                <option value="height">Ordenar: Altura de Ola</option>
                <option value="name">Ordenar: Nombre A-Z</option>
              </select>
            </div>
          </div>
        </div>

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

        {/* Views Container */}
        {!isLoading && (
          <>
            {/* View 1: Bento Cards */}
            {viewMode === 'bento' && (
              <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                <AnimatePresence mode="popLayout">
                  {filteredSpots.map((summary, idx) => (
                    <SpotCard
                      key={summary.spot.id}
                      summary={summary}
                      rankIndex={selectedFilter === 'top' && searchQuery === '' ? idx : undefined}
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

            {/* View 2: Interactive Island Radar Map */}
            {viewMode === 'radar' && (
              <IslandRadarMap
                summaries={summaries}
                onSelectSpot={(id) => setSelectedSpotId(id)}
              />
            )}

            {/* View 3: Live Webcams Surveillance Wall */}
            {viewMode === 'webcams' && (
              <WebcamWallView
                summaries={summaries}
                onSelectSpot={(id) => setSelectedSpotId(id)}
              />
            )}

            {/* View 4: Compact Telemetry Table */}
            {viewMode === 'table' && (
              <CompactTelemetryTable
                summaries={filteredSpots}
                onSelectSpot={(id) => setSelectedSpotId(id)}
                onOpenReportModal={(id) => {
                  const s = summaries.find((item) => item.spot.id === id);
                  if (s) setReportingSpot(s.spot);
                }}
              />
            )}

            {filteredSpots.length === 0 && (
              <div className="py-16 text-center text-slate-500 text-xs">
                No se encontraron spots que coincidan con &quot;{searchQuery}&quot; en la zona seleccionada.
              </div>
            )}
          </>
        )}
      </main>

      {/* Spot Detail & Webcam Modal */}
      <SpotDetailModal
        spotId={selectedSpotId}
        initialDate={timelineState.dateStr}
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
        onReportSubmitted={() => {
          handleResetToLive();
        }}
      />
    </div>
  );
}
