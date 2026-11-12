'use client';

import React from 'react';
import { BrandLogo } from './BrandLogo';
import { usePWAInstall } from '@/presentation/hooks/usePWAInstall';
import { RefreshCw, Download, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavbarProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated?: string;
  onOpenQuickReport?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onRefresh,
  isRefreshing,
  lastUpdated,
  onOpenQuickReport,
}) => {
  const { isInstallable, promptInstall } = usePWAInstall();

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/75 backdrop-blur-xl border-b border-white/10 text-white transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Live Telemetry Badge */}
        <div className="flex items-center space-x-3.5">
          <BrandLogo size={36} />

          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-black text-xl tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
                WAVEZ
              </span>
              <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-[10px] font-black tracking-widest text-cyan-300 uppercase">
                <span>GC</span>
              </span>
            </div>
            
            {/* Live Indicator */}
            <div className="flex items-center space-x-1.5 -mt-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold tracking-wider text-emerald-400/90 uppercase">
                Live Gran Canaria
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* PWA Install Button */}
          {isInstallable && (
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={promptInstall}
              className="flex items-center space-x-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-sm shadow-cyan-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Instalar App</span>
            </motion.button>
          )}

          {/* Quick Report Button */}
          {onOpenQuickReport && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onOpenQuickReport}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition shadow-md shadow-cyan-900/30"
              title="Reportar estado de la playa"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reportar Ola</span>
            </motion.button>
          )}

          {/* Refresh Telemetry */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 bg-slate-900/80 hover:bg-slate-800 active:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-2 rounded-xl border border-white/10 transition disabled:opacity-50"
            title="Sincronizar telemetría de boyas y satélites"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            {lastUpdated && (
              <span className="hidden lg:inline text-[11px] text-slate-400 tabular-nums">
                {new Date(lastUpdated).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
