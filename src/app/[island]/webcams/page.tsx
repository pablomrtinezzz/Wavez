import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { ISLANDS, ISLAND_IDS, getIsland, isIslandId } from '@/domain/models/Island';
import { webcamsOfIsland } from '@/infrastructure/webcams';
import { SiteFooter } from '@/presentation/components/site/SiteChrome';
import { StaticHeader } from '@/presentation/components/site/StaticHeader';
import { WebcamDirectory, webcamCountLabel } from '@/presentation/components/site/WebcamDirectory';
import { paths } from '@/presentation/lib/routes';
import { SITE_NAME, SITE_URL } from '@/presentation/lib/site';

/** Unknown islands answer a real 404 (see src/proxy.ts); every valid one is prerendered. */
export const instant = false;

export function generateStaticParams() {
  return ISLAND_IDS.map((island) => ({ island }));
}

export async function generateMetadata({ params }: PageProps<'/[island]/webcams'>): Promise<Metadata> {
  const { island } = await params;
  if (!isIslandId(island)) return {};
  const info = getIsland(island);
  const cams = webcamsOfIsland(island);
  const title = `Webcams de surf en ${info.name} en directo`;
  const description = `${webcamCountLabel(cams.length)} en directo para ver el mar en ${info.name} antes de salir: ${cams
    .slice(0, 5)
    .map((w) => w.name)
    .join(', ')}${cams.length > 5 ? '…' : ''}. Con la previsión de olas de cada spot.`;
  return {
    title,
    description,
    alternates: { canonical: paths.webcams(island) },
    openGraph: { title: `${title} · ${SITE_NAME}`, description, url: `${SITE_URL}${paths.webcams(island)}`, type: 'website' },
  };
}

export default async function IslandWebcamsPage({ params }: PageProps<'/[island]/webcams'>) {
  const { island } = await params;
  if (!isIslandId(island)) notFound();
  const info = getIsland(island);
  const cams = webcamsOfIsland(island);

  return (
    <>
      <StaticHeader
        links={[
          { href: paths.webcams(), label: 'Todas las webcams' },
          { href: paths.island(island), label: `Surf en ${info.name}` },
        ]}
      />
      <main className="mx-auto max-w-4xl px-5 pb-10 pt-12 sm:px-8 sm:pt-16">
        <nav aria-label="Ruta" className="text-xs text-ink-3">
          <Link href="/" className="hover:text-ink">
            Canarias
          </Link>{' '}
          ·{' '}
          <Link href={paths.island(island)} className="hover:text-ink">
            {info.name}
          </Link>{' '}
          · <span aria-current="page">Webcams</span>
        </nav>
        <h1 className="display mt-3 text-5xl sm:text-7xl">Webcams de surf en {info.name}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
          {webcamCountLabel(cams.length)} para mirar el mar en {info.name} antes de coger el coche. Las de In2theBeach y algunos
          directos de YouTube se ven aquí mismo; las demás muestran su foto en directo y abren el vídeo en la web de su autor.
        </p>
        <Link
          href={paths.island(island)}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-ocean px-5 py-3 text-sm font-medium text-sand transition hover:bg-ocean-deep"
        >
          Previsión de olas de {info.name} hora a hora <ArrowRight className="size-4" />
        </Link>

        <div className="mt-14">
          <WebcamDirectory webcams={cams} />
        </div>

        <section className="mt-20" aria-labelledby="otras">
          <h2 id="otras" className="border-b border-line pb-3 text-xl font-medium">
            Webcams en otras islas
          </h2>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {ISLANDS.filter((i) => i.id !== island).map((i) => (
              <li key={i.id}>
                <Link href={paths.webcams(i.id)} className="text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink">
                  {i.name}
                </Link>{' '}
                <span className="text-ink-3 tabular-nums">{webcamsOfIsland(i.id).length}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
