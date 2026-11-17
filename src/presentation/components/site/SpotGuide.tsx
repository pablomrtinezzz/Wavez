import Link from 'next/link';
import { spotsOfIsland } from '@/infrastructure/spots';
import { BREAK_LABEL, SKILL_LABEL, ZONES } from '@/presentation/lib/format';

/**
 * Static guide to every spot. Rendered on the server so search engines and
 * link previews see real content, and it gives visitors a quick reference.
 */
export function SpotGuide() {
  return (
    <section id="guia" className="reveal mt-20 sm:mt-36" aria-labelledby="guia-title">
      <div className="mb-10 grid gap-3 sm:grid-cols-2 sm:items-end">
        <div>
          <p className="eyebrow inline-flex items-center gap-2 tabular-nums !text-ocean">
            <svg viewBox="0 0 28 8" className="h-2 w-7 text-sun" aria-hidden>
              <path d="M1 4c3 0 3-3 6.5-3S11 7 14 7s3.5-6 6.5-6S24 4 27 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            04
          </p>
          <h2 id="guia-title" className="display mt-2 text-5xl sm:text-6xl">
            Guía de spots
          </h2>
        </div>
        <p className="max-w-md text-ink-2 sm:justify-self-end">
          Los 20 picos que seguimos en Gran Canaria, por costa: tipo de ola, nivel y cuándo funcionan mejor.
        </p>
      </div>

      <div className="grid gap-x-10 gap-y-12 md:grid-cols-2">
        {ZONES.map((zone) => (
          <div key={zone.id}>
            <h3 className="border-b border-line pb-2 text-lg font-medium text-ink">{zone.label}</h3>
            <ul className="mt-3 divide-y divide-line">
              {spotsOfIsland('gran-canaria').filter((s) => s.zone === zone.id).map((spot) => (
                <li key={spot.id} className="py-3">
                  <Link href={`/spots/${spot.slug}`} className="group block">
                    <span className="font-medium text-ink group-hover:underline group-hover:underline-offset-4">{spot.name}</span>
                    <span className="ml-2 text-xs text-ink-3">
                      {BREAK_LABEL[spot.breakType]} · {SKILL_LABEL[spot.skillLevel]}
                      {spot.webcam ? ' · webcam' : ''}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-ink-2">{spot.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
