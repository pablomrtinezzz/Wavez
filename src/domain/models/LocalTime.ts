/**
 * Wall-clock helpers for the Canary Islands (one timezone for every island).
 *
 * Open-Meteo returns hourly timestamps in local time without an offset
 * ("2026-11-15T07:00"). Parsing those with `new Date()` interprets them in the
 * server's or browser's timezone, which silently shifts hours whenever that
 * zone is not Atlantic/Canary. Everything here works on the local strings
 * directly so comparisons are lexicographic and timezone-independent.
 */
export const CANARY_TIMEZONE = 'Atlantic/Canary';

export interface LocalMoment {
  /** 'YYYY-MM-DD' */
  dateStr: string;
  /** 0-23 */
  hour: number;
}

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: CANARY_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  hourCycle: 'h23',
});

/** Current date and hour in the Canary Islands. */
export function canaryNow(at: Date = new Date()): LocalMoment {
  const parts = Object.fromEntries(formatter.formatToParts(at).map((p) => [p.type, p.value]));
  return {
    dateStr: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour) % 24,
  };
}

/** 'YYYY-MM-DDTHH:00', the format Open-Meteo uses for hourly local timestamps. */
export function toLocalHourKey(moment: LocalMoment): string {
  return `${moment.dateStr}T${String(moment.hour).padStart(2, '0')}:00`;
}

/** Hour (0-23) of a local timestamp such as '2026-11-15T07:00'. */
export function localHourOf(localTimestamp: string): number {
  return Number(localTimestamp.slice(11, 13));
}

/** Date part ('YYYY-MM-DD') of a local timestamp. */
export function localDateOf(localTimestamp: string): string {
  return localTimestamp.slice(0, 10);
}

/** Shifts a 'YYYY-MM-DD' date by whole days. */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isValidDateStr(value: string | null | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(`${value}T00:00:00Z`)));
}
