import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ISLANDS, islandOfZone } from '@/domain/models/Island';
import { ALL_SPOTS } from './index';
import { ISLAND_COASTS } from '@/presentation/components/site/islandGeometry';

type Pt = [number, number];

/** Kilometres between two [lat, lng] points (equirectangular, fine at island scale). */
function km([lat1, lng1]: Pt, [lat2, lng2]: Pt): number {
  const x = ((lng2 - lng1) * Math.PI) / 180 * Math.cos((((lat1 + lat2) / 2) * Math.PI) / 180);
  const y = ((lat2 - lat1) * Math.PI) / 180;
  return Math.hypot(x, y) * 6371;
}

function distanceToRingKm(p: Pt, ring: Pt[]): number {
  let best = Infinity;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    // Sample the segment: precise enough for a sanity check
    for (let t = 0; t <= 1; t += 0.1) best = Math.min(best, km(p, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]));
  }
  return best;
}

function inside([lat, lng]: Pt, ring: Pt[]): boolean {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [yi, xi] = ring[i];
    const [yj, xj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

describe('spot catalogue', () => {
  test('ids and slugs are unique and URL-safe', () => {
    const ids = ALL_SPOTS.map((s) => s.id);
    const slugs = ALL_SPOTS.map((s) => s.slug);
    assert.equal(new Set(ids).size, ids.length, 'duplicate spot id');
    assert.equal(new Set(slugs).size, slugs.length, 'duplicate spot slug');
    for (const s of ALL_SPOTS) assert.match(s.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, s.slug);
  });

  test('every spot sits in a zone of its own island, and every island has spots', () => {
    for (const s of ALL_SPOTS) assert.equal(islandOfZone(s.zone), s.island, `${s.id} zone ${s.zone}`);
    for (const island of ISLANDS) {
      for (const zone of island.zones) {
        assert.ok(ALL_SPOTS.some((s) => s.zone === zone.id), `zone ${zone.id} has no spots`);
      }
    }
  });

  test('ideal conditions are coherent', () => {
    for (const s of ALL_SPOTS) {
      const c = s.idealConditions;
      assert.ok(c.minSwellHeightM < c.maxSwellHeightM, s.id);
      for (const deg of [c.optimalSwellDegrees.min, c.optimalSwellDegrees.max, c.favorableWindDegrees.min, c.favorableWindDegrees.max]) {
        assert.ok(deg >= 0 && deg <= 360, `${s.id} direction ${deg}`);
      }
    }
  });

  test('every spot is on its island coast (within 1.5 km of the outline)', () => {
    for (const s of ALL_SPOTS) {
      const rings = ISLAND_COASTS[s.island];
      const d = Math.min(...rings.map((r) => distanceToRingKm([s.location.lat, s.location.lng], r)));
      assert.ok(d < 1.5, `${s.id} is ${d.toFixed(2)} km from the coast`);
    }
  });

  test('ocean model points are at sea, off the spot', () => {
    for (const s of ALL_SPOTS) {
      if (!s.marinePoint) continue;
      const p: Pt = [s.marinePoint.lat, s.marinePoint.lng];
      for (const ring of ISLAND_COASTS[s.island]) assert.ok(!inside(p, ring), `${s.id} marine point is on land`);
      const d = km([s.location.lat, s.location.lng], p);
      assert.ok(d < 30, `${s.id} marine point is ${d.toFixed(1)} km away`);
    }
  });

  test('swell and wind windows match the way the spot faces', () => {
    // The ocean model point is offshore in the direction the spot faces: the
    // swell window must include that direction and the favourable wind must
    // include the land breeze, which blows from the opposite side
    const bearing = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
      const φ1 = (a.lat * Math.PI) / 180;
      const φ2 = (b.lat * Math.PI) / 180;
      const Δλ = ((b.lng - a.lng) * Math.PI) / 180;
      const y = Math.sin(Δλ) * Math.cos(φ2);
      const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
      return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
    };
    const outside = (deg: number, w: { min: number; max: number }) => {
      const inside = w.min <= w.max ? deg >= w.min && deg <= w.max : deg >= w.min || deg <= w.max;
      if (inside) return 0;
      const d = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
      return Math.min(d(deg, w.min), d(deg, w.max));
    };
    for (const s of ALL_SPOTS) {
      if (!s.marinePoint) continue;
      const facing = bearing(s.location, s.marinePoint);
      assert.ok(outside(facing, s.idealConditions.optimalSwellDegrees) <= 45, `${s.id} faces ${facing.toFixed(0)}° but its swell window is elsewhere`);
      assert.ok(outside((facing + 180) % 360, s.idealConditions.favorableWindDegrees) <= 45, `${s.id}: favourable wind is not the land breeze`);
    }
  });
});
