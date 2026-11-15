'use client';

import React from 'react';
import Link from 'next/link';
import { RotateCw } from 'lucide-react';
import { cn } from '@/presentation/lib/utils';

/** Brand mark: the sun setting over the Atlantic. Kept in sync with src/app/icon.svg. */
export function BrandMark({ className }: { className?: string }) {
  const id = React.useId();
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <clipPath id={id}>
          <circle cx="32" cy="32" r="31" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect width="64" height="64" fill="#0E4F6B" />
        <circle cx="32" cy="38" r="16" fill="#F2C46D" />
        <rect y="38" width="64" height="26" fill="#0E4F6B" />
        <path d="M8 45h48M14 51h36M22 57h20" stroke="#F2C46D" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
      </g>
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('inline-flex items-center gap-2 text-ink', className)} aria-label="Wavez, inicio">
      <BrandMark className="size-7" />
      <span className="display text-2xl">Wavez</span>
    </Link>
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
}

export function SiteHeader({ updatedAt, isRefreshing, onRefresh }: SiteHeaderProps) {
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
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-line">
      <div className="mx-auto max-w-6xl px-5 pt-12 sm:px-8">
        <div className="rounded-2xl bg-sun-soft px-5 py-4 text-sm leading-relaxed text-ink-2 sm:px-6">
          <p className="font-medium text-ink">Todo lo que ves aquí son datos, no una garantía</p>
          <p className="mt-1">
            Las notas, alturas y ventanas se calculan a partir de modelos oceánicos y meteorológicos globales y pueden diferir de lo que
            encuentres en la playa: bancos de arena, corrientes, mareas locales o un cambio de viento no siempre aparecen en el modelo.
            Usa Wavez para orientarte y decide siempre en el sitio, según tu nivel y con prudencia.
          </p>
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 text-sm text-ink-2 sm:px-8 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <Wordmark />
          <p className="mt-4 max-w-xs leading-relaxed text-ink-3">Un parte de olas independiente y gratuito para Gran Canaria.</p>
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
            <li>Energía: índice propio a partir de altura y periodo (40·H²·T).</li>
            <li>La marea es un modelo global, no apto para navegación.</li>
            <li>Costa de la isla: © OpenStreetMap (ODbL).</li>
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
