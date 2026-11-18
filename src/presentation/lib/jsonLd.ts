/**
 * Serialises structured data for a <script type="application/ld+json"> tag.
 * JSON.stringify does not escape "<", so a value containing "</script>" could
 * close the tag and inject markup; "<" is replaced by its unicode escape.
 */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/** schema.org BreadcrumbList from the page trail; `path` is relative to `baseUrl`. */
export function breadcrumbList(baseUrl: string, items: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${baseUrl}${item.path === '/' ? '' : item.path}`,
    })),
  };
}

/** schema.org ItemList of links, e.g. the spots of an island. */
export function itemList(baseUrl: string, name: string, items: { name: string; path: string }[]) {
  return {
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, url: `${baseUrl}${item.path}` })),
  };
}
