'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronDown, Coffee, ListOrdered, Map as MapIcon, RotateCw, Video, Waves } from 'lucide-react';
import { ISLANDS, IslandId } from '@/domain/models/Island';
import { ISLAND_NAME } from '@/presentation/lib/format';
import { cn } from '@/presentation/lib/utils';
import { DataFreshness } from '@/presentation/components/ui/DataFreshness';
import { AUTHOR_NAME, GITHUB_URL, LINKEDIN_URL, REPO_URL, SUPPORT_URL } from '@/presentation/lib/site';

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
    <Link href="/" className={cn('inline-flex items-center gap-2.5 text-ink', className)} aria-label="Wavez, inicio">
      <BrandMark className="size-8 drop-shadow-[0_2px_6px_rgba(14,79,107,0.25)]" />
      <span className="display text-[1.65rem] leading-none">Wavez</span>
    </Link>
  );
}

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
}

/** Sections of an island page. */
export const ISLAND_NAV: NavItem[] = [
  { id: 'spots', label: 'Spots', icon: Waves },
  { id: 'mapa', label: 'Mapa', icon: MapIcon },
  { id: 'webcams', label: 'Webcams', icon: Video },
];

/** Sections of the archipelago page. */
export const CANARY_NAV: NavItem[] = [
  { id: 'islas', label: 'Islas', icon: Waves },
  { id: 'mapa', label: 'Mapa', icon: MapIcon },
  { id: 'ranking', label: 'Ranking', icon: ListOrdered },
];

/**
 * Brand plus the island switcher: "Wavez" over the current island's name,
 * which opens a menu with every island and the archipelago overview.
 */
function BrandAndIsland({ island }: { island: IslandId | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = React.useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        ref.current?.querySelector<HTMLButtonElement>('button')?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    // Move focus into the menu so keyboard users land on the options
    ref.current?.querySelector<HTMLAnchorElement>('[role="menu"] a')?.focus();
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = island ? ISLAND_NAME[island] : 'Canarias';
  const items: { href: string; label: string; id: IslandId | null }[] = [
    { href: '/', label: 'Toda Canarias', id: null },
    ...ISLANDS.map((i) => ({ href: `/${i.id}`, label: i.name, id: i.id })),
  ];

  return (
    <div ref={ref} className="relative flex items-center gap-2.5 justify-self-start">
      <Link href="/" aria-label="Wavez, inicio" className="shrink-0">
        <BrandMark className="size-8 drop-shadow-[0_2px_6px_rgba(14,79,107,0.25)]" />
      </Link>
      <span className="flex flex-col leading-none">
        <Link href="/" className="display text-[1.65rem] text-ink">
          Wavez
        </Link>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          className="-mx-1 -my-1 mt-0 inline-flex items-center gap-0.5 rounded px-1 py-1 text-[0.625rem] font-medium uppercase tracking-[0.18em] text-ocean/80 transition hover:text-ocean"
        >
          {current}
          <ChevronDown className={cn('size-3 transition-transform', open && 'rotate-180')} aria-hidden />
          <span className="sr-only">: cambiar de isla</span>
        </button>
      </span>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Islas"
          className="absolute left-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-paper p-1.5 shadow-[0_18px_40px_-18px_rgba(14,26,36,0.35)] animate-fade-in"
        >
          {items.map((item) => {
            const active = item.id === island;
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                aria-current={active ? 'page' : undefined}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center justify-between rounded-xl px-3 py-2 text-sm transition',
                  active ? 'bg-ocean text-sand' : 'text-ink-2 hover:bg-sea hover:text-ink',
                  item.id === null && 'mb-1 font-medium'
                )}
              >
                {item.label}
                {active && <Check className="size-4" aria-hidden />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Tracks whether the page has scrolled and which section sits under the header. */
function useScrollState(nav: NavItem[]) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > 8);
      // The last section whose top has passed below the sticky header is the current one
      let current: string | null = null;
      for (const { id } of nav) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 160) current = id;
      }
      // Leaving the last section (guide, footer) keeps it highlighted only while it is on screen
      if (current) {
        const el = document.getElementById(current)!;
        if (el.getBoundingClientRect().bottom < 120) current = null;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [nav]);

  return { scrolled, active };
}

interface SiteHeaderProps {
  /** Current island, or null on the archipelago page. */
  island: IslandId | null;
  nav: NavItem[];
  dataUpdatedAt?: string | null;
  isRefreshing: boolean;
  isLive?: boolean;
  onRefresh: () => void;
}

export function SiteHeader({ island, nav, dataUpdatedAt, isRefreshing, isLive = true, onRefresh }: SiteHeaderProps) {
  const { scrolled, active } = useScrollState(nav);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b backdrop-blur-xl backdrop-saturate-150 transition-[background-color,border-color,box-shadow] duration-300',
        scrolled ? 'border-line/80 bg-sand/80 shadow-[0_8px_24px_-16px_rgba(14,26,36,0.25)]' : 'border-transparent bg-sand/60'
      )}
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:px-8">
        <BrandAndIsland island={island} />

        <nav className="hidden items-center gap-1 rounded-full border border-line bg-paper/60 p-1 text-sm sm:flex" aria-label="Secciones">
          {nav.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              aria-current={active === n.id ? 'location' : undefined}
              className={cn(
                'rounded-full px-4 py-1.5 transition',
                active === n.id ? 'bg-ocean text-sand shadow-sm' : 'text-ink-2 hover:bg-line/60 hover:text-ink'
              )}
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 justify-self-end">
          {dataUpdatedAt && (
            <span className="inline-flex h-8 items-center gap-2 rounded-full border border-line bg-paper/70 px-3 text-xs text-ink-2">
              <span className="relative flex size-2" aria-hidden>
                {isLive && <span className="absolute inset-0 rounded-full bg-q-good opacity-60 animate-ping-slow" />}
                <span className={cn('relative size-2 rounded-full', isLive ? 'bg-q-good' : 'bg-ink-3')} />
              </span>
              <DataFreshness updatedAt={dataUpdatedAt} compact className="md:hidden" />
              <DataFreshness updatedAt={dataUpdatedAt} className="hidden md:inline" />
            </span>
          )}
          <button
            onClick={onRefresh}
            className="flex size-8 items-center justify-center rounded-full border border-line bg-paper/70 text-ink-2 transition hover:border-line-strong hover:text-ink active:scale-95"
            aria-label="Actualizar datos"
            title="Actualizar"
          >
            <RotateCw className={cn('size-3.5', isRefreshing && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Mobile section tabs: always reachable with the thumb, current section highlighted */}
      <nav className="mx-auto flex max-w-6xl gap-2 px-5 pb-2.5 sm:hidden" aria-label="Secciones">
        {nav.map(({ id, label, icon: Icon }) => (
          <a
            key={id}
            href={`#${id}`}
            aria-current={active === id ? 'location' : undefined}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-full border py-1.5 text-[0.8125rem] transition active:scale-[0.97]',
              active === id ? 'border-ocean bg-ocean text-sand shadow-sm' : 'border-line bg-paper/70 text-ink-2'
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            {label}
          </a>
        ))}
      </nav>
    </header>
  );
}

/** A soft swell line that separates the page from the footer. */
function WaveDivider() {
  return (
    <svg aria-hidden viewBox="0 0 1200 40" preserveAspectRatio="none" className="block h-8 w-full text-line-strong sm:h-10">
      <path d="M0 22C100 22 150 8 300 8S500 34 600 34 750 8 900 8 1100 22 1200 22" fill="none" stroke="currentColor" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
      <path d="M0 30C120 30 170 18 320 18S520 38 620 38 770 18 920 18 1110 30 1200 30" fill="none" stroke="var(--color-sun)" strokeWidth="1" opacity="0.7" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 sm:mt-32">
      <WaveDivider />
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
          <p className="mt-4 max-w-xs leading-relaxed text-ink-3">Un parte de olas independiente y gratuito para Canarias.</p>
          <a
            href="/wavez-metodologia.pdf"
            target="_blank"
            rel="noopener"
            className="mt-4 inline-block text-ocean underline decoration-sun underline-offset-4 hover:text-ink"
          >
            Cómo calculamos la nota (PDF)
          </a>
          <p className="mt-6 text-ink-3">
            Hecho por {AUTHOR_NAME} ·{' '}
            <a className="underline underline-offset-4 hover:text-ink" href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>{' '}
            ·{' '}
            <a className="underline underline-offset-4 hover:text-ink" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </p>
          <p className="mt-2 text-ink-3">
            Código abierto en{' '}
            <a className="underline underline-offset-4 hover:text-ink" href={REPO_URL} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </p>
          {SUPPORT_URL && (
            <a
              href={SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-line bg-paper/70 px-4 py-2 text-ink-2 transition hover:border-sun hover:bg-sun-soft hover:text-ink"
            >
              <Coffee className="size-4 text-warn" aria-hidden />
              ¿Te ha servido? Invítame a un café
            </a>
          )}
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
