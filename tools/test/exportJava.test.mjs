/**
 * The Java generator.
 *
 * The method names asserted here were read off the Scout 26.1 sources; if a
 * future Scout release renames one, these tests are where it should show up.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {importTs} from './_bundle.mjs';

const java = await importTs('src/io/exportJava.ts');
const templates = await importTs('src/model/templates.ts');
const docModule = await importTs('src/model/document.ts');

const OPTIONS = {detail: 'changed', packageName: 'org.example.client', className: 'PersonForm', useTexts: false, includeGetters: true};
const generate = (form, options = {}) => java.generateFormJava(form, {...OPTIONS, ...options});

const personForm = () => java.collectForms(templates.defaultDesktopTemplate().root)[0];

test('collectForms finds the forms in a desktop', () => {
  const forms = java.collectForms(templates.defaultDesktopTemplate().root);
  assert.equal(forms.length, 1);
  assert.equal(forms[0].properties.title, 'Person');
});

test('the class name is derived from the form title', () => {
  assert.equal(java.suggestClassName(personForm()), 'PersonForm');
});

test('the generated file has a package, imports and the form class', () => {
  const {code} = generate(personForm());
  assert.match(code, /^package org\.example\.client;/);
  assert.match(code, /import org\.eclipse\.scout\.rt\.client\.ui\.form\.AbstractForm;/);
  assert.match(code, /import org\.eclipse\.scout\.rt\.platform\.Order;/);
  assert.match(code, /public class PersonForm extends AbstractForm \{/);
  assert.match(code, /public class MainBox extends AbstractGroupBox \{/);
});

test('imports are sorted and free of duplicates', () => {
  const {code} = generate(personForm());
  const imports = code.split('\n').filter(line => line.startsWith('import '));
  assert.deepEqual(imports, [...new Set(imports)], 'duplicate import');
  assert.deepEqual(imports, [...imports].sort(), 'imports are not sorted');
});

test('the form title becomes getConfiguredTitle', () => {
  const {code} = generate(personForm());
  assert.match(code, /protected String getConfiguredTitle\(\) \{\s*return "Person";/);
});

test('a mandatory field emits getConfiguredMandatory', () => {
  const {code} = generate(personForm());
  assert.match(code, /public class FirstNameField extends AbstractStringField \{/);
  assert.match(code, /protected boolean getConfiguredMandatory\(\) \{\s*return true;/);
});

test('grid hints become getConfiguredGridW and getConfiguredGridH', () => {
  const {code} = generate(personForm());
  assert.match(code, /protected int getConfiguredGridW\(\) \{\s*return 2;/);
  assert.match(code, /protected int getConfiguredGridH\(\) \{\s*return 3;/);
});

test('a tab item is a group box, because Scout has no AbstractTabItem', () => {
  const {code} = generate(personForm());
  assert.match(code, /public class TabBox extends AbstractTabBox \{/);
  assert.match(code, /public class OrdersBox extends AbstractGroupBox \{/);
  assert.doesNotMatch(code, /AbstractTabItem/);
});

test('a table field gets a nested Table with typed columns', () => {
  const {code} = generate(personForm());
  assert.match(code, /extends AbstractTableField<TableField\.Table>/);
  assert.match(code, /public class Table extends AbstractTable \{/);
  assert.match(code, /public class OrderNoColumn extends AbstractStringColumn \{/);
  // The column types are inferred from the sample data in the mockup.
  assert.match(code, /public class DateColumn extends AbstractDateColumn \{/);
  assert.match(code, /public class AmountColumn extends AbstractBigDecimalColumn \{/);
  assert.match(code, /return getColumnSet\(\)\.getColumnByClass\(OrderNoColumn\.class\);/);
});

test('table menus land inside the nested table class', () => {
  const {code} = generate(personForm());
  const tableStart = code.indexOf('public class Table extends AbstractTable');
  const newMenu = code.indexOf('public class NewMenu extends AbstractMenu');
  assert.ok(tableStart > 0 && newMenu > tableStart, 'the menu is not inside the table');
  assert.match(code, /protected String getConfiguredText\(\) \{\s*return "New";/);
});

test('a widget without a Java class becomes a TODO plus a warning', () => {
  const {code, warnings} = generate(personForm());
  assert.match(code, /\/\/ TODO Chart field: AbstractChartField lives in the separate scout\.rt\.chart module\./);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /Chart field/);
});

test('getters are emitted for every field and can be turned off', () => {
  assert.match(generate(personForm()).code, /public FirstNameField getFirstNameField\(\) \{\s*return getFieldByClass\(FirstNameField\.class\);/);
  assert.doesNotMatch(generate(personForm(), {includeGetters: false}).code, /getFieldByClass/);
});

test('TEXTS.get is used when asked for, with a key derived from the label', () => {
  const {code} = generate(personForm(), {useTexts: true});
  assert.match(code, /import org\.eclipse\.scout\.rt\.platform\.text\.TEXTS;/);
  assert.match(code, /return TEXTS\.get\("FirstName"\);/);
});

test('an empty package name writes no package statement', () => {
  const {code} = generate(personForm(), {packageName: ''});
  assert.doesNotMatch(code, /^package/m);
});

test('strings are escaped', () => {
  const form = personForm();
  form.properties.title = 'He said "hi"\\done';
  assert.match(generate(form).code, /return "He said \\"hi\\"\\\\done";/);
});

test('a dialog emits the display hint constant, not a boolean', () => {
  const form = personForm();
  form.properties.displayHint = 'dialog';
  const {code} = generate(form);
  assert.match(code, /protected int getConfiguredDisplayHint\(\) \{\s*return IForm\.DISPLAY_HINT_DIALOG;/);
  assert.doesNotMatch(code, /getConfiguredModal\b/);
});

test('a modeless dialog uses the modality hint', () => {
  const form = personForm();
  form.properties.displayHint = 'dialog';
  form.properties.modal = false;
  assert.match(generate(form).code, /protected int getConfiguredModalityHint\(\) \{\s*return IForm\.MODALITY_HINT_MODELESS;/);
});

test('braces balance out, so the file is at least syntactically plausible', () => {
  const {code} = generate(personForm());
  const open = (code.match(/\{/g) ?? []).length;
  const close = (code.match(/\}/g) ?? []).length;
  assert.equal(open, close);
});

test('two fields with the same label get distinct class names', () => {
  // getFieldByClass resolves by class, so two `NameField` classes would produce
  // two identical getters on the form and fail to compile.
  const doc = docModule.node({objectType: 'Form', properties: {title: 'Order'}, children: [
    {objectType: 'GroupBox', slot: 'fields', properties: {label: 'Billing'}, children: [
      {objectType: 'StringField', slot: 'fields', properties: {label: 'Name'}}
    ]},
    {objectType: 'GroupBox', slot: 'fields', properties: {label: 'Shipping'}, children: [
      {objectType: 'StringField', slot: 'fields', properties: {label: 'Name'}}
    ]}
  ]});
  const {code} = generate(doc, {className: 'OrderForm'});
  const getters = [...code.matchAll(/^  public \w+ (get\w+)\(\)/gm)].map(match => match[1]);
  assert.deepEqual(getters, [...new Set(getters)], `duplicate getter: ${getters.join(', ')}`);
  // The collision is resolved by qualifying with the enclosing box.
  assert.match(code, /public class ShippingNameField extends AbstractStringField/);
});

test('a column name cannot collide with a field name', () => {
  const doc = docModule.node({objectType: 'Form', properties: {title: 'Order'}, children: [
    {objectType: 'GroupBox', slot: 'fields', properties: {label: 'Main'}, children: [
      {objectType: 'StringField', slot: 'fields', properties: {label: 'Status'}},
      {objectType: 'TableField', slot: 'fields', properties: {label: 'Rows', columns: 'Status|left|100', rows: 'Open'}}
    ]}
  ]});
  const {code} = generate(doc, {className: 'OrderForm'});
  const classes = [...code.matchAll(/public class (\w+) extends/g)].map(match => match[1]);
  assert.deepEqual(classes, [...new Set(classes)], `duplicate class: ${classes.join(', ')}`);
});

test('layout detail writes the logical grid of every field', () => {
  const {code} = generate(personForm(), {detail: 'layout'});
  const firstName = code.slice(code.indexOf('class FirstNameField'), code.indexOf('class LastNameField'));
  // These are all still the Scout defaults; layout detail writes them anyway so
  // the layout is visible in the code rather than implied.
  assert.match(firstName, /protected int getConfiguredGridW\(\) \{\s*return 1;/);
  assert.match(firstName, /protected int getConfiguredGridH\(\) \{\s*return 1;/);
  assert.match(firstName, /protected double getConfiguredGridWeightX\(\) \{\s*return -1\.0;/);
  assert.match(firstName, /protected boolean getConfiguredFillHorizontal\(\) \{\s*return true;/);
});

test('changed detail leaves the defaults out', () => {
  const {code} = generate(personForm(), {detail: 'changed'});
  const firstName = code.slice(code.indexOf('class FirstNameField'), code.indexOf('class LastNameField'));
  assert.doesNotMatch(firstName, /getConfiguredGridW\b/);
  assert.match(firstName, /getConfiguredMandatory/);
});

test('all detail adds the non-layout defaults too', () => {
  const {code} = generate(personForm(), {detail: 'all'});
  const firstName = code.slice(code.indexOf('class FirstNameField'), code.indexOf('class LastNameField'));
  assert.match(firstName, /getConfiguredStatusVisible/);
  assert.match(firstName, /getConfiguredFieldStyle/);
  assert.match(firstName, /getConfiguredGridW/);
});

test('every detail level still produces balanced braces', () => {
  for (const detail of ['changed', 'layout', 'all']) {
    const {code} = generate(personForm(), {detail});
    assert.equal((code.match(/\{/g) ?? []).length, (code.match(/\}/g) ?? []).length, detail);
  }
});
