'use client';

import React from 'react';
import { Waves, Lock, RefreshCw, Compass } from 'lucide-react';

interface NavbarProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onRefresh, isRefreshing, lastUpdated }) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/20">
            <Waves className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
                WAVEZ
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-semibold tracking-wide">
                GRAN CANARIA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Radar de Surf · Open-Meteo & Surf-Forecast
            </p>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="hidden md:flex items-center space-x-1.5 text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Modo Privado</span>
          </div>

          {lastUpdated && (
            <div className="text-[11px] text-slate-400 hidden lg:block">
              Actualizado: {new Date(lastUpdated).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 text-xs font-medium px-3 py-2 rounded-lg border border-slate-700 transition duration-150 disabled:opacity-50"
            title="Refrescar condiciones"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
