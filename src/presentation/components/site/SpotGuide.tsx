import Link from 'next/link';
import { IslandId, getIsland, ISLANDS } from '@/domain/models/Island';
import { spotsOfIsland } from '@/infrastructure/spots';
import { BREAK_LABEL, SKILL_LABEL } from '@/presentation/lib/format';
import { SectionIndex } from './sections';

/**
 * Static guide to every spot of an island. Rendered on the server so search
 * engines and link previews see real content, and it gives visitors a quick
 * reference.
 */
export function SpotGuide({ island, index }: { island: IslandId; index: string }) {
  const info = getIsland(island);
  const spots = spotsOfIsland(island);
  return (
    <section id="guia" className="reveal mt-20 sm:mt-36" aria-labelledby="guia-title">
      <div className="mb-10 grid gap-3 sm:grid-cols-2 sm:items-end">
        <div>
          <SectionIndex index={index} />
          <h2 id="guia-title" className="display mt-2 text-[2.75rem] leading-none sm:text-6xl">
            Guía de spots
          </h2>
        </div>
        <p className="max-w-md text-ink-2 sm:justify-self-end">
          {spots.length === 1 ? 'El pico' : `Los ${spots.length} picos`} que seguimos en {info.name}
          {info.zones.length > 1 ? ', por costa' : ''}: tipo de ola, nivel y cuándo funcionan mejor.
        </p>
      </div>

      <div className="grid gap-x-10 gap-y-12 md:grid-cols-2">
        {info.zones.map((zone) => (
          <div key={zone.id}>
            <h3 className="border-b border-line pb-2 text-lg font-medium text-ink">{zone.label}</h3>
            <ul className="mt-3 divide-y divide-line">
              {spots
                .filter((s) => s.zone === zone.id)
                .map((spot) => (
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

/** Static index of every island and its spots, for the archipelago page. */
export function CanaryGuide({ index }: { index: string }) {
  return (
    <section id="guia" className="reveal mt-20 sm:mt-36" aria-labelledby="guia-title">
      <div className="mb-10 grid gap-3 sm:grid-cols-2 sm:items-end">
        <div>
          <SectionIndex index={index} />
          <h2 id="guia-title" className="display mt-2 text-[2.75rem] leading-none sm:text-6xl">
            Guía de spots
          </h2>
        </div>
        <p className="max-w-md text-ink-2 sm:justify-self-end">
          Los picos que seguimos en cada isla. Solo olas con nombre propio: nada de playas que rara vez rompen.
        </p>
      </div>

      <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {ISLANDS.map((island) => (
          <div key={island.id}>
            <h3 className="flex items-baseline justify-between border-b border-line pb-2">
              <Link href={`/${island.id}`} className="text-lg font-medium text-ink hover:underline hover:underline-offset-4">
                {island.name}
              </Link>
              <span className="text-xs text-ink-3 tabular-nums">{spotsOfIsland(island.id).length} spots</span>
            </h3>
            <ul className="mt-3 space-y-1.5 text-sm">
              {spotsOfIsland(island.id).map((spot) => (
                <li key={spot.id}>
                  <Link href={`/spots/${spot.slug}`} className="text-ink-2 hover:text-ink hover:underline hover:underline-offset-4">
                    {spot.name}
                  </Link>
                  <span className="ml-1.5 text-xs text-ink-3">{SKILL_LABEL[spot.skillLevel]}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
