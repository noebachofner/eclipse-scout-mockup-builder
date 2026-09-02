import {test} from 'node:test';
import assert from 'node:assert/strict';
import {importTs} from './_bundle.mjs';

const doc = await importTs('src/model/document.ts');
const templates = await importTs('src/model/templates.ts');

test('a document survives a serialize/parse round trip', () => {
  const original = templates.defaultDesktopTemplate();
  const restored = doc.parseDocument(doc.serializeDocument(original));
  assert.equal(restored.root.objectType, original.root.objectType);
  assert.equal(countNodes(restored.root), countNodes(original.root));
  assert.deepEqual(restored.canvas, original.canvas);
  assert.equal(restored.meta.name, original.meta.name);
});

test('node ids are preserved, so selection and annotations stay valid', () => {
  const original = templates.defaultDesktopTemplate();
  const restored = doc.parseDocument(doc.serializeDocument(original));
  assert.equal(restored.root.id, original.root.id);
});

test('annotations survive a round trip', () => {
  const original = templates.defaultDesktopTemplate();
  original.annotations.push({id: 'a1', x: 10, y: 20, text: 'Look here'});
  const restored = doc.parseDocument(doc.serializeDocument(original));
  assert.deepEqual(restored.annotations, [{id: 'a1', x: 10, y: 20, text: 'Look here'}]);
});

test('a foreign JSON file is rejected with a readable message', () => {
  assert.throws(
    () => doc.parseDocument('{"hello": "world"}'),
    error => error instanceof doc.DocumentFormatError && /Not an ES Mockup file/.test(error.message)
  );
});

test('malformed JSON is rejected', () => {
  assert.throws(() => doc.parseDocument('{oops'), doc.DocumentFormatError);
});

test('a file from a newer format version is rejected rather than mis-rendered', () => {
  const future = JSON.stringify({format: 'es-mockup', formatVersion: 99, root: {objectType: 'Desktop'}});
  assert.throws(
    () => doc.parseDocument(future),
    error => /newer version/.test(error.message)
  );
});

test('a document without a root is rejected', () => {
  assert.throws(
    () => doc.parseDocument(JSON.stringify({format: 'es-mockup', formatVersion: 1})),
    /no root widget/
  );
});

test('an unknown widget type survives a round trip instead of being dropped', () => {
  const original = templates.defaultDesktopTemplate();
  original.root.children.push({id: 'x1', objectType: 'FutureWidget', properties: {label: 'From a newer build'}, children: []});
  const restored = doc.parseDocument(doc.serializeDocument(original));
  const kept = restored.root.children.find(child => child.objectType === 'FutureWidget');
  assert.ok(kept, 'the unknown widget was dropped');
  assert.equal(kept.properties.label, 'From a newer build');
});

test('every template produces a parseable document', () => {
  for (const template of templates.TEMPLATES) {
    const created = template.create();
    const restored = doc.parseDocument(doc.serializeDocument(created));
    assert.equal(countNodes(restored.root), countNodes(created.root), template.id);
  }
});

function countNodes(node) {
  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
}

test('tabular properties survive a round trip as arrays', () => {
  const original = templates.defaultDesktopTemplate();
  const table = findByType(original.root, 'TableField');
  table.properties.rows = [['A|B', 'plain'], ['second', 'row']];
  const restored = doc.parseDocument(doc.serializeDocument(original));
  assert.deepEqual(findByType(restored.root, 'TableField').properties.rows, [['A|B', 'plain'], ['second', 'row']]);
});

function findByType(node, objectType) {
  if (node.objectType === objectType) return node;
  for (const child of node.children) {
    const found = findByType(child, objectType);
    if (found) return found;
  }
  return null;
}
