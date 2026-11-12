'use client';

import React from 'react';

export const TelemetrySkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4 animate-shimmer"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-5 w-40 bg-slate-800/80 rounded-lg" />
              <div className="h-3 w-28 bg-slate-800/50 rounded-md" />
            </div>
            <div className="w-12 h-12 rounded-full bg-slate-800/80" />
          </div>

          <div className="grid grid-cols-4 gap-2 py-3 bg-slate-950/40 rounded-xl p-3 border border-white/5">
            <div className="h-10 bg-slate-800/50 rounded-lg" />
            <div className="h-10 bg-slate-800/50 rounded-lg" />
            <div className="h-10 bg-slate-800/50 rounded-lg" />
            <div className="h-10 bg-slate-800/50 rounded-lg" />
          </div>

          <div className="h-4 w-3/4 bg-slate-800/40 rounded-md" />

          <div className="h-9 w-full bg-slate-800/60 rounded-xl" />
        </div>
      ))}
    </div>
  );
};
