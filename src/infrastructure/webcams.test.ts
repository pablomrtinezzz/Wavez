import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { WEBCAMS, webcamsOfSpot } from './webcams';
import { ALL_SPOTS } from './spots';
import { isApprovedWebcamUrl } from '@/presentation/lib/utils';

describe('webcam catalogue', () => {
  test('ids are unique and every camera points at spots of its own island', () => {
    assert.equal(new Set(WEBCAMS.map((w) => w.id)).size, WEBCAMS.length);
    for (const w of WEBCAMS) {
      for (const id of [...w.spotsInView, ...w.spotsNearby]) {
        const spot = ALL_SPOTS.find((s) => s.id === id);
        assert.ok(spot, `${w.id} points at unknown spot ${id}`);
        assert.equal(spot.island, w.island, `${w.id} → ${id} is on another island`);
      }
    }
  });

  test('embedded players come only from approved hosts over HTTPS', () => {
    for (const w of WEBCAMS) {
      if (w.source.kind === 'embed') assert.ok(isApprovedWebcamUrl(w.source.embedUrl), w.id);
      assert.match(w.source.pageUrl, /^https:\/\//, w.id);
      if (w.source.kind === 'link' && w.source.snapshotUrl) {
        assert.ok(['embed.skylinewebcams.com', 'i.ytimg.com'].includes(new URL(w.source.snapshotUrl).hostname), `${w.id} snapshot host`);
      }
    }
  });

  test('a spot lists the cameras pointing at it before nearby ones', () => {
    const cams = webcamsOfSpot('famara');
    assert.ok(cams.length >= 2);
    assert.ok(cams.every((w) => w.spotsInView.includes('famara')));
    const arg = webcamsOfSpot('arguineguin').map((w) => w.id);
    assert.deepEqual(arg.slice(0, 1), ['arguineguin']);
  });
});
