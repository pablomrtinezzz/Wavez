import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SpotSummaryDTO } from '@/application/dtos/SpotSummaryDTO';
import { SkillLevel } from '@/domain/models/Spot';
import { ConditionQuality } from '@/domain/models/SpotScore';
import { pickSpots, zoneStates } from './picks';

function summary(id: string, skill: SkillLevel, score: number, quality: ConditionQuality, wind = 10, zone = 'lz-famara'): SpotSummaryDTO {
  return {
    spot: { id, skillLevel: skill, zone, island: 'lanzarote' },
    score: { overallScore: score, quality },
    conditions: { wind: { speedKmh: wind } },
  } as unknown as SpotSummaryDTO;
}

describe('pickSpots', () => {
  const all = [
    summary('slab', 'expert', 90, 'firing', 20),
    summary('beach', 'all-levels', 60, 'fair', 15),
    summary('reef', 'intermediate', 70, 'good', 5),
    summary('flat', 'all-levels', 10, 'flat', 1),
  ];
  const byId = Object.fromEntries(pickSpots(all).map((p) => [p.id, p.spots.map((s) => s.spot.id)]));

  test('beginners only get spots for every level, best first', () => {
    assert.deepEqual(byId.learn, ['beach', 'flat']);
  });

  test('each level keeps to its own spots', () => {
    assert.deepEqual(byId.intermediate, ['reef']);
    assert.deepEqual(byId.advanced, ['slab']);
  });

  test('the calmest pick ignores spots that are not surfable', () => {
    assert.deepEqual(byId.glassy, ['reef', 'beach', 'slab']);
  });
});

describe('zoneStates', () => {
  test('reports the best spot and how many are surfable per zone', () => {
    const [famara, empty] = zoneStates(
      [summary('a', 'all-levels', 60, 'fair'), summary('b', 'advanced', 20, 'poor')],
      ['lz-famara', 'lz-este']
    );
    assert.equal(famara.best?.spot.id, 'a');
    assert.equal(famara.surfable, 1);
    assert.equal(famara.total, 2);
    assert.equal(empty.best, null);
  });
});
