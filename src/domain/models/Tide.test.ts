import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { describeTide } from './Tide';

// Real Open-Meteo sea level for La Cícer on 2026-11-15 (00:00 to 23:00)
const series = [
  -0.37, -0.1, 0.16, 0.33, 0.39, 0.31, 0.12, -0.14, -0.41, -0.62, -0.72, -0.69,
  -0.56, -0.36, -0.14, 0.03, 0.12, 0.1, -0.01, -0.2, -0.41, -0.58, -0.67, -0.66,
];

describe('describeTide', () => {
  test('detects high water around 04:00', () => {
    const tide = describeTide(series, 4);
    assert.equal(tide?.phase, 'high');
    assert.equal(tide?.trend, 'slack');
  });

  test('detects falling mid tide at 07:00', () => {
    const tide = describeTide(series, 7);
    assert.equal(tide?.phase, 'mid');
    assert.equal(tide?.trend, 'falling');
  });

  test('detects low water around 10:00 and rising tide at 13:00', () => {
    assert.equal(describeTide(series, 10)?.phase, 'low');
    assert.equal(describeTide(series, 13)?.trend, 'rising');
  });

  test('returns undefined when there is no sea level value', () => {
    assert.equal(describeTide([undefined, 0.2], 0), undefined);
  });
});
