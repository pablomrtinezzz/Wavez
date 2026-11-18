import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isUnknownPagePath, paths } from './routes';

test('known pages are not flagged', () => {
  for (const p of ['/', '/webcams', '/tenerife', '/tenerife/webcams', '/spots/la-cicer', '/en', '/en/lanzarote', '/en/spots/famara']) {
    assert.equal(isUnknownPagePath(p), false, p);
  }
});

test('unknown islands and spots are flagged in both languages', () => {
  for (const p of ['/mallorca', '/mallorca/webcams', '/spots/pipeline', '/en/mallorca', '/en/spots/pipeline', '/en/webcams']) {
    assert.equal(isUnknownPagePath(p), true, p);
  }
});

test('paths without a dynamic match are left to Next.js', () => {
  assert.equal(isUnknownPagePath('/tenerife/foo'), false);
  assert.equal(isUnknownPagePath('/en/tenerife/webcams'), false);
});

test('page paths per language', () => {
  assert.equal(paths.home('en'), '/en');
  assert.equal(paths.island('la-palma', 'en'), '/en/la-palma');
  assert.equal(paths.spot('famara'), '/spots/famara');
  assert.equal(paths.webcams('tenerife'), '/tenerife/webcams');
});
