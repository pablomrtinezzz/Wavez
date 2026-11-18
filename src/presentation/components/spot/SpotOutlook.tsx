import { ConditionQuality } from '@/domain/models/SpotScore';
import { CANARY_TIMEZONE } from '@/domain/models/LocalTime';
import { QUALITY } from '@/presentation/lib/format';
import { Locale } from '@/presentation/lib/locale';
import { OutlookDay, SpotOutlook, WindKind, getSpotOutlook } from '@/presentation/server/spotOutlook';

const COPY = {
  es: {
    title: (name: string) => `Previsión de olas en ${name}`,
    intro: 'Los próximos tres días a las horas de luz. La nota de 0 a 10 dice cómo funciona el spot con ese mar y ese viento.',
    hour: 'Hora',
    wave: 'Ola',
    wind: 'Viento',
    score: 'Nota',
    best: (from: string, to: string, score: string, label: string) => `Mejor de ${from} a ${to}: ${score} (${label})`,
    flat: 'Sin ventana buena: mar plato o viento en contra.',
    range: (min: string, max: string) => `Ola de ${min} a ${max} m`,
    updated: (at: string) => `Datos de Open-Meteo de ${at}, hora canaria. La página se actualiza cada hora.`,
    unavailable: 'La previsión no está disponible ahora mismo. Ábrela en el mapa de la isla.',
    windKind: { calm: 'calma', offshore: 'terral', cross: 'cruzado', onshore: 'en contra' } satisfies Record<WindKind, string>,
    quality: Object.fromEntries(Object.entries(QUALITY).map(([k, v]) => [k, v.label])) as Record<ConditionQuality, string>,
    dateLocale: 'es-ES',
  },
  en: {
    title: (name: string) => `${name} surf forecast`,
    intro: 'The next three days during daylight. The 0 to 10 score says how well the spot works with that swell and that wind.',
    hour: 'Time',
    wave: 'Wave',
    wind: 'Wind',
    score: 'Score',
    best: (from: string, to: string, score: string, label: string) => `Best from ${from} to ${to}: ${score} (${label})`,
    flat: 'No good window: flat sea or onshore wind.',
    range: (min: string, max: string) => `Waves ${min} to ${max} m`,
    updated: (at: string) => `Open-Meteo data from ${at}, Canary Islands time. This page refreshes every hour.`,
    unavailable: 'The forecast is not available right now. Open it on the island map.',
    windKind: { calm: 'calm', offshore: 'offshore', cross: 'cross-shore', onshore: 'onshore' } satisfies Record<WindKind, string>,
    quality: { firing: 'Epic', good: 'Very good', fair: 'Surfable', poor: 'Poor', flat: 'Flat' } satisfies Record<ConditionQuality, string>,
    dateLocale: 'en-GB',
  },
};

const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;

function dayLabel(date: string, locale: Locale): string {
  const label = new Date(`${date}T12:00:00Z`).toLocaleDateString(COPY[locale].dateLocale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatDataTime(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleString(COPY[locale].dateLocale, {
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: CANARY_TIMEZONE,
  });
}

/**
 * Server-rendered forecast for a spot page: real numbers in the HTML, cached
 * for an hour (see getSpotOutlook).
 */
export async function SpotOutlookSection({ spotId, name, locale }: { spotId: string; name: string; locale: Locale }) {
  const outlook = await getSpotOutlook(spotId);
  const t = COPY[locale];
  return (
    <section className="mt-16" aria-labelledby="forecast">
      <h2 id="forecast" className="border-b border-line pb-3 text-xl font-medium">
        {t.title(name)}
      </h2>
      {outlook ? <OutlookBody outlook={outlook} locale={locale} /> : <p className="mt-6 text-sm text-ink-3">{t.unavailable}</p>}
    </section>
  );
}

function OutlookBody({ outlook, locale }: { outlook: SpotOutlook; locale: Locale }) {
  const t = COPY[locale];
  return (
    <>
      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ink-2">{t.intro}</p>
      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        {outlook.days.map((day) => (
          <OutlookDayTable key={day.date} day={day} locale={locale} />
        ))}
      </div>
      {outlook.dataUpdatedAt && <p className="mt-6 text-xs text-ink-3">{t.updated(formatDataTime(outlook.dataUpdatedAt, locale))}</p>}
    </>
  );
}

function OutlookDayTable({ day, locale }: { day: OutlookDay; locale: Locale }) {
  const t = COPY[locale];
  return (
    <div className="min-w-0">
      <h3 className="font-medium text-ink">{dayLabel(day.date, locale)}</h3>
      <p className="mt-1 text-sm text-ink-2">
        {t.range(day.minWaveM.toFixed(1), day.maxWaveM.toFixed(1))}.{' '}
        {day.best ? t.best(hh(day.best.startHour), hh(day.best.endHour), day.best.score.toFixed(1), t.quality[day.best.quality]) : t.flat}
      </p>
      <table className="mt-3 w-full text-left text-sm tabular-nums">
        <thead className="text-xs text-ink-3">
          <tr>
            <th className="py-1 font-normal">{t.hour}</th>
            <th className="font-normal">{t.wave}</th>
            <th className="font-normal">{t.wind}</th>
            <th className="text-right font-normal">{t.score}</th>
          </tr>
        </thead>
        <tbody className="text-ink-2">
          {day.hours.map((h) => (
            <tr key={h.hour} className="border-t border-line">
              <td className="py-1.5 text-ink-3">{hh(h.hour)}</td>
              <td>
                {h.waveM.toFixed(1)} m · {h.periodS} s <span className="text-ink-3">{h.swellDir}</span>
              </td>
              <td>
                {h.windKmh} km/h {h.windDir} <span className="text-ink-3">{t.windKind[h.wind]}</span>
              </td>
              <td className="text-right">
                <span
                  className="inline-flex h-6 w-9 items-center justify-center rounded-full text-xs font-medium"
                  style={{ background: QUALITY[h.quality].color, color: QUALITY[h.quality].onColor }}
                  title={t.quality[h.quality]}
                >
                  {h.score.toFixed(1)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
