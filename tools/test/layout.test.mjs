import {test} from 'node:test';
import assert from 'node:assert/strict';
import {importTs} from './_bundle.mjs';

const {placeInGrid, gridTemplate} = await importTs('src/render/layout.ts');

const field = (properties = {}) => ({id: Math.random().toString(36).slice(2), objectType: 'StringField', properties, children: []});
const at = (placement, index) => {
  const cell = placement.cells[index];
  return {x: cell.x, y: cell.y, w: cell.w, h: cell.h};
};

test('fields fill the columns left to right and wrap', () => {
  const placement = placeInGrid([field(), field(), field(), field()], 2);
  assert.deepEqual(at(placement, 0), {x: 0, y: 0, w: 1, h: 1});
  assert.deepEqual(at(placement, 1), {x: 1, y: 0, w: 1, h: 1});
  assert.deepEqual(at(placement, 2), {x: 0, y: 1, w: 1, h: 1});
  assert.deepEqual(at(placement, 3), {x: 1, y: 1, w: 1, h: 1});
  assert.equal(placement.rowCount, 2);
});

test('a field wider than the remaining space moves to the next row', () => {
  const placement = placeInGrid([field(), field({'gridDataHints.w': 2})], 2);
  assert.deepEqual(at(placement, 0), {x: 0, y: 0, w: 1, h: 1});
  assert.deepEqual(at(placement, 1), {x: 0, y: 1, w: 2, h: 1});
});

test('a field is clamped to the column count', () => {
  const placement = placeInGrid([field({'gridDataHints.w': 5})], 2);
  assert.equal(placement.cells[0].w, 2);
});

test('a tall field keeps the rows below it free', () => {
  const placement = placeInGrid([field({'gridDataHints.h': 3}), field(), field()], 2);
  assert.deepEqual(at(placement, 0), {x: 0, y: 0, w: 1, h: 3});
  assert.deepEqual(at(placement, 1), {x: 1, y: 0, w: 1, h: 1});
  assert.deepEqual(at(placement, 2), {x: 1, y: 1, w: 1, h: 1});
});

test('explicit x and y pin a field', () => {
  const placement = placeInGrid([field({'gridDataHints.x': 1, 'gridDataHints.y': 3})], 2);
  assert.deepEqual(at(placement, 0), {x: 1, y: 3, w: 1, h: 1});
});

test('weightX defaults to max(1, w)', () => {
  const placement = placeInGrid([field(), field({'gridDataHints.w': 2})], 2);
  assert.equal(placement.cells[0].weightX, 1);
  assert.equal(placement.cells[1].weightX, 2);
});

test('weightY defaults to h when the field spans rows, and to 0 otherwise', () => {
  const placement = placeInGrid([field(), field({'gridDataHints.h': 3})], 2);
  assert.equal(placement.cells[0].weightY, 0);
  assert.equal(placement.cells[1].weightY, 3);
});

test('an explicit weight overrides the inherited one', () => {
  const placement = placeInGrid([field({'gridDataHints.weightY': 0.5, 'gridDataHints.h': 4})], 1);
  assert.equal(placement.cells[0].weightY, 0.5);
});

test('a row with no growing field is sized to its content', () => {
  const template = gridTemplate(placeInGrid([field(), field()], 2), '30px');
  assert.equal(template.rows, 'minmax(auto, max-content)');
  assert.equal(template.stretchRows, false);
});

test('a row with a growing field absorbs the extra height', () => {
  const template = gridTemplate(placeInGrid([field({'gridDataHints.h': 2})], 1), '30px');
  assert.equal(template.rows, 'auto auto');
  assert.equal(template.stretchRows, true);
});

test('columns without weight are sized to their content', () => {
  const template = gridTemplate(placeInGrid([field()], 2), '30px');
  assert.equal(template.columns, 'minmax(0, 1fr) max-content');
});

test('a spanning field spreads its weight over the columns it covers', () => {
  const template = gridTemplate(placeInGrid([field({'gridDataHints.w': 2})], 2), '30px');
  assert.equal(template.columns, 'minmax(0, 1fr) minmax(0, 1fr)');
});
