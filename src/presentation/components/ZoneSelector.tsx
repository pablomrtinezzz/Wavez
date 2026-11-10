'use client';

import React from 'react';
import { ZoneId } from '@/domain/models/Spot';
import { Flame, Compass, Mountain, Sun, Navigation } from 'lucide-react';

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
  const tabs: { id: FilterOption; label: string; icon: React.ReactNode }[] = [
    {
      id: 'top',
      label: 'Top Recomendados',
      icon: <Flame className="w-4 h-4 text-amber-400" />,
    },
    {
      id: 'las-palmas',
      label: 'Las Palmas',
      icon: <Compass className="w-4 h-4 text-cyan-400" />,
    },
    {
      id: 'costa-norte',
      label: 'Costa Norte',
      icon: <Mountain className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'telde-este',
      label: 'Telde / Este',
      icon: <Sun className="w-4 h-4 text-orange-400" />,
    },
    {
      id: 'sur-sureste',
      label: 'Sur / Sureste',
      icon: <Navigation className="w-4 h-4 text-indigo-400" />,
    },
  ];

  return (
    <div className="flex overflow-x-auto no-scrollbar space-x-2 py-2 px-1">
      {tabs.map((tab) => {
        const isSelected = selectedFilter === tab.id;
        const count = spotCounts[tab.id];

        return (
          <button
            key={tab.id}
            onClick={() => onSelectFilter(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 border ${
              isSelected
                ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-500/20'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {count !== undefined && (
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-md font-bold ${
                  isSelected ? 'bg-cyan-500/30 text-cyan-200' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
