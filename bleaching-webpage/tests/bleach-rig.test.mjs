import assert from 'node:assert/strict';
import { test } from 'node:test';
import './site-esm.mjs';

const { gumDistances } = await import('../js/src/bleach-rig.js');

test('gumDistances finds the nearest crown point and caps the rest', () => {
  const gum = new Float32Array([0, 0, 0, 10, 0, 0, 0, 5, 0]);
  const crowns = [new Float32Array([1, 0, 0, 0, 0, 2]), new Float32Array([0, 4, 0])];
  assert.deepEqual([...gumDistances(gum, crowns, 3)].map((d) => +d.toFixed(4)), [1, 3, 1]);
});

test('gumDistances looks across cell borders and below zero', () => {
  const d = gumDistances(new Float32Array([-0.1, -0.1, -0.1]), [new Float32Array([0.1, 0.1, 0.1])], 2.6);
  assert.ok(Math.abs(d[0] - Math.sqrt(0.12)) < 1e-6, String(d[0]));
});

test('gumDistances with no crowns returns the cap everywhere', () => {
  assert.deepEqual([...gumDistances(new Float32Array([5, 5, 5, -5, 0, 1]), [], 2.6)].map((d) => +d.toFixed(4)), [2.6, 2.6]);
});
