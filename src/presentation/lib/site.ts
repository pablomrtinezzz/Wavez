/** Public URL of the site, used for canonical links, Open Graph and the sitemap. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

export const SITE_NAME = 'Wavez';
export const SITE_TAGLINE = 'El parte de olas de Gran Canaria';
export const SITE_DESCRIPTION =
  'Previsión de surf gratuita para 20 spots de Gran Canaria: oleaje, viento, marea, temperatura del agua y webcams en directo, hora a hora, con una nota de 0 a 10 para cada pico.';
