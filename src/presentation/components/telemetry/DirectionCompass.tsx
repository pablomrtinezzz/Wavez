'use client';

import React from 'react';
import { ArrowUp, Navigation } from 'lucide-react';
import { cn } from '@/presentation/lib/utils';

interface DirectionCompassProps {
  degrees: number;
  compassDir: string;
  type?: 'swell' | 'wind';
  className?: string;
  size?: 'sm' | 'md';
}

export const DirectionCompass: React.FC<DirectionCompassProps> = ({
  degrees,
  compassDir,
  type = 'swell',
  className,
  size = 'sm',
}) => {
  // Arrow rotation: 0° is North (pointing up)
  const rotationDeg = (degrees % 360 + 360) % 360;

  const isWind = type === 'wind';
  const iconColor = isWind ? 'text-sky-400' : 'text-cyan-400';
  const bgColor = isWind ? 'bg-sky-500/10 border-sky-500/20' : 'bg-cyan-500/10 border-cyan-500/20';

  return (
    <div className={cn('inline-flex items-center space-x-1.5', className)}>
      <div
        className={cn(
          'relative rounded-full flex items-center justify-center border transition-transform duration-300',
          bgColor,
          size === 'sm' ? 'w-5 h-5' : 'w-6 h-6'
        )}
      >
        <div
          style={{ transform: `rotate(${rotationDeg}deg)` }}
          className="transition-transform duration-500 ease-out flex items-center justify-center"
        >
          {isWind ? (
            <Navigation className={cn('w-2.5 h-2.5 fill-current', iconColor)} />
          ) : (
            <ArrowUp className={cn('w-3 h-3 stroke-[2.5]', iconColor)} />
          )}
        </div>
      </div>
      <span className="text-[11px] font-bold text-slate-300 tabular-nums">
        {compassDir} <span className="text-slate-500 text-[10px] font-normal">{Math.round(degrees)}°</span>
      </span>
    </div>
  );
};
