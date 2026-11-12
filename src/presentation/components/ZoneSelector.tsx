'use client';

import React from 'react';
import { ZoneId } from '@/domain/models/Spot';
import { Flame, Compass, Mountain, Sun, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/presentation/lib/utils';

export type FilterOption = 'top' | ZoneId;

interface ZoneSelectorProps {
  selectedFilter: FilterOption;
  onSelectFilter: (filter: FilterOption) => void;
  spotCounts: Record<string, number>;
}

export const ZoneSelector: React.FC<ZoneSelectorProps> = ({
  selectedFilter,
  onSelectFilter,
  spotCounts,
}) => {
  const tabs: { id: FilterOption; label: string; icon: React.ReactNode; accent: string }[] = [
    {
      id: 'top',
      label: 'Top Baños',
      icon: <Flame className="w-3.5 h-3.5 text-amber-400" />,
      accent: 'text-amber-400',
    },
    {
      id: 'las-palmas',
      label: 'Las Palmas',
      icon: <Compass className="w-3.5 h-3.5 text-cyan-400" />,
      accent: 'text-cyan-400',
    },
    {
      id: 'costa-norte',
      label: 'Costa Norte',
      icon: <Mountain className="w-3.5 h-3.5 text-emerald-400" />,
      accent: 'text-emerald-400',
    },
    {
      id: 'telde-este',
      label: 'Telde / Este',
      icon: <Sun className="w-3.5 h-3.5 text-orange-400" />,
      accent: 'text-orange-400',
    },
    {
      id: 'sur-sureste',
      label: 'Sur / Sureste',
      icon: <Navigation className="w-3.5 h-3.5 text-indigo-400" />,
      accent: 'text-indigo-400',
    },
  ];

  return (
    <div className="relative w-full overflow-x-auto no-scrollbar py-2">
      <div className="flex items-center space-x-2 min-w-max p-1 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/5">
        {tabs.map((tab) => {
          const isSelected = selectedFilter === tab.id;
          const count = spotCounts[tab.id];

          return (
            <button
              key={tab.id}
              onClick={() => onSelectFilter(tab.id)}
              className={cn(
                'relative flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors select-none',
                isSelected ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              {/* Animated Sliding Active Background */}
              {isSelected && (
                <motion.div
                  layoutId="activeZonePill"
                  className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/10 rounded-xl border border-cyan-500/40 shadow-sm shadow-cyan-500/20"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}

              <span className="relative z-10">{tab.icon}</span>
              <span className="relative z-10">{tab.label}</span>

              {count !== undefined && (
                <span
                  className={cn(
                    'relative z-10 text-[10px] px-1.5 py-0.5 rounded-md font-black tabular-nums',
                    isSelected
                      ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/30'
                      : 'bg-slate-800 text-slate-500'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
