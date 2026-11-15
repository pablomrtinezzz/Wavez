'use client';

import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Spinner } from '@/presentation/components/ui/primitives';
import { Wordmark } from './SiteChrome';

export function AccessGate({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkey.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) onAuthenticated();
      else setError(data?.error || 'Clave incorrecta');
    } catch {
      setError('No se pudo conectar. Revisa tu conexión.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-dvh flex-col justify-between px-6 py-8 sm:px-12">
      <Wordmark />
      <div className="mx-auto w-full max-w-md animate-fade-in">
        <p className="eyebrow">Acceso privado</p>
        <h1 className="display mt-3 text-5xl sm:text-6xl">El parte de olas de Gran Canaria.</h1>
        <p className="mt-4 text-ink-2">Wavez está en fase privada. Introduce tu clave para ver las condiciones.</p>
        <form onSubmit={submit} className="mt-10">
          <label htmlFor="passkey" className="text-sm text-ink-2">
            Clave de acceso
          </label>
          <div className="mt-2 flex items-center gap-3 border-b border-ink pb-2 focus-within:border-accent">
            <input
              id="passkey"
              type="password"
              autoComplete="current-password"
              autoFocus
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              className="flex-1 bg-transparent text-lg text-ink outline-none placeholder:text-ink-3"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'passkey-error' : undefined}
            />
            <button
              type="submit"
              disabled={busy || !passkey.trim()}
              aria-label="Entrar"
              className="flex size-10 items-center justify-center rounded-full bg-ink text-sand transition hover:bg-accent disabled:opacity-40"
            >
              {busy ? <Spinner className="border-sand/40 border-t-sand" /> : <ArrowRight className="size-4" />}
            </button>
          </div>
          {error && (
            <p id="passkey-error" className="mt-3 text-sm text-danger" role="alert">
              {error}
            </p>
          )}
        </form>
      </div>
      <p className="text-xs text-ink-3">20 spots · oleaje, viento, marea y webcams en directo</p>
    </main>
  );
}
