import { test } from 'node:test';
import assert from 'node:assert/strict';
import { breadcrumbList, itemList, jsonLdScript } from './jsonLd';

test('jsonLdScript escapes "<" so a value cannot close the script tag', () => {
  assert.equal(jsonLdScript({ name: '</script><b>' }).includes('<'), false);
});

test('breadcrumbList numbers the trail and builds absolute URLs', () => {
  const list = breadcrumbList('https://x.test', [
    { name: 'Canarias', path: '/' },
    { name: 'Tenerife', path: '/tenerife' },
  ]);
  assert.deepEqual(
    list.itemListElement.map((i) => [i.position, i.item]),
    [
      [1, 'https://x.test'],
      [2, 'https://x.test/tenerife'],
    ]
  );
});

test('itemList counts its items', () => {
  const list = itemList('https://x.test', 'Spots', [{ name: 'Famara', path: '/spots/famara' }]);
  assert.equal(list.numberOfItems, 1);
  assert.equal(list.itemListElement[0].url, 'https://x.test/spots/famara');
});
