import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {importTs} from './_bundle.mjs';

const {placeInGrid, partitionFields} = await importTs('src/render/layout.ts');
const {getWidget} = await importTs('src/model/catalog/index.ts');
const {fixtures} = JSON.parse(readFileSync('tools/test/fixtures/scoutGrid.json', 'utf8'));

const OBJECT_TYPES = {
  AbstractGroupBox: 'GroupBox',
  AbstractStringField: 'StringField',
  AbstractBigDecimalField: 'BigDecimalField',
  AbstractIntegerField: 'IntegerField',
  AbstractDateField: 'DateField',
  AbstractBooleanField: 'CheckBoxField',
  AbstractTableField: 'TableField',
  AbstractTreeField: 'TreeField',
  AbstractListBox: 'ListBox',
  AbstractButton: 'Button',
  AbstractOkButton: 'Button',
  AbstractCancelButton: 'Button',
  AbstractCloseButton: 'Button'
};

function toNode(field) {
  const objectType = OBJECT_TYPES[field.base];
  assert.ok(objectType, `no object type mapped for ${field.base}`);
  return {id: field.name, objectType, properties: field.properties, children: []};
}

const readWithDefaults = (node, name, fallback) => {
  const own = node.properties[name];
  if (own !== undefined) return Number(own);
  const fromCatalog = getWidget(node.objectType)?.defaults[name];
  return fromCatalog === undefined ? fallback : Number(fromCatalog);
};

const readFlagWithDefaults = (node, name, fallback) => {
  const own = node.properties[name];
  if (own !== undefined) return own === true;
  const fromCatalog = getWidget(node.objectType)?.defaults[name];
  return fromCatalog === undefined ? fallback : fromCatalog === true;
};

test('the fixtures were extracted', () => {
  assert.ok(fixtures.length >= 11, `${fixtures.length} fixtures`);
});

for (const fixture of fixtures) {
  test(`${fixture.name} places its fields where Scout does`, () => {
    const {controls} = partitionFields(fixture.fields.map(toNode), readFlagWithDefaults);
    const placement = placeInGrid(controls, fixture.columnCount, readWithDefaults);
    const actual = new Map(placement.cells.map(cell => [cell.node.id, cell]));

    for (const expected of fixture.expected.cells) {
      const cell = actual.get(expected.field);
      assert.ok(cell, `${expected.field} was not placed`);
      assert.deepEqual(
        {x: cell.x, y: cell.y, w: cell.w, h: cell.h},
        {x: expected.x, y: expected.y, w: expected.w, h: expected.h},
        expected.field
      );
    }
    assert.equal(placement.cells.length, fixture.expected.cells.length, 'placed field count');
    assert.equal(placement.columnCount, fixture.expected.columnCount, 'column count');
    if (fixture.expected.rowCount) {
      assert.equal(placement.rowCount, fixture.expected.rowCount, 'row count');
    }
  });
}
