/**
 * Refreshes the marine snapshot the website reads, downloading from
 * Open-Meteo only when a model has published new data. Run by the
 * "Refresh marine data" GitHub Action; can also be run locally:
 *
 *   npx tsx scripts/refresh-marine-snapshot.ts out/marine-snapshot.json [previous-snapshot.json]
 *
 * Writes the output file when there is something to publish (new data, or
 * the previous data re-confirmed as current). Writes nothing when Open-Meteo
 * is unreachable, so the published snapshot stays as it is.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { ALL_SPOTS } from '@/infrastructure/spots';
import { fetchOpenMeteo, parseOpenMeteo } from '@/infrastructure/adapters/openMeteo';
import { MarineSnapshot, decideRefresh, slimRaw } from '@/infrastructure/adapters/marineSnapshot';

const FETCH_OPTIONS = { timeoutMs: 30_000, retries: 3 };

function readPrevious(path: string | undefined): MarineSnapshot | null {
  if (!path || !existsSync(path)) return null;
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as MarineSnapshot;
    return parsed?.version === 1 && parsed.spots && typeof parsed.generatedAt === 'string' ? parsed : null;
  } catch {
    console.log('::warning::The previous snapshot could not be read, doing a full download');
    return null;
  }
}

function write(out: string, snapshot: MarineSnapshot) {
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(snapshot));
}

const toLocation = (spot: (typeof ALL_SPOTS)[number]) => ({ ...spot.location, marine: spot.marinePoint });

async function main() {
  const out = process.argv[2] ?? 'out/marine-snapshot.json';
  const previous = readPrevious(process.argv[3]);
  const spotIds = ALL_SPOTS.map((s) => s.id);
  const probeSpot = ALL_SPOTS[0];
  const now = Date.now();

  // Cheap check first: two requests for one spot instead of two for every spot
  let probe = null;
  if (previous) {
    try {
      [probe] = await fetchOpenMeteo([toLocation(probeSpot)], FETCH_OPTIONS);
    } catch (error) {
      console.log(`::warning::Probe request failed: ${(error as Error).message}`);
    }
  }

  const decision = decideRefresh({ previous, spotIds, probeId: probeSpot.id, probe, now });
  console.log(`Decision: ${decision.action} (${decision.reason})`);

  if (decision.action === 'reuse' && previous) {
    write(out, { ...previous, checkedAt: new Date(now).toISOString() });
    console.log(`Re-published the snapshot from ${previous.generatedAt}, confirmed current`);
    return;
  }

  let raws;
  try {
    raws = await fetchOpenMeteo(ALL_SPOTS.map(toLocation), FETCH_OPTIONS);
  } catch (error) {
    // Not fatal: the previous snapshot stays published and its age is shown on the site
    console.log(`::warning::Open-Meteo unavailable, keeping the previous snapshot: ${(error as Error).message}`);
    return;
  }

  const generatedAt = new Date().toISOString();
  const snapshot: MarineSnapshot = { version: 1, generatedAt, checkedAt: generatedAt, spots: {} };
  ALL_SPOTS.forEach((spot, i) => {
    if (parseOpenMeteo(raws[i]).hours.length === 0) console.log(`::warning::No usable hours for ${spot.id}`);
    snapshot.spots[spot.id] = slimRaw(raws[i]);
  });
  write(out, snapshot);
  console.log(`Wrote ${out} with ${Object.keys(snapshot.spots).length} spots at ${generatedAt}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
