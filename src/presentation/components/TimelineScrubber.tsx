'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Play,
  Pause,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  History,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/presentation/lib/utils';

export interface TimelineState {
  dateStr: string; // 'YYYY-MM-DD'
  hour: number; // 0 - 23
  isLive: boolean;
}

interface TimelineScrubberProps {
  timelineState: TimelineState;
  onChange: (newState: TimelineState) => void;
  isLoading?: boolean;
}

interface DayItem {
  dateStr: string;
  dayName: string;
  dayNum: number;
  monthName: string;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  timelineState,
  onChange,
  isLoading = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Generate 15-day range relative to timelineState.dateStr
  const days = useMemo<DayItem[]>(() => {
    const list: DayItem[] = [];
    const baseDate = new Date(`${timelineState.dateStr}T12:00:00`);

    for (let offset = -7; offset <= 7; offset++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + offset);
      const dateStr = d.toISOString().split('T')[0];
      const isToday = offset === 0 && timelineState.isLive;
      const isPast = offset < 0;
      const isFuture = offset > 0;

      const dayName = d.toLocaleDateString('es-ES', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthName = d.toLocaleDateString('es-ES', { month: 'short' });

      list.push({
        dateStr,
        dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1, 3),
        dayNum,
        monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1, 3),
        isToday,
        isPast,
        isFuture,
      });
    }

    return list;
  }, [timelineState.dateStr, timelineState.isLive]);

  // Auto-play simulation interval
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      onChange({
        ...timelineState,
        isLive: false,
        hour: (timelineState.hour + 1) % 24,
      });
    }, 1600);

    return () => clearInterval(interval);
  }, [isPlaying, timelineState, onChange]);

  // Scroll to active day on initial load
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [timelineState.dateStr]);

  const handleSelectDay = (day: DayItem) => {
    setIsPlaying(false);
    const now = new Date();
    const isToday = day.isToday;
    const currentHour = now.getHours();

    onChange({
      dateStr: day.dateStr,
      hour: isToday ? currentHour : 11,
      isLive: isToday && timelineState.hour === currentHour,
    });
  };

  const handleHourChange = (newHour: number) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const isNow = timelineState.dateStr === todayStr && newHour === now.getHours();

    onChange({
      ...timelineState,
      hour: newHour,
      isLive: isNow,
    });
  };

  const handleResetToLive = () => {
    setIsPlaying(false);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    onChange({
      dateStr: todayStr,
      hour: now.getHours(),
      isLive: true,
    });
  };

  const scrollDays = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Daylight icon helper
  const getDaylightIcon = (hour: number) => {
    if (hour >= 6 && hour < 9) return <Sunrise className="w-4 h-4 text-amber-400" />;
    if (hour >= 9 && hour < 18) return <Sun className="w-4 h-4 text-amber-300" />;
    if (hour >= 18 && hour < 21) return <Sunset className="w-4 h-4 text-orange-400" />;
    return <Moon className="w-4 h-4 text-indigo-300" />;
  };

  const formattedHour = `${String(timelineState.hour).padStart(2, '0')}:00`;

  return (
    <div className="w-full bg-slate-900/90 border border-white/10 rounded-2xl p-3 sm:p-4 shadow-xl backdrop-blur-xl transition-all">
      {/* Top Bar: Mode Indicator + Time scrubbing controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Línea Temporal Multidía
              </span>
              {timelineState.isLive ? (
                <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>AHORA EN VIVO</span>
                </span>
              ) : (
                <span
                  className={cn(
                    'flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border',
                    days.find((d) => d.dateStr === timelineState.dateStr)?.isPast
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                  )}
                >
                  {days.find((d) => d.dateStr === timelineState.dateStr)?.isPast ? (
                    <History className="w-3 h-3 mr-0.5" />
                  ) : (
                    <TrendingUp className="w-3 h-3 mr-0.5" />
                  )}
                  <span>
                    {days.find((d) => d.dateStr === timelineState.dateStr)?.isPast
                      ? 'HISTÓRICO 7 DÍAS'
                      : 'PREVISIÓN 7 DÍAS'}
                  </span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Inspecciona y compara condiciones pasadas, presentes y futuras en tiempo real
            </p>
          </div>
        </div>

        {/* Live Reset button & Play/Pause */}
        <div className="flex items-center space-x-2">
          {!timelineState.isLive && (
            <button
              onClick={handleResetToLive}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 hover:text-white transition border border-white/5 active:scale-95"
              title="Volver al momento actual"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Volver a Hoy</span>
            </button>
          )}

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={cn(
              'flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow-sm active:scale-95',
              isPlaying
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                : 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30'
            )}
            title={isPlaying ? 'Pausar simulación' : 'Simular evolución horaria'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span className="hidden sm:inline">{isPlaying ? 'Pausar' : 'Simular 24h'}</span>
          </button>
        </div>
      </div>

      {/* Date Carousel */}
      <div className="relative mt-3">
        {/* Navigation Arrows */}
        <button
          onClick={() => scrollDays('left')}
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-slate-950/80 border border-white/20 text-slate-300 hover:text-white flex items-center justify-center backdrop-blur-md shadow-lg transition"
          aria-label="Días anteriores"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={() => scrollDays('right')}
          className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-slate-950/80 border border-white/20 text-slate-300 hover:text-white flex items-center justify-center backdrop-blur-md shadow-lg transition"
          aria-label="Días siguientes"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div
          ref={scrollContainerRef}
          className="flex space-x-2 overflow-x-auto py-1 px-4 scrollbar-none scroll-smooth"
        >
          {days.map((day) => {
            const isSelected = day.dateStr === timelineState.dateStr;

            return (
              <button
                key={day.dateStr}
                data-active={isSelected}
                onClick={() => handleSelectDay(day)}
                className={cn(
                  'flex-shrink-0 flex flex-col items-center justify-center w-16 sm:w-20 py-2 px-1.5 rounded-xl border transition-all text-center select-none relative',
                  isSelected
                    ? 'bg-gradient-to-b from-cyan-950/70 to-slate-900 border-cyan-400/80 text-white shadow-lg shadow-cyan-950/50 scale-105'
                    : 'bg-slate-950/50 hover:bg-slate-800/60 border-white/5 text-slate-400 hover:text-slate-200'
                )}
              >
                {/* Status Indicator */}
                <span className="text-[10px] uppercase font-bold tracking-wider">
                  {day.isToday ? (
                    <span className="text-cyan-400 font-extrabold">Hoy</span>
                  ) : (
                    day.dayName
                  )}
                </span>

                <span
                  className={cn(
                    'text-lg font-black tabular-nums my-0.5',
                    isSelected ? 'text-white' : 'text-slate-200'
                  )}
                >
                  {day.dayNum}
                </span>

                <span className="text-[10px] text-slate-500 font-medium">
                  {day.monthName}
                </span>

                {/* Past / Future Pill */}
                {day.isPast && !isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500/70 mt-1" />
                )}
                {day.isFuture && !isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/70 mt-1" />
                )}
                {isSelected && (
                  <motion.div
                    layoutId="activeDayIndicator"
                    className="absolute -bottom-1 w-6 h-0.5 bg-cyan-400 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hourly Scrubber Slider */}
      <div className="mt-4 pt-3 border-t border-white/5 bg-slate-950/40 rounded-xl p-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-300">Hora Seleccionada:</span>
            <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg bg-slate-800 border border-white/10 text-cyan-300 font-mono text-sm font-bold tabular-nums">
              {getDaylightIcon(timelineState.hour)}
              <span>{formattedHour}</span>
            </div>
          </div>

          {/* Quick preset jumps */}
          <div className="flex items-center space-x-1.5 text-xs">
            <button
              onClick={() => handleHourChange(7)}
              className={cn(
                'px-2 py-1 rounded-lg text-[11px] font-medium transition',
                timelineState.hour === 7
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              )}
            >
              🌅 07:00
            </button>
            <button
              onClick={() => handleHourChange(12)}
              className={cn(
                'px-2 py-1 rounded-lg text-[11px] font-medium transition',
                timelineState.hour === 12
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              )}
            >
              ☀️ 12:00
            </button>
            <button
              onClick={() => handleHourChange(18)}
              className={cn(
                'px-2 py-1 rounded-lg text-[11px] font-medium transition',
                timelineState.hour === 18
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              )}
            >
              🌇 18:00
            </button>
          </div>
        </div>

        {/* Range Slider */}
        <div className="relative pt-1 pb-1">
          <input
            type="range"
            min={0}
            max={23}
            step={1}
            value={timelineState.hour}
            onChange={(e) => handleHourChange(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
            aria-label="Selector de hora del día"
          />

          {/* Hour markers */}
          <div className="flex justify-between text-[10px] text-slate-500 mt-1.5 font-mono select-none px-1">
            <span>00h</span>
            <span>04h</span>
            <span className="text-amber-400/80">08h</span>
            <span className="text-amber-300 font-bold">12h</span>
            <span className="text-orange-400/80">16h</span>
            <span className="text-indigo-400/80">20h</span>
            <span>23h</span>
          </div>
        </div>
      </div>
    </div>
  );
};
