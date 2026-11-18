import Link from 'next/link';
import { BrandMark } from './SiteChrome';

/** Header of the static pages (spot guides, webcams): the brand and one way back. */
export function StaticHeader({
  homeHref = '/',
  homeLabel = 'Wavez, inicio',
  links,
}: {
  homeHref?: string;
  homeLabel?: string;
  links: { href: string; label: string; hrefLang?: string; lang?: string }[];
}) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href={homeHref} className="inline-flex shrink-0 items-center gap-2 text-ink" aria-label={homeLabel}>
          <BrandMark className="size-7" />
          <span className="display text-2xl">Wavez</span>
        </Link>
        <nav className="flex min-w-0 items-center gap-4 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} hrefLang={l.hrefLang} lang={l.lang} className="truncate text-ink-2 hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
