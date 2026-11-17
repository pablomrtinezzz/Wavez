import { CanaryHome } from '@/presentation/components/site/CanaryHome';
import { CanaryGuide } from '@/presentation/components/site/SpotGuide';
import { ALL_SPOTS } from '@/infrastructure/spots';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/presentation/lib/site';
import { jsonLdScript } from '@/presentation/lib/jsonLd';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: 'SportsApplication',
  operatingSystem: 'Web',
  inLanguage: 'es',
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  areaServed: { '@type': 'Place', name: 'Islas Canarias, España' },
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <CanaryHome spotIds={ALL_SPOTS.map((s) => s.id)} guide={<CanaryGuide index="04" />} />
    </>
  );
}
