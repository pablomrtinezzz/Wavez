'use client';

import React, { useState } from 'react';
import { Lock, Waves, KeyRound, ArrowRight } from 'lucide-react';

interface PrivateGateModalProps {
  onAuthenticated: () => void;
}

export const PrivateGateModal: React.FC<PrivateGateModalProps> = ({ onAuthenticated }) => {
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

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
      }
    } catch {
      setError('Error al conectar con el servidor.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center">
        <div className="w-12 h-12 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/20">
          <Waves className="w-6 h-6 text-white" />
        </div>

        <h2 className="text-xl font-extrabold text-white">Wavez Gran Canaria</h2>
        <p className="text-xs text-slate-400 mt-1 mb-6">
          Acceso privado inicial de desarrollo
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <KeyRound className="w-4 h-4" />
            </div>
            <input
              type="password"
              placeholder="Introduce clave de acceso..."
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              autoFocus
            />
          </div>

          {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center space-x-2 text-sm shadow-md shadow-cyan-900/40"
          >
            <span>{isVerifying ? 'Verificando...' : 'Acceder al Radar'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-[10px] text-slate-600 mt-6">
          Clave por defecto: <code className="text-slate-400">grancanariasurf</code>
        </p>
      </div>
    </div>
  );
};
