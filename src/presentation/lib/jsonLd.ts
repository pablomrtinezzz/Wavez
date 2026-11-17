/**
 * Serialises structured data for a <script type="application/ld+json"> tag.
 * JSON.stringify does not escape "<", so a value containing "</script>" could
 * close the tag and inject markup; "<" is replaced by its unicode escape.
 */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
