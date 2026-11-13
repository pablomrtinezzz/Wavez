import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a 0-100 score to 0.0 - 10.0 scale for professional surf reporting
 */
export function formatScoreToTen(score100: number): string {
  const score10 = Math.min(10, Math.max(0, score100 / 10));
  return score10.toFixed(1);
}

export function formatMinutesAgo(timestampIso: string, referenceTimeMs: number): string {
  const diffMs = Math.max(0, referenceTimeMs - new Date(timestampIso).getTime());
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.round(minutes / 60);
  return `hace ${hours}h`;
}

/**
 * Returns color tokens and glow configurations for a given SpotScore (0-100)
 */
export function getScoreColorTokens(score: number) {
  if (score >= 80) {
    return {
      gradient: 'from-emerald-400 via-teal-400 to-cyan-400',
      text: 'text-emerald-400',
      border: 'border-emerald-500/40',
      bg: 'bg-emerald-500/10',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.35)]',
      stroke: '#10B981',
      badge: 'Épico 🔥',
      ringColor: '#10B981',
    };
  }
  if (score >= 65) {
    return {
      gradient: 'from-cyan-400 to-blue-500',
      text: 'text-cyan-400',
      border: 'border-cyan-500/40',
      bg: 'bg-cyan-500/10',
      glow: 'shadow-[0_0_18px_rgba(6,182,212,0.3)]',
      stroke: '#06B6D4',
      badge: 'Muy Bueno',
      ringColor: '#06B6D4',
    };
  }
  if (score >= 50) {
    return {
      gradient: 'from-amber-400 to-orange-500',
      text: 'text-amber-400',
      border: 'border-amber-500/40',
      bg: 'bg-amber-500/10',
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.25)]',
      stroke: '#F59E0B',
      badge: 'Surfeable',
      ringColor: '#F59E0B',
    };
  }
  if (score >= 30) {
    return {
      gradient: 'from-rose-400 to-red-500',
      text: 'text-rose-400',
      border: 'border-rose-500/40',
      bg: 'bg-rose-500/10',
      glow: 'shadow-[0_0_15px_rgba(244,63,94,0.2)]',
      stroke: '#F43F5E',
      badge: 'Difícil',
      ringColor: '#F43F5E',
    };
  }
  return {
    gradient: 'from-slate-500 to-slate-600',
    text: 'text-slate-400',
    border: 'border-slate-700/60',
    bg: 'bg-slate-800/40',
    glow: 'shadow-none',
    stroke: '#64748B',
    badge: 'Plato',
    ringColor: '#64748B',
  };
}

export const getScoreColor = getScoreColorTokens;


/**
 * Returns wind character classification and badge styling
 */
export function getWindClassification(
  windSpeedKmh: number,
  isOffshore: boolean
): { label: string; textClass: string; bgClass: string; borderClass: string } {
  if (windSpeedKmh <= 7) {
    return {
      label: 'Glassy ✨',
      textClass: 'text-cyan-300',
      bgClass: 'bg-cyan-950/60',
      borderClass: 'border-cyan-800/50',
    };
  }
  if (isOffshore) {
    return {
      label: 'Offshore',
      textClass: 'text-emerald-400',
      bgClass: 'bg-emerald-950/60',
      borderClass: 'border-emerald-800/50',
    };
  }
  if (windSpeedKmh > 25) {
    return {
      label: 'Onshore 💨',
      textClass: 'text-rose-400',
      bgClass: 'bg-rose-950/60',
      borderClass: 'border-rose-800/50',
    };
  }
  return {
    label: 'Cruzado',
    textClass: 'text-amber-400',
    bgClass: 'bg-amber-950/60',
    borderClass: 'border-amber-800/50',
  };
}
