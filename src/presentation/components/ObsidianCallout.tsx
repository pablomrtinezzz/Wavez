'use client';

import React from 'react';
import { Info, AlertTriangle, Lightbulb, Waves } from 'lucide-react';
import { cn } from '@/presentation/lib/utils';

export type CalloutType = 'info' | 'tip' | 'warning' | 'surf';

interface ObsidianCalloutProps {
  type?: CalloutType;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const ObsidianCallout: React.FC<ObsidianCalloutProps> = ({
  type = 'surf',
  title,
  children,
  className,
}) => {
  const configs: Record<
    CalloutType,
    { icon: React.ReactNode; border: string; bg: string; titleColor: string }
  > = {
    surf: {
      icon: <Waves className="w-4 h-4 text-cyan-400 shrink-0" />,
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-950/20',
      titleColor: 'text-cyan-300',
    },
    tip: {
      icon: <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0" />,
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-950/20',
      titleColor: 'text-emerald-300',
    },
    info: {
      icon: <Info className="w-4 h-4 text-blue-400 shrink-0" />,
      border: 'border-blue-500/30',
      bg: 'bg-blue-950/20',
      titleColor: 'text-blue-300',
    },
    warning: {
      icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
      border: 'border-amber-500/30',
      bg: 'bg-amber-950/20',
      titleColor: 'text-amber-300',
    },
  };

  const current = configs[type];

  return (
    <div
      className={cn(
        'rounded-2xl border p-4 sm:p-5 backdrop-blur-md relative overflow-hidden transition-all duration-200',
        current.border,
        current.bg,
        className
      )}
    >
      <div className="flex items-center space-x-2.5 mb-2">
        {current.icon}
        <h4 className={cn('text-xs sm:text-sm font-black uppercase tracking-wider', current.titleColor)}>
          {title}
        </h4>
      </div>
      <div className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
        {children}
      </div>
    </div>
  );
};
