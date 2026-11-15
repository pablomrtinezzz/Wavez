'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Minus, Plus, Maximize2, Minimize2, LocateFixed, X } from 'lucide-react';
import { SpotSummaryDTO } from '@/application/dtos/SpotSummaryDTO';
import { ConditionQuality } from '@/domain/models/SpotScore';
import { ZoneId } from '@/domain/models/Spot';
import { QUALITY, ZONES, formatScore } from '@/presentation/lib/format';
import { QualityDot, ScoreBadge } from '@/presentation/components/ui/primitives';
import { cn } from '@/presentation/lib/utils';
import { GRAN_CANARIA_COAST } from './granCanariaCoast';

const BOUNDS = { minLat: 27.71, maxLat: 28.2, minLng: -15.85, maxLng: -15.33 };
const LNG_SCALE = Math.cos((28 * Math.PI) / 180); // keep the island's real proportions
const SCALE = 1000;
const W = (BOUNDS.maxLng - BOUNDS.minLng) * LNG_SCALE * SCALE;
const H = (BOUNDS.maxLat - BOUNDS.minLat) * SCALE;
const PAD = 20;
const FULL: View = { x: -PAD, y: -PAD, w: W + PAD * 2, h: H + PAD * 2 };
/** Land and sea colours, distinct from the page background so the island never blends in. */
const LAND = '#e9dfc7';
const COAST = '#8fb3c2';
const SEA = '#d3e5ed';
/** Closest zoom: about 3 km across. */
const MIN_W = 30;

interface View {
  x: number;
  y: number;
  w: number;
  h: number;
}

function project(lat: number, lng: number) {
  return { x: (lng - BOUNDS.minLng) * LNG_SCALE * SCALE, y: (BOUNDS.maxLat - lat) * SCALE };
}

const COAST_PATH =
  GRAN_CANARIA_COAST.map(([lat, lng], i) => {
    const { x, y } = project(lat, lng);
    return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ') + ' Z';

/** Keeps the map's aspect ratio and stays inside the island bounds. */
function clampView(v: View): View {
  const aspect = FULL.h / FULL.w;
  const w = Math.min(FULL.w, Math.max(MIN_W, v.w));
  const h = w * aspect;
  const cx = v.x + v.w / 2;
  const cy = v.y + v.h / 2;
  const x = Math.min(FULL.x + FULL.w - w, Math.max(FULL.x, cx - w / 2));
  const y = Math.min(FULL.y + FULL.h - h, Math.max(FULL.y, cy - h / 2));
  return { x, y, w, h };
}

function fitPoints(points: { x: number; y: number }[]): View {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const margin = 25;
  const minX = Math.min(...xs) - margin;
  const maxX = Math.max(...xs) + margin;
  const minY = Math.min(...ys) - margin;
  const maxY = Math.max(...ys) + margin;
  const aspect = FULL.h / FULL.w;
  const w = Math.max(maxX - minX, (maxY - minY) / aspect, MIN_W * 2);
  return clampView({ x: (minX + maxX) / 2 - w / 2, y: (minY + maxY) / 2 - (w * aspect) / 2, w, h: w * aspect });
}

interface IslandMapProps {
  summaries: SpotSummaryDTO[];
  onSelectSpot: (spotId: string) => void;
}

export function IslandMap({ summaries, onSelectSpot }: IslandMapProps) {
  const [focusId, setFocusId] = useState<string | null>(null);
  const [view, setView] = useState<View>(FULL);
  const [activeZone, setActiveZone] = useState<ZoneId | null>(null);
  const [expanded, setExpanded] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const animation = useRef<number | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const dragged = useRef(false);

  const focused = summaries.find((s) => s.spot.id === focusId) ?? summaries[0];
  // Draw better spots last so they sit on top where markers overlap
  const ordered = useMemo(() => [...summaries].sort((a, b) => a.score.overallScore - b.score.overallScore), [summaries]);
  const positions = useMemo(
    () => new Map(summaries.map((s) => [s.spot.id, project(s.spot.location.lat, s.spot.location.lng)])),
    [summaries]
  );

  /** Map units per screen pixel, so markers keep a constant on-screen size. */
  const [px, setPx] = useState({ w: 600, h: 640 });
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setPx({ w: e.contentRect.width || 600, h: e.contentRect.height || 640 }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // The SVG letterboxes the view ("meet"), so the effective scale is the larger ratio
  const unit = Math.max(view.w / px.w, view.h / px.h);
  // Close enough to tell neighbouring spots apart: show their names
  const zoomedIn = unit < 0.35;

  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const animateTo = useCallback((target: View) => {
    if (animation.current) cancelAnimationFrame(animation.current);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return setView(target);
    const from = viewRef.current;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 380);
      const e = 1 - Math.pow(1 - t, 3);
      setView({
        x: from.x + (target.x - from.x) * e,
        y: from.y + (target.y - from.y) * e,
        w: from.w + (target.w - from.w) * e,
        h: from.h + (target.h - from.h) * e,
      });
      if (t < 1) animation.current = requestAnimationFrame(step);
    };
    animation.current = requestAnimationFrame(step);
  }, []);

  const zoomBy = useCallback(
    (factor: number, origin?: { x: number; y: number }) => {
      setView((v) => {
        const ox = origin?.x ?? v.x + v.w / 2;
        const oy = origin?.y ?? v.y + v.h / 2;
        const w = v.w * factor;
        const h = v.h * factor;
        return clampView({ x: ox - ((ox - v.x) / v.w) * w, y: oy - ((oy - v.y) / v.h) * h, w, h });
      });
    },
    []
  );

  /** Screen → map coordinates, correct even when the SVG is letterboxed (expanded view). */
  const toMapPoint = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current!;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const pt = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    return { x: pt.x, y: pt.y };
  }, []);

  // Ctrl/⌘ + wheel and trackpad pinch zoom around the cursor
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      // Plain wheel scrolls the page; Ctrl/⌘ + wheel (and trackpad pinch) zooms.
      // In the expanded view there is no page to scroll, so the wheel always zooms.
      if (!expanded && !e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      zoomBy(Math.exp(e.deltaY * 0.0015), toMapPoint(e.clientX, e.clientY));
      setActiveZone(null);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [expanded, zoomBy, toMapPoint]);

  // Expanded view: Escape closes it and the page behind does not scroll
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setExpanded(false);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [expanded]);

  // Drag to pan, two fingers to pinch
  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragged.current = false;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    if (pointers.current.size === 1) {
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      if (Math.abs(dx) + Math.abs(dy) > 3 && !dragged.current) {
        dragged.current = true;
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
      }
      if (dragged.current) {
        setView((v) => clampView({ ...v, x: v.x - dx * unit, y: v.y - dy * unit }));
        setActiveZone(null);
      }
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.entries()].map(([id, p]) => (id === e.pointerId ? { x: e.clientX, y: e.clientY } : p));
      const [pa, pb] = [...pointers.current.values()];
      const before = Math.hypot(pa.x - pb.x, pa.y - pb.y);
      const after = Math.hypot(a.x - b.x, a.y - b.y);
      if (before > 0 && after > 0) {
        dragged.current = true;
        zoomBy(before / after, toMapPoint((a.x + b.x) / 2, (a.y + b.y) / 2));
        setActiveZone(null);
      }
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
  };

  const showZone = (zone: ZoneId | null) => {
    setActiveZone(zone);
    if (!zone) return animateTo(FULL);
    const pts = summaries.filter((s) => s.spot.zone === zone).map((s) => positions.get(s.spot.id)!);
    if (pts.length) animateTo(fitPoints(pts));
  };

  const selectSpot = (id: string) => {
    if (dragged.current) return;
    onSelectSpot(id);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <ZoneChips active={activeZone} onSelect={showZone} />
        </div>

        <div
          className={cn(
            'relative overflow-hidden ring-1 ring-[#bcd3dd]',
            expanded ? 'fixed inset-0 z-[70] flex flex-col ring-0' : 'rounded-3xl'
          )}
          style={{ background: SEA }}
          role={expanded ? 'dialog' : undefined}
          aria-modal={expanded || undefined}
          aria-label={expanded ? 'Mapa ampliado' : undefined}
        >
          {expanded && (
            <div className="flex items-center justify-between gap-3 border-b border-[#bcd3dd] bg-sand/90 px-4 py-3 backdrop-blur" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))' }}>
              <div className="flex min-w-0 items-center gap-2 overflow-x-auto scrollbar-none [&>button]:shrink-0 [&>button]:whitespace-nowrap">
                <ZoneChips active={activeZone} onSelect={showZone} />
              </div>
              <button
                onClick={() => setExpanded(false)}
                aria-label="Cerrar mapa ampliado"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-sm text-sand"
              >
                <X className="size-4" /> <span className="hidden sm:inline">Cerrar</span>
              </button>
            </div>
          )}
          <svg
            ref={svgRef}
            viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
            className={cn('block touch-none select-none', expanded ? 'min-h-0 w-full flex-1' : 'h-auto w-full')}
            style={{ aspectRatio: expanded ? undefined : `${FULL.w} / ${FULL.h}`, cursor: zoomedIn ? 'grab' : 'default' }}
            role="group"
            aria-label="Mapa de spots de Gran Canaria. Usa los botones de zona o de zoom para acercarte."
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <path d={COAST_PATH} fill="none" stroke="#ffffff" strokeWidth={10 * unit} strokeLinejoin="round" opacity="0.55" />
            <path d={COAST_PATH} fill={LAND} stroke={COAST} strokeWidth={1.4 * unit} strokeLinejoin="round" />
            {!zoomedIn && (
              <text
                x={project(27.96, -15.6).x}
                y={project(27.96, -15.6).y}
                textAnchor="middle"
                fontSize={12 * unit}
                letterSpacing={3 * unit}
                fill="var(--color-ink-3)"
              >
                GRAN CANARIA
              </text>
            )}

            {ordered.map((s) => {
              const { x, y } = positions.get(s.spot.id)!;
              const isFocused = s.spot.id === focused?.spot.id;
              return (
                <g
                  key={s.spot.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${s.spot.name}: ${QUALITY[s.score.quality].label}, ${formatScore(s.score.overallScore)} sobre 10`}
                  className="cursor-pointer outline-none"
                  onPointerEnter={() => setFocusId(s.spot.id)}
                  onFocus={() => setFocusId(s.spot.id)}
                  onClick={() => selectSpot(s.spot.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectSpot(s.spot.id);
                    }
                  }}
                >
                  {/* Generous hit area */}
                  <circle cx={x} cy={y} r={14 * unit} fill="transparent" />
                  <circle
                    cx={x}
                    cy={y}
                    r={(isFocused ? 8 : 6) * unit}
                    fill={QUALITY[s.score.quality].color}
                    stroke="var(--color-paper)"
                    strokeWidth={2.5 * unit}
                  />
                  {isFocused && <circle cx={x} cy={y} r={13 * unit} fill="none" stroke="var(--color-ink)" strokeWidth={1 * unit} />}
                  {zoomedIn && (
                    <text
                      x={x + 12 * unit}
                      y={y + 4 * unit}
                      fontSize={12 * unit}
                      fill="var(--color-ink)"
                      stroke={LAND}
                      strokeWidth={3 * unit}
                      paintOrder="stroke"
                    >
                      {s.spot.name.split(' (')[0]}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          <div className="absolute bottom-3 right-3 flex flex-col overflow-hidden rounded-xl bg-paper shadow-sm ring-1 ring-line" style={expanded ? { bottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' } : undefined}>
            <MapButton label="Acercar" onClick={() => zoomBy(0.6)}>
              <Plus className="size-4" />
            </MapButton>
            <MapButton label="Alejar" onClick={() => zoomBy(1 / 0.6)}>
              <Minus className="size-4" />
            </MapButton>
            <MapButton label="Ver toda la isla" onClick={() => showZone(null)}>
              <LocateFixed className="size-4" />
            </MapButton>
            <MapButton label={expanded ? 'Salir de pantalla completa' : 'Ampliar mapa a pantalla completa'} onClick={() => setExpanded((e) => !e)}>
              {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </MapButton>
          </div>
          <p className="pointer-events-none absolute bottom-3 left-4 text-[10px] text-ink-2">
            <span className="hidden sm:inline">{expanded ? 'Rueda o pellizca para hacer zoom · ' : 'Ctrl/⌘ + rueda o pellizca para hacer zoom · '}</span>© OpenStreetMap
          </p>
        </div>
        <MapLegend />
      </div>
      {focused && (
        <div className="border-t border-line pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0" aria-live="polite">
          <p className="eyebrow">{focused.spot.location.municipality}</p>
          <h3 className="display mt-2 text-3xl">{focused.spot.name}</h3>
          <p className="mt-4 flex items-center gap-3 text-sm text-ink">
            <ScoreBadge score={focused.score.overallScore} quality={focused.score.quality} />
            {QUALITY[focused.score.quality].label}
          </p>
          <p className="mt-3 text-sm text-ink-2 tabular-nums">
            {focused.conditions.primarySwell.heightM.toFixed(1)} m · {Math.round(focused.conditions.primarySwell.periodSec)} s{' '}
            {focused.conditions.primarySwell.compassDir} · viento {Math.round(focused.conditions.wind.speedKmh)} km/h{' '}
            {focused.conditions.wind.compassDir}
          </p>
          <button
            onClick={() => onSelectSpot(focused.spot.id)}
            className="mt-5 text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            Ver informe completo →
          </button>
        </div>
      )}
    </div>
  );
}

function ZoneChips({ active, onSelect }: { active: ZoneId | null; onSelect: (zone: ZoneId | null) => void }) {
  return (
    <>
      {[{ id: null, label: 'Toda la isla' } as const, ...ZONES].map((z) => (
        <button
          key={z.label}
          onClick={() => onSelect(z.id)}
          aria-pressed={active === z.id}
          className={cn(
            'rounded-full px-3 py-1.5 text-sm transition',
            active === z.id ? 'bg-ocean text-sand' : 'bg-paper/80 text-ink-2 hover:bg-paper hover:text-ink'
          )}
        >
          {z.label}
        </button>
      ))}
    </>
  );
}

function MapButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-9 items-center justify-center border-b border-line text-ink-2 transition last:border-b-0 hover:bg-sea hover:text-ink"
    >
      {children}
    </button>
  );
}

export function MapLegend() {
  const order: ConditionQuality[] = ['flat', 'poor', 'fair', 'good', 'firing'];
  return (
    <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-2" aria-label="Leyenda de calidad">
      {order.map((q) => (
        <li key={q} className="inline-flex items-center gap-1.5">
          <QualityDot quality={q} />
          {QUALITY[q].label}
        </li>
      ))}
    </ul>
  );
}
