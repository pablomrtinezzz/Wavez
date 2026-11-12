'use client';

import React from 'react';
import { getScoreColorTokens, formatScoreToTen } from '@/presentation/lib/utils';

interface ScoreRadialGaugeProps {
  score: number; // 0 - 100
  size?: number; // size in px, default 56
  strokeWidth?: number;
  showTenScale?: boolean;
}

export const ScoreRadialGauge: React.FC<ScoreRadialGaugeProps> = ({
  score,
  size = 56,
  strokeWidth = 4.5,
  showTenScale = true,
}) => {
  const tokens = getScoreColorTokens(score);
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  // Score percentage clamped between 0 and 100
  const normalized = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (normalized / 100) * circumference;

  const displayScore = showTenScale ? formatScoreToTen(score) : Math.round(score).toString();

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      {/* Background glow circle */}
      <div
        className="absolute inset-0 rounded-full blur-md opacity-40 transition-opacity duration-300"
        style={{ backgroundColor: tokens.ringColor }}
      />

      <svg width={size} height={size} className="transform -rotate-90 relative z-10">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Dynamic Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={tokens.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* Center Score Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-center">
        <span className="text-sm font-black tabular-nums tracking-tighter text-white">
          {displayScore}
        </span>
        <span className="text-[8px] font-semibold tracking-wider text-slate-400 uppercase -mt-0.5">
          {showTenScale ? '/10' : 'PTS'}
        </span>
      </div>
    </div>
  );
};
