import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_SNAPSHOT_AGE_MS, MarineSnapshot, decideRefresh, slimRaw, snapshotFreshAt } from './marineSnapshot';
import { OpenMeteoRaw } from './openMeteo';

const raw = (height: number): OpenMeteoRaw => ({
  marine: { hourly: { time: ['2026-11-17T10:00'], swell_wave_height: [height] } },
  weather: { hourly: { time: ['2026-11-17T10:00'], wind_speed_10m: [10] }, daily: { time: ['2026-11-17'] } },
});

const NOW = Date.parse('2026-11-17T12:00:00Z');
const snapshot = (generatedAt: string, spots: Record<string, OpenMeteoRaw>): MarineSnapshot => ({ version: 1, generatedAt, spots });

describe('decideRefresh', () => {
  const recent = new Date(NOW - 60 * 60 * 1000).toISOString();
  const base = { spotIds: ['a', 'b'], probeId: 'a', now: NOW };

  test('reuses the snapshot when the probe matches the published data', () => {
    const previous = snapshot(recent, { a: slimRaw(raw(1.2)), b: slimRaw(raw(0.8)) });
    // Extra fields Open-Meteo returns (elevation, timings...) do not count as a change
    const probe = { ...raw(1.2), marine: { ...raw(1.2).marine, generationtime_ms: 3 } } as OpenMeteoRaw;
    assert.equal(decideRefresh({ ...base, previous, probe }).action, 'reuse');
  });

  test('downloads when the probe differs (a new model run landed)', () => {
    const previous = snapshot(recent, { a: raw(1.2), b: raw(0.8) });
    assert.equal(decideRefresh({ ...base, previous, probe: raw(1.4) }).action, 'download');
  });

  test('downloads when there is no previous snapshot or the probe failed', () => {
    assert.equal(decideRefresh({ ...base, previous: null, probe: raw(1.2) }).action, 'download');
    const previous = snapshot(recent, { a: raw(1.2), b: raw(0.8) });
    assert.equal(decideRefresh({ ...base, previous, probe: null }).action, 'download');
  });

  test('downloads when spots were added or removed', () => {
    const previous = snapshot(recent, { a: raw(1.2) });
    assert.equal(decideRefresh({ ...base, previous, probe: raw(1.2) }).action, 'download');
  });

  test('forces a download once the data reaches the maximum age', () => {
    const old = new Date(NOW - MAX_SNAPSHOT_AGE_MS).toISOString();
    const previous = snapshot(old, { a: raw(1.2), b: raw(0.8) });
    assert.equal(decideRefresh({ ...base, previous, probe: raw(1.2) }).action, 'download');
  });
});

describe('snapshotFreshAt', () => {
  test('prefers the last check over the last download', () => {
    assert.equal(snapshotFreshAt({ generatedAt: 'a', checkedAt: 'b' }), 'b');
    assert.equal(snapshotFreshAt({ generatedAt: 'a' }), 'a');
  });
});
