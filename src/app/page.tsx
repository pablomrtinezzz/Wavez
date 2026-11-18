import { CanaryHome } from '@/presentation/components/site/CanaryHome';
import { CanaryGuide } from '@/presentation/components/site/SpotGuide';
import { ALL_SPOTS } from '@/infrastructure/spots';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/presentation/lib/site';
import { ISLANDS } from '@/domain/models/Island';
import { itemList, jsonLdScript } from '@/presentation/lib/jsonLd';

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      inLanguage: 'es',
    },
    {
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
    },
    itemList(
      SITE_URL,
      'Previsión de surf por isla',
      ISLANDS.map((i) => ({ name: `Surf en ${i.name}`, path: `/${i.id}` }))
    ),
  ],
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <CanaryHome spotIds={ALL_SPOTS.map((s) => s.id)} guide={<CanaryGuide index="05" />} />
    </>
  );
}
