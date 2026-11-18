/** Public URL of the site, used for canonical links, Open Graph and the sitemap. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

export const SITE_NAME = 'Wavez';
export const SITE_TAGLINE = 'El parte de olas de Canarias';
export const SITE_DESCRIPTION =
  'Previsión de surf gratuita para los spots de las siete islas: Gran Canaria, Tenerife, Lanzarote, Fuerteventura, La Palma, La Gomera y El Hierro. Oleaje, viento, marea, temperatura del agua y webcams en directo, hora a hora, con una nota de 0 a 10 para cada pico.';

/**
 * Open Graph for a page. A page that sets `openGraph` replaces the layout's
 * whole object, so the site name, locale and share image are added here.
 */
export function pageOpenGraph(og: { title: string; description: string; url: string; type?: 'website' | 'article'; locale?: string }) {
  return {
    siteName: SITE_NAME,
    locale: 'es_ES',
    type: 'website' as const,
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: `${SITE_NAME} · ${SITE_TAGLINE}` }],
    ...og,
  };
}

/** Author and project links shown in the footer. */
export const AUTHOR_NAME = 'Pablo Martínez';
export const REPO_URL = 'https://github.com/pablomrtinezzz/wavez';
export const GITHUB_URL = 'https://github.com/pablomrtinezzz';
export const LINKEDIN_URL = 'https://www.linkedin.com/in/pablomrtinezzz/';
/** Buy Me a Coffee page; the support link is hidden while this is null. */
export const SUPPORT_URL: string | null = 'https://buymeacoffee.com/pablomrtinezzz';
