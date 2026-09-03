#!/usr/bin/env node
import {readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';

const sourceDir = resolve(process.argv[2] ?? '.scout/scout.rt/org.eclipse.scout.rt.client.test/src/test/java/org/eclipse/scout/rt/client/ui/form/fields/groupbox/internal');
const outFile = resolve(process.argv[3] ?? 'tools/test/fixtures/scoutGrid.json');

const HINTS = {
  getConfiguredGridW: 'gridDataHints.w',
  getConfiguredGridH: 'gridDataHints.h',
  getConfiguredGridX: 'gridDataHints.x',
  getConfiguredGridY: 'gridDataHints.y',
  getConfiguredGridWeightX: 'gridDataHints.weightX',
  getConfiguredGridWeightY: 'gridDataHints.weightY',
  getConfiguredGridUseUiHeight: 'gridDataHints.useUiHeight'
};

function bodyOf(source, start) {
  let depth = 1;
  let index = start;
  while (index < source.length && depth > 0) {
    if (source[index] === '{') depth++;
    else if (source[index] === '}') depth--;
    index++;
  }
  return {body: source.slice(start, index), end: index};
}

function withoutNestedClasses(body) {
  let stripped = body;
  let match;
  while ((match = /(?:public|protected|private)?\s*class \w+ extends [\w.<>, ]+\{/.exec(stripped))) {
    const start = match.index + match[0].length;
    stripped = stripped.slice(0, match.index) + stripped.slice(bodyOf(stripped, start).end);
  }
  return stripped;
}

function parseFields(source) {
  const fields = [];
  const consumed = [];
  const classPattern = /@Order\((\d+)\)\s*\n\s*public class (\w+) extends (\w+) \{/g;
  for (const match of source.matchAll(classPattern)) {
    const [, order, name, base] = match;
    if (consumed.some(range => match.index > range.start && match.index < range.end)) continue;
    const start = match.index + match[0].length;
    const {body, end} = bodyOf(source, start);
    consumed.push({start, end});

    const own = withoutNestedClasses(body);
    const properties = {};
    for (const [method, property] of Object.entries(HINTS)) {
      const found = own.match(new RegExp(`${method}\\(\\)\\s*\\{\\s*return ([^;]+);`));
      if (!found) continue;
      const raw = found[1].trim();
      properties[property] = raw === 'true' ? true : raw === 'false' ? false : Number(raw);
    }
    fields.push({name, base, order: Number(order), properties});
  }
  return fields.sort((a, b) => a.order - b.order);
}

function parseExpectations(source) {
  const method = source.match(/public void testHorizontalLayout\(\)[\s\S]*?\n  \}/);
  if (!method) return null;
  const body = method[0];

  const columnCount = Number(body.match(/assertEquals\((\d+), grid\.getGridColumnCount\(\)\)/)?.[1] ?? 2);
  const rowCount = Number(body.match(/assertEquals\((\d+), grid\.getGridRowCount\(\)\)/)?.[1] ?? 0);

  const cells = [];
  const pattern = /assertGridData\((-?\d+), (-?\d+), (-?\d+), (-?\d+),[\s\S]*?getFieldByClass\(([\w.]+)\.class\)/g;
  for (const match of body.matchAll(pattern)) {
    const qualified = match[5];
    cells.push({
      field: qualified.slice(qualified.lastIndexOf('.') + 1),
      x: Number(match[1]),
      y: Number(match[2]),
      w: Number(match[3]),
      h: Number(match[4])
    });
  }
  return cells.length ? {columnCount, rowCount, cells} : null;
}

const fixtures = [];
const skipped = [];
for (const file of readdirSync(sourceDir).filter(name => /^GroupBoxLayout.*Test\.java$/.test(name)).sort()) {
  const source = readFileSync(join(sourceDir, file), 'utf8');
  const expected = parseExpectations(source);
  if (!expected) {
    skipped.push(`${file}: no horizontal layout test`);
    continue;
  }
  const fields = parseFields(source);
  const known = new Set(fields.map(field => field.name));
  const missing = expected.cells.filter(cell => !known.has(cell.field));
  if (missing.length) {
    skipped.push(`${file}: fields not parsed (${missing.map(cell => cell.field).join(', ')})`);
    continue;
  }
  const columnCount = Number(source.match(/getConfiguredGridColumnCount\(\)\s*\{\s*return (\d+);/)?.[1] ?? expected.columnCount);
  fixtures.push({name: file.replace('.java', ''), columnCount, fields, expected});
}

writeFileSync(outFile, JSON.stringify({
  source: 'org.eclipse.scout.rt.client.test, HorizontalGroupBoxBodyGrid tests (EPL-2.0)',
  fixtures
}, null, 2) + '\n');

console.log(`wrote ${fixtures.length} fixture(s) to ${outFile}`);
skipped.forEach(reason => console.log(`skipped ${reason}`));
