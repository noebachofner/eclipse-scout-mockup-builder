import {test} from 'node:test';
import assert from 'node:assert/strict';
import {importTs} from './_bundle.mjs';

const {validateDocument} = await importTs('src/model/validate.ts');
const templates = await importTs('src/model/templates.ts');

const find = (findings, pattern) => findings.filter(f => pattern.test(f.message));

test('the default template is clean', () => {
  const findings = validateDocument(templates.defaultDesktopTemplate());
  assert.deepEqual(findings.map(f => `${f.path}: ${f.message}`), []);
});

test('free placement is reported as unreproducible', () => {
  const doc = templates.defaultDesktopTemplate();
  const box = doc.root.children.flatMap(c => c.children).find(c => c.objectType === 'GroupBox');
  box.properties.layoutMode = 'free';
  const findings = validateDocument(doc);
  assert.equal(find(findings, /Free placement/).length, 1);
  assert.equal(find(findings, /Free placement/)[0].severity, 'warning');
});

test('a grid width wider than the parent column count is an error', () => {
  const doc = templates.defaultDesktopTemplate();
  const box = doc.root.children.flatMap(c => c.children).find(c => c.objectType === 'GroupBox');
  box.properties.gridColumnCount = 2;
  box.children[0].properties['gridDataHints.w'] = 4;
  const findings = find(validateDocument(doc), /wider than the 2 columns/);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].severity, 'error');
});

test('an external image URL is an error, a data URI is not', () => {
  const doc = templates.defaultDesktopTemplate();
  doc.root.properties.logoUrl = 'https://example.org/logo.png';
  assert.equal(find(validateDocument(doc), /external server/).length, 1);

  doc.root.properties.logoUrl = 'data:image/png;base64,iVBORw0KGgo=';
  assert.equal(find(validateDocument(doc), /external server/).length, 0);
});

test('an unlabelled visible field is a hint, and silent when the label is off', () => {
  const doc = templates.defaultDesktopTemplate();
  const box = doc.root.children.flatMap(c => c.children).find(c => c.objectType === 'GroupBox');
  box.children[0].properties.label = '';
  assert.equal(find(validateDocument(doc), /No label/).length, 1);

  box.children[0].properties.labelVisible = false;
  assert.equal(find(validateDocument(doc), /No label/).length, 0);
});

test('the finding carries the node id, so the dialog can select it', () => {
  const doc = templates.defaultDesktopTemplate();
  const box = doc.root.children.flatMap(c => c.children).find(c => c.objectType === 'GroupBox');
  box.properties.layoutMode = 'free';
  assert.equal(find(validateDocument(doc), /Free placement/)[0].nodeId, box.id);
});

test('the path names the widget chain', () => {
  const doc = templates.defaultDesktopTemplate();
  const box = doc.root.children.flatMap(c => c.children).find(c => c.objectType === 'GroupBox');
  box.properties.layoutMode = 'free';
  assert.match(find(validateDocument(doc), /Free placement/)[0].path, /Person › Personal data$/);
});
