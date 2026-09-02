import {test} from 'node:test';
import assert from 'node:assert/strict';
import {importTs} from './_bundle.mjs';

const {computeSnap, alignRects, distributeRects, SNAP_THRESHOLD} = await importTs('src/editor/alignment.ts');

const rect = (x, y, width = 100, height = 40) => ({x, y, width, height});
const container = {width: 800, height: 600};

test('a widget close to a neighbour edge is pulled onto it', () => {
  const snap = computeSnap(rect(103, 200), [rect(100, 20)], container);
  assert.equal(snap.dx, -3);
  assert.deepEqual(snap.verticals, [100, 150, 200]);
});

test('only the edges that actually line up become guides', () => {
  const snap = computeSnap(rect(103, 200, 60), [rect(100, 20, 100)], container);
  assert.equal(snap.dx, -3);
  assert.deepEqual(snap.verticals, [100]);
});

test('nothing snaps beyond the threshold', () => {
  const snap = computeSnap(rect(100 + SNAP_THRESHOLD + 1, 200), [rect(100, 20)], container);
  assert.equal(snap.dx, 0);
  assert.deepEqual(snap.verticals, []);
});

test('centres snap as well as edges', () => {
  const snap = computeSnap(rect(98, 300), [rect(100, 20)], container);
  assert.equal(snap.dx, 2);
});

test('the container edges and centre are snap targets too', () => {
  assert.equal(computeSnap(rect(3, 300), [], container).dx, -3);
  assert.equal(computeSnap(rect(348, 300), [], container).dx, 2, 'centre at 400');
});

test('the closest of several candidates wins', () => {
  const snap = computeSnap(rect(104, 200), [rect(100, 20), rect(106, 60)], container);
  assert.equal(snap.dx, 2, 'snaps to 106, not to 100');
});

test('aligning left puts every widget on the leftmost edge', () => {
  const result = alignRects([rect(40, 0), rect(10, 50), rect(80, 100)], 'left');
  assert.deepEqual(result.map(r => r.x), [10, 10, 10]);
  assert.deepEqual(result.map(r => r.y), [0, 50, 100], 'the other axis is untouched');
});

test('aligning right lines the right edges up, respecting the widths', () => {
  const result = alignRects([rect(0, 0, 100), rect(0, 50, 60)], 'right');
  assert.deepEqual(result.map(r => r.x), [0, 40]);
});

test('aligning on the vertical centre uses the bounding box', () => {
  const result = alignRects([rect(0, 0, 100, 40), rect(0, 100, 100, 20)], 'centerY');
  assert.deepEqual(result.map(r => r.y), [40, 50]);
});

test('a single widget is left alone', () => {
  assert.deepEqual(alignRects([rect(7, 9)], 'left'), [{x: 7, y: 9}]);
});

test('distributing equalises the gaps and keeps the outer two in place', () => {
  const result = distributeRects([rect(0, 0, 100), rect(120, 0, 100), rect(400, 0, 100)], 'x');
  assert.equal(result[0].x, 0);
  assert.equal(result[2].x, 400);
  assert.equal(result[1].x, 200);
});

test('distributing works on rects given out of order', () => {
  const result = distributeRects([rect(400, 0, 100), rect(0, 0, 100), rect(120, 0, 100)], 'x');
  assert.equal(result[1].x, 0);
  assert.equal(result[2].x, 200);
  assert.equal(result[0].x, 400);
});

test('fewer than three widgets cannot be distributed', () => {
  const rects = [rect(0, 0), rect(50, 0)];
  assert.deepEqual(distributeRects(rects, 'x'), rects.map(r => ({x: r.x, y: r.y})));
});
