import type { Metadata } from 'next';
import Link from 'next/link';
import { ISLANDS } from '@/domain/models/Island';
import { WEBCAMS, webcamsOfIsland } from '@/infrastructure/webcams';
import { SiteFooter } from '@/presentation/components/site/SiteChrome';
import { StaticHeader } from '@/presentation/components/site/StaticHeader';
import { WebcamDirectory, webcamCountLabel } from '@/presentation/components/site/WebcamDirectory';
import { paths } from '@/presentation/lib/routes';
import { SITE_NAME, SITE_URL } from '@/presentation/lib/site';

const title = 'Webcams de surf en Canarias en directo';
const description = `Las ${WEBCAMS.length} webcams de playas y spots de surf de las siete islas en una página: Las Canteras, Famara, Corralejo, Las Américas, Pozo Izquierdo y más, con la previsión de olas de cada spot.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: paths.webcams() },
  openGraph: { title: `${title} · ${SITE_NAME}`, description, url: `${SITE_URL}${paths.webcams()}`, type: 'website' },
};

export default function WebcamsPage() {
  const islands = ISLANDS.filter((i) => webcamsOfIsland(i.id).length > 0);
  return (
    <>
      <StaticHeader links={[{ href: '/', label: 'Previsión de Canarias' }]} />
      <main className="mx-auto max-w-4xl px-5 pb-10 pt-12 sm:px-8 sm:pt-16">
        <p className="eyebrow !text-ocean">Canarias · {WEBCAMS.length} cámaras</p>
        <h1 className="display mt-3 text-5xl sm:text-7xl">Webcams de surf en Canarias</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
          Todas las cámaras que apuntan al mar en las islas, ordenadas por isla. Las de In2theBeach y algunos directos de YouTube
          se ven aquí mismo; las demás muestran su foto en directo y abren el vídeo en la web de su autor.
        </p>
        <nav aria-label="Islas" className="mt-8 flex flex-wrap gap-2 text-sm">
          {islands.map((i) => (
            <a key={i.id} href={`#${i.id}`} className="rounded-full border border-line px-3 py-1.5 text-ink-2 hover:border-ink hover:text-ink">
              {i.name} <span className="text-ink-3 tabular-nums">{webcamsOfIsland(i.id).length}</span>
            </a>
          ))}
        </nav>

        {islands.map((i) => {
          const cams = webcamsOfIsland(i.id);
          return (
            <section key={i.id} id={i.id} className="mt-20 scroll-mt-6" aria-labelledby={`${i.id}-title`}>
              <div className="mb-8 flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
                <h2 id={`${i.id}-title`} className="display text-4xl">
                  {i.name}
                </h2>
                <Link href={paths.webcams(i.id)} className="text-sm text-ink-2 hover:text-ink">
                  {webcamCountLabel(cams.length)} de {i.name} →
                </Link>
              </div>
              <WebcamDirectory webcams={cams} headingLevel="h3" />
            </section>
          );
        })}
      </main>
      <SiteFooter />
    </>
  );
}
