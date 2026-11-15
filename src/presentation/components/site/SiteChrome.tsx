'use client';

import React from 'react';
import { RotateCw } from 'lucide-react';
import { cn } from '@/presentation/lib/utils';

export function Wordmark({ className }: { className?: string }) {
  return (
    <a href="#" className={cn('inline-flex items-baseline gap-1.5 text-ink', className)} aria-label="Wavez, inicio">
      <svg viewBox="0 0 40 20" className="h-4 w-8 self-center" aria-hidden>
        <path d="M2 13c4 0 5-7 9-7s5 7 9 7 6-10 18-10" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      <span className="display text-2xl">Wavez</span>
    </a>
  );
}

const NAV = [
  { href: '#spots', label: 'Spots' },
  { href: '#mapa', label: 'Mapa' },
  { href: '#webcams', label: 'Webcams' },
];

interface SiteHeaderProps {
  updatedAt?: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  onLogout: () => void;
}

export function SiteHeader({ updatedAt, isRefreshing, onRefresh, onLogout }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-sand/85 backdrop-blur-md" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">
        <Wordmark />
        <nav className="hidden items-center gap-7 text-sm text-ink-2 sm:flex" aria-label="Secciones">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="hover:text-ink">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-xs text-ink-3">
          {updatedAt && (
            <span className="hidden tabular-nums md:inline">
              Actualizado {new Date(updatedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Atlantic/Canary' })}
            </span>
          )}
          <button
            onClick={onRefresh}
            className="flex size-8 items-center justify-center rounded-full transition hover:bg-line/70 hover:text-ink"
            aria-label="Actualizar datos"
            title="Actualizar"
          >
            <RotateCw className={cn('size-4', isRefreshing && 'animate-spin')} />
          </button>
          <button onClick={onLogout} className="hover:text-ink">
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 text-sm text-ink-2 sm:px-8 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <Wordmark />
          <p className="mt-4 max-w-xs leading-relaxed text-ink-3">
            Un parte de olas independiente para Gran Canaria. La nota es orientativa: el mar manda, consulta siempre las condiciones en la
            playa.
          </p>
        </div>
        <div>
          <p className="eyebrow">Datos</p>
          <ul className="mt-3 space-y-2">
            <li>
              Oleaje, viento, marea y temperatura:{' '}
              <a className="underline underline-offset-4 hover:text-ink" href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">
                Open-Meteo
              </a>{' '}
              (CC BY 4.0)
            </li>
            <li>
              Energía:{' '}
              <a className="underline underline-offset-4 hover:text-ink" href="https://www.surf-forecast.com/" target="_blank" rel="noopener noreferrer">
                Surf-Forecast
              </a>{' '}
              o estimación propia
            </li>
            <li>La marea es un modelo global, no apto para navegación.</li>
          </ul>
        </div>
        <div>
          <p className="eyebrow">Webcams</p>
          <p className="mt-3">
            Emisiones de{' '}
            <a className="underline underline-offset-4 hover:text-ink" href="https://in2thebeach.es/" target="_blank" rel="noopener noreferrer">
              In2theBeach
            </a>
            , propiedad de sus autores.
          </p>
        </div>
      </div>
    </footer>
  );
}
