import assert from 'node:assert/strict';
import { test } from 'node:test';
import './site-esm.mjs';

const {
  STEP_COUNT, SHADES, sampleBleach, stepAt, stepAnchor, stepProgress, shadeCode, swatchAt, tintAt,
} = await import('../js/bleach-timeline.js');

const at = (k, local) => sampleBleach(stepProgress(k, local));

test('starts yellow and untouched, ends white and clean, facing front both times', () => {
  const s = sampleBleach(0);
  assert.equal(s.step, 0);
  assert.equal(s.shade, 0);
  assert.equal(s.shadeCode, 'A3.5');
  assert.equal(s.barrier, 0);
  assert.equal(s.gel, 0);
  assert.equal(s.camera.az, 0);
  const e = sampleBleach(1);
  assert.equal(e.step, STEP_COUNT - 1);
  assert.equal(e.shade, 1);
  assert.equal(e.shadeCode, 'BL4');
  assert.equal(e.barrier, 0);
  assert.equal(e.gel, 0);
  assert.equal(e.camera.az, 0);
});

test('each step does its own work', () => {
  assert.ok(at(1, 0.9).barrier > 0.99, 'barrier on by the end of step 2');
  assert.equal(at(1, 0.9).gel, 0, 'no gel yet in step 2');
  assert.ok(at(2, 0.9).gel > 0.99, 'gel on by the end of step 3');
  assert.equal(at(2, 0.9).shade, 0, 'no lightening before the gel works');
  const working = at(3, 0.9);
  assert.equal(working.shadeCode, 'B1');
  assert.ok(working.gel > 0.99 && working.barrier > 0.99, 'gel and barrier stay on while it works');
  const done = at(4, 0.7);
  assert.equal(done.shadeCode, 'BL4');
  assert.equal(done.gel, 0);
  assert.equal(done.barrier, 0);
});

test('values stay in range; step and shade never run backwards', () => {
  let prev = sampleBleach(0);
  for (let i = 1; i <= 2000; i++) {
    const s = sampleBleach(i / 2000);
    for (const k of ['shade', 'barrier', 'gel']) assert.ok(s[k] >= 0 && s[k] <= 1, `${k} out of range at ${i}`);
    assert.ok(s.step >= prev.step, `step went back at ${i}`);
    assert.ok(s.shade >= prev.shade - 1e-12, `shade went back at ${i}`);
    prev = s;
  }
});

test('the readout walks the scale in order', () => {
  const seen = [];
  for (let i = 0; i <= 2000; i++) {
    const c = sampleBleach(i / 2000).shadeCode;
    if (seen.at(-1) !== c) seen.push(c);
  }
  assert.deepEqual(seen, SHADES);
});

test('each dot lands inside its own step, in order', () => {
  assert.equal(stepAnchor(0), 0);
  let last = -1;
  for (let k = 0; k < STEP_COUNT; k++) {
    const p = stepAnchor(k);
    assert.equal(stepAt(p), k, `anchor ${k} is in step ${stepAt(p)}`);
    assert.ok(p > last);
    last = p;
  }
});

test('out-of-range and broken input is clamped, never NaN', () => {
  assert.deepEqual(sampleBleach(-1), sampleBleach(0));
  assert.deepEqual(sampleBleach(2), sampleBleach(1));
  assert.deepEqual(sampleBleach(NaN), sampleBleach(0));
  assert.deepEqual(sampleBleach(0.37), sampleBleach(0.37), 'pure: same input, same output');
});

test('swatches and tints interpolate between their stops', () => {
  assert.equal(swatchAt(0), 'rgb(214 187 134)');
  assert.equal(swatchAt(1), 'rgb(247 244 236)');
  const out = [0, 0, 0];
  assert.equal(tintAt(1, out), out, 'writes into the array it is given');
  [1.05, 1.08, 1.17].forEach((v, k) => assert.ok(Math.abs(out[k] - v) < 1e-12));
  assert.equal(shadeCode(0.5), 'A1');
});
