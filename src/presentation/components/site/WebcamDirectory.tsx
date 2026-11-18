import Link from 'next/link';
import { Webcam } from '@/domain/models/Webcam';
import { ALL_SPOTS } from '@/infrastructure/spots';
import { WebcamEmbed } from '@/presentation/components/spot/WebcamEmbed';
import { paths } from '@/presentation/lib/routes';

const SPOTS_BY_ID = new Map(ALL_SPOTS.map((s) => [s.id, s]));

/** Players that run inside Wavez first, then cameras on their owners' sites. */
export function embedsFirst(cams: Webcam[]): Webcam[] {
  return [...cams].sort((a, b) => Number(a.source.kind === 'link') - Number(b.source.kind === 'link'));
}

function SpotLinks({ label, ids }: { label: string; ids: string[] }) {
  const spots = ids.map((id) => SPOTS_BY_ID.get(id)).filter((s) => s !== undefined);
  if (!spots.length) return null;
  return (
    <p>
      <span className="text-ink-3">{label}: </span>
      {spots.map((s, i) => (
        <span key={s.id}>
          {i > 0 && ', '}
          <Link href={paths.spot(s.slug)} className="text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
            {s.name.split(' (')[0]}
          </Link>
        </span>
      ))}
    </p>
  );
}

/**
 * Server-rendered list of cameras: each one with what it shows and links to
 * the spots it covers, so the page carries real text for search engines.
 */
export function WebcamDirectory({ webcams, headingLevel = 'h2' }: { webcams: Webcam[]; headingLevel?: 'h2' | 'h3' }) {
  const Heading = headingLevel;
  return (
    <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2">
      {embedsFirst(webcams).map((w) => (
        <article key={w.id} className="min-w-0">
          <WebcamEmbed webcam={w} />
          <Heading className="mt-3 font-medium text-ink">Webcam {w.name}</Heading>
          <div className="mt-1 space-y-0.5 text-sm text-ink-2">
            <p className="text-ink-3">
              {w.source.kind === 'embed' ? 'Vídeo en directo dentro de Wavez' : 'Foto en directo; el vídeo se abre en la web de su autor'} ·{' '}
              {w.source.provider}
            </p>
            <SpotLinks label="Enfoca" ids={w.spotsInView} />
            <SpotLinks label="Cerca" ids={w.spotsNearby} />
          </div>
        </article>
      ))}
    </div>
  );
}

export function webcamCountLabel(n: number): string {
  return `${n} ${n === 1 ? 'webcam' : 'webcams'}`;
}
