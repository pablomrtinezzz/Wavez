/** Public URL of the site, used for canonical links, Open Graph and the sitemap. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

export const SITE_NAME = 'Wavez';
export const SITE_TAGLINE = 'El parte de olas de Canarias';
export const SITE_DESCRIPTION =
  'Previsión de surf gratuita para los spots de Gran Canaria, Tenerife, Lanzarote, Fuerteventura, La Palma y La Gomera: oleaje, viento, marea, temperatura del agua y webcams en directo, hora a hora, con una nota de 0 a 10 para cada pico.';

/** Author and project links shown in the footer. */
export const AUTHOR_NAME = 'Pablo Martínez';
export const REPO_URL = 'https://github.com/pablomrtinezzz/wavez';
export const GITHUB_URL = 'https://github.com/pablomrtinezzz';
export const LINKEDIN_URL = 'https://www.linkedin.com/in/pablomrtinezzz/';
/** Buy Me a Coffee page; the support link is hidden while this is null. */
export const SUPPORT_URL: string | null = 'https://buymeacoffee.com/pablomrtinezzz';
