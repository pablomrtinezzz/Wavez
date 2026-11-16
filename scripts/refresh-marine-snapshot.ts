/**
 * Downloads the 15-day marine timeline for every spot from Open-Meteo and
 * writes the snapshot the website reads. Run by the "Refresh marine data"
 * GitHub Action; can also be run locally:
 *
 *   npx tsx scripts/refresh-marine-snapshot.ts out/marine-snapshot.json
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { GRAN_CANARIA_SPOTS } from '@/infrastructure/repositories/StaticSpotRepository';
import { fetchOpenMeteo, parseOpenMeteo } from '@/infrastructure/adapters/openMeteo';
import { MarineSnapshot, slimRaw } from '@/infrastructure/adapters/marineSnapshot';

async function main() {
  const out = process.argv[2] ?? 'out/marine-snapshot.json';
  let raws;
  try {
    raws = await fetchOpenMeteo(
      GRAN_CANARIA_SPOTS.map((s) => ({ ...s.location, marine: s.marinePoint })),
      { timeoutMs: 30_000, retries: 3 }
    );
  } catch (error) {
    // Not fatal: the previous snapshot stays published and the website falls
    // back to live Open-Meteo requests once it is older than 3 hours.
    console.log(`::warning::Open-Meteo unavailable, keeping the previous snapshot: ${(error as Error).message}`);
    return;
  }

  const snapshot: MarineSnapshot = { version: 1, generatedAt: new Date().toISOString(), spots: {} };
  GRAN_CANARIA_SPOTS.forEach((spot, i) => {
    const hours = parseOpenMeteo(raws[i]).hours.length;
    if (hours === 0) console.warn(`No usable hours for ${spot.id}`);
    snapshot.spots[spot.id] = slimRaw(raws[i]);
  });

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(snapshot));
  console.log(`Wrote ${out} with ${Object.keys(snapshot.spots).length} spots at ${snapshot.generatedAt}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
