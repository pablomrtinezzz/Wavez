'use client';

import React, { useState } from 'react';
import { BrandLogo } from './BrandLogo';
import { Lock, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface PrivateGateModalProps {
  onAuthenticated: () => void;
}

export const PrivateGateModal: React.FC<PrivateGateModalProps> = ({ onAuthenticated }) => {
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [shake, setShake] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkey.trim()) return;

    setIsVerifying(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onAuthenticated();
      } else {
        setError(data.error || 'Clave de acceso incorrecta');
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch {
      setError('Error al conectar con el servidor.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl">
      {/* Background ambient wave curves */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <svg
          className="absolute -bottom-20 left-0 w-full h-96 text-cyan-500/30"
          viewBox="0 0 1440 320"
          fill="none"
        >
          <path
            fill="currentColor"
            d="M0,192L48,197.3C96,203,192,213,288,197.3C384,181,480,139,576,144C672,149,768,203,864,218.7C960,235,1056,213,1152,186.7C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`w-full max-w-sm glass-panel-elevated rounded-3xl p-7 shadow-2xl text-center relative z-10 ${
          shake ? 'animate-shake' : ''
        }`}
      >
        <div className="flex justify-center mb-4">
          <BrandLogo size={56} />
        </div>

        <div className="space-y-1 mb-6">
          <h2 className="text-2xl font-black text-white tracking-tight">WAVEZ</h2>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-[10px] font-black text-cyan-300 uppercase tracking-widest">
            <Lock className="w-3 h-3 text-amber-400" />
            <span>Club Privado Gran Canaria</span>
          </div>
          <p className="text-xs text-slate-400 pt-2">
            Introduce tu clave de acceso privada para desbloquear la telemetría en tiempo real.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <KeyRound className="w-4 h-4 text-cyan-400" />
            </div>
            <input
              type="password"
              placeholder="Introduce clave de acceso..."
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              className="w-full bg-slate-950/90 border border-white/10 rounded-2xl py-3.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition shadow-inner"
              autoFocus
            />
          </div>

          {error && <p className="text-xs text-rose-400 font-bold">{error}</p>}

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:bg-cyan-700 text-white font-black py-3.5 rounded-2xl transition flex items-center justify-center space-x-2 text-xs uppercase tracking-wider shadow-lg shadow-cyan-950/50"
          >
            <span>{isVerifying ? 'Autenticando...' : 'Acceder al Radar'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center space-x-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
          <span>Clave por defecto: <code className="text-slate-400 font-bold">grancanariasurf</code></span>
        </div>
      </motion.div>
    </div>
  );
};
