import {test} from 'node:test';
import assert from 'node:assert/strict';
import {importTs} from './_bundle.mjs';

const catalog = await importTs('src/model/catalog/index.ts');

const SCOUT_DEFAULTS = {
  GroupBox: {'gridDataHints.w': 0, 'gridDataHints.h': 1, 'gridDataHints.useUiHeight': true, gridColumnCount: -1},
  TabBox: {'gridDataHints.w': 0, 'gridDataHints.useUiHeight': true},
  TabItem: {gridColumnCount: -1},
  SplitBox: {'gridDataHints.w': 0, 'gridDataHints.useUiHeight': true},
  Button: {'gridDataHints.fillHorizontal': false},
  FileChooserButton: {'gridDataHints.fillHorizontal': false},
  RadioButtonGroup: {'gridDataHints.weightY': 0, gridColumnCount: -1},
  TableField: {'gridDataHints.h': 3, 'gridDataHints.weightY': 1},
  TreeField: {'gridDataHints.h': 3, 'gridDataHints.weightY': 1},
  ListBox: {'gridDataHints.h': 2, 'gridDataHints.weightY': 1},
  TreeBox: {'gridDataHints.h': 2, 'gridDataHints.weightY': 1},
  TileField: {'gridDataHints.h': 3},
  PlannerField: {'gridDataHints.h': 6},
  CalendarField: {'gridDataHints.h': 9, 'gridDataHints.weightY': 1},
  WrappedFormField: {'gridDataHints.weightY': 1, 'gridDataHints.useUiHeight': true},
  WizardProgressField: {'gridDataHints.w': 2, 'gridDataHints.useUiHeight': true, 'gridDataHints.weightY': 0}
};

for (const [objectType, expected] of Object.entries(SCOUT_DEFAULTS)) {
  test(`${objectType} carries the layout defaults of its Scout class`, () => {
    const def = catalog.getWidget(objectType);
    assert.ok(def, `${objectType} is missing from the catalog`);
    for (const [name, value] of Object.entries(expected)) {
      assert.equal(def.defaults[name], value, `${objectType}.${name}`);
    }
  });
}

test('a widget that persists a grid height persists the Scout one', () => {
  for (const [objectType, expected] of Object.entries(SCOUT_DEFAULTS)) {
    const def = catalog.getWidget(objectType);
    const height = expected['gridDataHints.h'];
    if (height === undefined || height <= 1) continue;
    assert.equal(def.defaultGridH, height, objectType);
  }
});

test('the base form field defaults match AbstractFormField', () => {
  const stringField = catalog.getWidget('StringField');
  assert.equal(stringField.defaults['gridDataHints.w'], 1);
  assert.equal(stringField.defaults['gridDataHints.h'], 1);
  assert.equal(stringField.defaults['gridDataHints.weightX'], -1);
  assert.equal(stringField.defaults['gridDataHints.weightY'], -1);
  assert.equal(stringField.defaults['gridDataHints.fillHorizontal'], true);
  assert.equal(stringField.defaults['gridDataHints.fillVertical'], true);
  assert.equal(stringField.defaults['gridDataHints.useUiWidth'], false);
  assert.equal(stringField.defaults['gridDataHints.useUiHeight'], false);
});
