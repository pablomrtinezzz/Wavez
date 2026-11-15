import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { createSessionToken, verifySessionToken, safeEqual } from './session';

describe('session tokens', () => {
  test('accepts a freshly signed token', async () => {
    const token = await createSessionToken();
    assert.ok(token);
    assert.equal(await verifySessionToken(token), true);
  });

  test('rejects the legacy constant cookie value and tampered tokens', async () => {
    const token = (await createSessionToken())!;
    const [expiresAt, signature] = token.split('.');
    assert.equal(await verifySessionToken('authenticated'), false);
    assert.equal(await verifySessionToken(`${Number(expiresAt) + 1000}.${signature}`), false);
    assert.equal(await verifySessionToken(`${expiresAt}.${signature.slice(0, -2)}xx`), false);
  });

  test('rejects expired tokens', async () => {
    const issuedLongAgo = Date.now() - 31 * 24 * 60 * 60 * 1000;
    const token = await createSessionToken(issuedLongAgo);
    assert.equal(await verifySessionToken(token!), false);
  });

  test('safeEqual compares by value', async () => {
    assert.equal(await safeEqual('grancanariasurf', 'grancanariasurf'), true);
    assert.equal(await safeEqual('grancanariasurf', 'grancanaria'), false);
  });
});
