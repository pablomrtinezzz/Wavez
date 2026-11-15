'use client';

import React, { useState } from 'react';
import { MonthlyConsistency } from '@/domain/models/SeasonalClimatology';
import { useElementWidth } from '@/presentation/components/ui/primitives';

interface SeasonChartProps {
  months: MonthlyConsistency[];
  currentMonth: number;
}

const HEIGHT = 150;
const PAD = { top: 22, right: 4, bottom: 22, left: 4 };
const MAX_BAR = 24;

/** Share of surfable days per month; the current month carries the accent. */
export function SeasonChart({ months, currentMonth }: SeasonChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const band = innerW / months.length;
  const barW = Math.min(MAX_BAR, band - 6);
  const shown = months.find((m) => m.month === (hover ?? currentMonth));

  return (
    <div>
      <div className="mb-2 min-h-5 text-sm text-ink-2" aria-live="polite">
        {shown && (
          <>
            <span className="font-medium text-ink">{shown.monthName}</span> · {shown.consistencyPct}% de días surfeables ·{' '}
            <span className="tabular-nums">
              {shown.averageWaveHeightM.toFixed(1)} m @ {shown.averagePeriodSec} s de media
            </span>
          </>
        )}
      </div>
      <div ref={ref}>
        {width > 0 && (
          <svg width={width} height={HEIGHT} role="img" aria-label="Consistencia mensual: porcentaje de días surfeables" onPointerLeave={() => setHover(null)}>
            {[0, 50, 100].map((t) => {
              const yy = PAD.top + innerH - (t / 100) * innerH;
              return <line key={t} x1={PAD.left} x2={PAD.left + innerW} y1={yy} y2={yy} stroke="var(--color-line)" strokeWidth="1" />;
            })}
            {months.map((m, i) => {
              const h = (m.consistencyPct / 100) * innerH;
              const cx = PAD.left + band * i + band / 2;
              const top = PAD.top + innerH - h;
              const isCurrent = m.month === currentMonth;
              const isActive = m.month === hover;
              const r = Math.min(4, h);
              // Rounded data end, square at the baseline
              const d = `M${cx - barW / 2},${PAD.top + innerH} V${top + r} Q${cx - barW / 2},${top} ${cx - barW / 2 + r},${top} H${cx + barW / 2 - r} Q${cx + barW / 2},${top} ${cx + barW / 2},${top + r} V${PAD.top + innerH} Z`;
              return (
                <g key={m.month} onPointerEnter={() => setHover(m.month)} onPointerDown={() => setHover(m.month)}>
                  <rect x={cx - band / 2} y={PAD.top} width={band} height={innerH + PAD.bottom} fill="transparent" />
                  <path d={d} fill={isCurrent ? 'var(--color-ocean)' : '#a9c6d3'} opacity={hover && !isActive && !isCurrent ? 0.6 : 1} />
                  {isCurrent && (
                    <text x={cx} y={top - 6} fontSize="10.5" textAnchor="middle" fill="var(--color-ink)" className="tabular-nums">
                      {m.consistencyPct}%
                    </text>
                  )}
                  <text
                    x={cx}
                    y={HEIGHT - 6}
                    fontSize="10.5"
                    textAnchor="middle"
                    fill={isCurrent ? 'var(--color-ink)' : 'var(--color-ink-3)'}
                  >
                    {width < 420 ? m.monthName.charAt(0) : m.monthName}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}
