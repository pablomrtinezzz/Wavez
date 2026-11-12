'use client';

import React from 'react';
import { Zap } from 'lucide-react';
import { cn } from '@/presentation/lib/utils';

interface EnergyBarProps {
  energyKj: number;
  source?: 'scraped' | 'calculated_fallback';
  className?: string;
  showIcon?: boolean;
}

export const EnergyBar: React.FC<EnergyBarProps> = ({
  energyKj,
  source = 'scraped',
  className,
  showIcon = true,
}) => {
  // Max scale benchmark for Gran Canaria surf is ~3000 kJ (heavy Frontón/Confital winter day)
  const maxBenchmarkKj = 2500;
  const percentage = Math.min(100, Math.max(8, (energyKj / maxBenchmarkKj) * 100));

  let energyTheme = {
    barGradient: 'from-blue-500 to-cyan-400',
    textColor: 'text-cyan-300',
    badgeText: 'Suave',
    glow: 'shadow-[0_0_10px_rgba(6,182,212,0.3)]',
  };

  if (energyKj >= 2000) {
    energyTheme = {
      barGradient: 'from-amber-500 via-rose-500 to-purple-600',
      textColor: 'text-purple-300',
      badgeText: 'Extremo 🔥',
      glow: 'shadow-[0_0_14px_rgba(168,85,247,0.4)]',
    };
  } else if (energyKj >= 1200) {
    energyTheme = {
      barGradient: 'from-emerald-400 via-cyan-400 to-blue-500',
      textColor: 'text-emerald-300',
      badgeText: 'Potente',
      glow: 'shadow-[0_0_12px_rgba(16,185,129,0.35)]',
    };
  } else if (energyKj >= 600) {
    energyTheme = {
      barGradient: 'from-cyan-500 to-blue-400',
      textColor: 'text-cyan-300',
      badgeText: 'Moderado',
      glow: 'shadow-[0_0_8px_rgba(6,182,212,0.25)]',
    };
  }

  return (
    <div className={cn('flex flex-col space-y-1', className)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center space-x-1">
          {showIcon && <Zap className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />}
          <span>Energía</span>
        </span>
        <span className="text-[10px] text-slate-500">
          {source === 'scraped' ? 'Live' : 'Est.'}
        </span>
      </div>

      <div className="flex items-baseline space-x-1">
        <span className={cn('text-sm font-black tabular-nums tracking-tight', energyTheme.textColor)}>
          {energyKj.toLocaleString('es-ES')}
        </span>
        <span className="text-[10px] font-semibold text-slate-500">kJ</span>
      </div>

      {/* Progress Bar with glow */}
      <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden p-0.5">
        <div
          style={{ width: `${percentage}%` }}
          className={cn(
            'h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out',
            energyTheme.barGradient,
            energyTheme.glow
          )}
        />
      </div>
    </div>
  );
};
