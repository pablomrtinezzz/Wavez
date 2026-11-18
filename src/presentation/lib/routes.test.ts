import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isUnknownPagePath, paths } from './routes';

test('known pages are not flagged', () => {
  for (const p of ['/', '/webcams', '/tenerife', '/tenerife/webcams', '/spots/la-cicer']) {
    assert.equal(isUnknownPagePath(p), false, p);
  }
});

test('unknown islands and spots are flagged', () => {
  for (const p of ['/mallorca', '/mallorca/webcams', '/spots/pipeline']) {
    assert.equal(isUnknownPagePath(p), true, p);
  }
});

test('paths without a dynamic match are left to Next.js', () => {
  assert.equal(isUnknownPagePath('/tenerife/foo'), false);
});

test('page paths', () => {
  assert.equal(paths.island('la-palma'), '/la-palma');
  assert.equal(paths.spot('famara'), '/spots/famara');
  assert.equal(paths.webcams('tenerife'), '/tenerife/webcams');
});
