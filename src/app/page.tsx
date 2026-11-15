import { HomeClient } from '@/presentation/components/site/HomeClient';
import { SpotGuide } from '@/presentation/components/site/SpotGuide';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/presentation/lib/site';

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
  areaServed: { '@type': 'Place', name: 'Gran Canaria, Islas Canarias, España' },
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomeClient guide={<SpotGuide />} />
    </>
  );
}
