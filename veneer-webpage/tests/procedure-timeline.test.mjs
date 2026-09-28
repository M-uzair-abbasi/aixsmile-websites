import assert from 'node:assert/strict';
import { test } from 'node:test';
import { STEP_COUNT, VENEER_TEETH, sampleProcedure, stepAt, stepAnchor, stepProgress, cameraAt } from '../js/procedure-timeline.js';

const all = (arr, fn) => arr.every(fn);

test('the story starts untouched and ends with every veneer bonded', () => {
  const start = sampleProcedure(0);
  assert.equal(start.step, 0);
  assert.ok(all(start.prep, (v) => v === 0));
  assert.equal(start.shellShow, 0);
  assert.equal(start.scan.opacity, 0);

  const end = sampleProcedure(1);
  assert.equal(end.step, STEP_COUNT - 1);
  assert.ok(all(end.prep, (v) => v === 1));
  assert.ok(all(end.seat, (v) => v === 1));
  assert.ok(all(end.bonded, (v) => v === 1));
  assert.ok(all(end.glow, (v) => v < 1e-9));
  assert.equal(end.scan.opacity, 0);
  assert.equal(end.result, 1);
});

test('every value stays in 0..1 and never runs backwards while scrolling forward', () => {
  let prev = sampleProcedure(0);
  for (let i = 1; i <= 2000; i++) {
    const s = sampleProcedure(i / 2000);
    for (const key of ['prep', 'seat', 'bonded']) {
      s[key].forEach((v, t) => {
        assert.ok(v >= 0 && v <= 1, `${key}[${t}] out of range at ${i}`);
        assert.ok(v >= prev[key][t] - 1e-12, `${key}[${t}] went backwards at ${i}`);
      });
    }
    assert.ok(s.step >= prev.step);
    prev = s;
  }
});

test('each step does its own work: prep, then scan, then shells, then light', () => {
  const at = (k, local) => sampleProcedure(stepProgress(k, local));
  assert.ok(all(at(1, 0.9).prep, (v) => v === 1), 'preparation done by the end of step 2');
  assert.equal(at(1, 0.9).shellShow, 0, 'no shells during preparation');
  assert.ok(at(2, 0.5).scan.opacity > 0.9, 'scan grid visible mid step 3');
  assert.equal(at(3, 0.1).scan.opacity, 0, 'scan grid gone by the try-in');
  assert.ok(all(at(3, 0.9).seat, (v) => v === 1), 'all shells seated by the end of step 4');
  assert.ok(all(at(3, 0.9).bonded, (v) => v === 0), 'nothing bonded before step 5');
  assert.ok(all(at(4, 0.9).bonded, (v) => v === 1), 'all bonded by the end of step 5');
});

test('centrals are seated first, canines last', () => {
  const firstMove = {};
  for (let i = 0; i <= 4000; i++) {
    const s = sampleProcedure(i / 4000);
    VENEER_TEETH.forEach((id, t) => { if (firstMove[id] == null && s.seat[t] > 0) firstMove[id] = i; });
  }
  const order = ['11', '21', '12', '22', '13', '23'].map((id) => firstMove[id]);
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  assert.ok(order[0] < order[5]);
});

test('a step dot lands inside its own step, after its action', () => {
  for (let k = 0; k < STEP_COUNT; k++) {
    assert.equal(stepAt(stepAnchor(k)), k);
  }
});

test('the camera starts wide, goes close for the work and ends framed on the smile', () => {
  assert.equal(cameraAt(0).close, 0);
  assert.equal(cameraAt(0.4).close, 1);
  assert.ok(cameraAt(0.6).az > 10, 'turned to the side during the try-in');
  assert.ok(cameraAt(1).zoom < 0.9, 'closer in on the finished smile');
});

test('the preparation gets more scroll than any other step', () => {
  const len = (k) => stepProgress(k + 1, 0) - stepProgress(k, 0);
  for (let k = 0; k < STEP_COUNT; k++) if (k !== 1) assert.ok(len(1) > len(k) * 1.4);
  assert.equal(stepProgress(STEP_COUNT, 0), 1);
});
