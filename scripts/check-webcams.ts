/**
 * Reports webcams that stopped streaming, so dead cameras can be replaced:
 *
 *   npm run check:webcams
 *
 * - In2theBeach players: the HLS playlist behind the player must advance.
 * - YouTube embeds and links: the video must be live now (and embeddable,
 *   when Wavez plays it inside the page).
 * - Other links: the page must answer.
 */
import { WEBCAMS } from '@/infrastructure/webcams';
import { Webcam } from '@/domain/models/Webcam';

const UA = { 'User-Agent': 'Mozilla/5.0 (wavez-webcam-check)', 'Accept-Language': 'es', Cookie: 'CONSENT=YES+1; SOCS=CAI' };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function text(url: string): Promise<string> {
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/** Media sequence of an HLS playlist, following one variant playlist. */
async function mediaSequence(url: string): Promise<number | null> {
  let body = await text(url);
  const variant = body.split('\n').find((l) => l.trim() && !l.startsWith('#') && l.includes('.m3u8'));
  if (variant) body = await text(new URL(variant.trim(), url).toString());
  const m = body.match(/#EXT-X-MEDIA-SEQUENCE:(\d+)/);
  return m ? Number(m[1]) : null;
}

async function checkIn2theBeach(w: Webcam & { source: { kind: 'embed' } }): Promise<string | null> {
  const viewer = await text(w.source.embedUrl);
  const stream = viewer.match(/loadWebcam\('([^']+)'/)?.[1];
  if (!stream) return 'the player has no stream';
  const first = await mediaSequence(stream);
  await sleep(20_000);
  const second = await mediaSequence(stream);
  return first !== null && second !== null && second > first ? null : 'the stream is not advancing';
}

async function checkYouTube(w: Webcam): Promise<string | null> {
  const page = await text(w.source.pageUrl);
  if (!/"isLiveNow":true/.test(page)) return 'not live';
  if (w.source.kind === 'embed' && /"playableInEmbed":false/.test(page)) return 'embedding was disabled';
  return null;
}

async function check(w: Webcam): Promise<string | null> {
  try {
    if (w.source.kind === 'embed' && w.source.embedUrl.includes('in2thebeach.es')) return await checkIn2theBeach(w as never);
    if (w.source.pageUrl.includes('youtube.com/watch')) return await checkYouTube(w);
    await text(w.source.pageUrl);
    return null;
  } catch (error) {
    return (error as Error).message;
  }
}

async function main() {
  // Players are checked in parallel (each waits 20 s); pages one by one, so no site rate-limits us
  const isPlayer = (w: Webcam) => w.source.kind === 'embed' && w.source.embedUrl.includes('in2thebeach.es');
  const players = Promise.all(WEBCAMS.filter(isPlayer).map(async (w) => ({ w, problem: await check(w) })));
  const pages: { w: Webcam; problem: string | null }[] = [];
  for (const w of WEBCAMS.filter((x) => !isPlayer(x))) {
    pages.push({ w, problem: await check(w) });
    await sleep(1500);
  }
  const byId = new Map([...(await players), ...pages].map((r) => [r.w.id, r]));
  const results = WEBCAMS.map((w) => byId.get(w.id)!);
  for (const { w, problem } of results) console.log(`${problem ? 'FAIL' : ' ok '}  ${w.id.padEnd(24)} ${w.source.provider.padEnd(34)} ${problem ?? ''}`);
  const failed = results.filter((r) => r.problem).length;
  console.log(`\n${WEBCAMS.length - failed}/${WEBCAMS.length} webcams ok`);
  process.exitCode = failed ? 1 : 0;
}

main();
