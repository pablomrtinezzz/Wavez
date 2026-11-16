import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SnapshotMarineAdapter } from './SnapshotMarineAdapter';
import { TimelineMarineService } from './OpenMeteoMarineAdapter';
import { SpotTimeline } from './openMeteo';
import { MarineSnapshot } from './marineSnapshot';

const hours = ['2026-11-15T09:00', '2026-11-15T10:00'];
const raw = {
  marine: {
    hourly: {
      time: hours,
      swell_wave_height: [1.2, 1.3],
      swell_wave_period: [11, 12],
      swell_wave_direction: [330, 330],
      sea_level_height_msl: [0.1, 0.2],
    },
  },
  weather: {
    hourly: { time: hours, wind_speed_10m: [8, 9], wind_direction_10m: [180, 180], wind_gusts_10m: [12, 14] },
    daily: { time: ['2026-11-15'], sunrise: ['2026-11-15T07:23'], sunset: ['2026-11-15T18:08'] },
  },
};

function dataUrl(snapshot: MarineSnapshot) {
  return `data:application/json,${encodeURIComponent(JSON.stringify(snapshot))}`;
}

class FakeLive extends TimelineMarineService {
  calls = 0;
  async getDataUpdatedAt(): Promise<string | null> {
    return null;
  }
  async getTimeline(): Promise<SpotTimeline> {
    this.calls++;
    return { hours: [], daylight: new Map() };
  }
}

describe('SnapshotMarineAdapter', () => {
  test('serves spots from a fresh snapshot without calling Open-Meteo', async () => {
    const live = new FakeLive();
    const adapter = new SnapshotMarineAdapter(
      dataUrl({ version: 1, generatedAt: new Date().toISOString(), spots: { 'la-cicer': raw } }),
      live
    );
    const c = await adapter.getConditionsForTimestamp('la-cicer', 0, 0, '2026-11-15T10:00');
    assert.equal(c.primarySwell.heightM, 1.3);
    assert.equal((await adapter.getDaylight('la-cicer', 0, 0, '2026-11-15'))?.sunset, '2026-11-15T18:08');
    assert.equal(live.calls, 0);
  });

  test('keeps serving an old snapshot and reports when it was generated', async () => {
    const live = new FakeLive();
    const old = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const adapter = new SnapshotMarineAdapter(dataUrl({ version: 1, generatedAt: old, spots: { 'la-cicer': raw } }), live);
    const c = await adapter.getConditionsForTimestamp('la-cicer', 0, 0, '2026-11-15T09:00');
    assert.equal(c.primarySwell.heightM, 1.2);
    assert.equal(live.calls, 0);
    assert.equal(await adapter.getDataUpdatedAt(), old);
  });

  test('uses the live adapter only for spots missing from the snapshot', async () => {
    const live = new FakeLive();
    const adapter = new SnapshotMarineAdapter(
      dataUrl({ version: 1, generatedAt: new Date().toISOString(), spots: { 'la-cicer': raw } }),
      live
    );
    await adapter.getTimeline('la-cicer', 0, 0);
    await adapter.getTimeline('el-confital', 0, 0);
    assert.equal(live.calls, 1);
  });
});
