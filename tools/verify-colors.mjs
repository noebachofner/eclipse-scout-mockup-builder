#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import less from 'less';

const require = createRequire(import.meta.url);

const {build} = await import('vite');
const bundle = await build({
  logLevel: 'silent',
  configFile: false,
  build: {
    write: false,
    lib: {entry: 'src/render/colorSystem.ts', formats: ['es'], fileName: 'cs'},
    minify: false
  }
});
const code = bundle[0].output[0].code;
const mod = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));

const css = readFileSync('src/styles/scout-tokens.generated.css', 'utf8');
const lessValues = new Map();
for (const m of css.matchAll(/^\s*--scout-([\w-]+):\s*([^;]+);/gm)) {
  lessValues.set(m[1], m[2].trim());
}

const mine = mod.resolveScoutColors();
let checked = 0;
const mismatches = [];
for (const [name, value] of Object.entries(mine)) {
  const expected = lessValues.get(name);
  if (expected === undefined) continue;
  checked++;
  if (norm(expected) !== norm(value)) mismatches.push({name, expected, actual: value});
}

function norm(v) {
  return v.trim().toLowerCase().replace(/\s+/g, ' ')
    .replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/, (_, a, b, c) => `#${a}${a}${b}${b}${c}${c}`);
}

if (mismatches.length) {
  console.error(`${mismatches.length}/${checked} color mismatches vs. LESS:`);
  for (const m of mismatches.slice(0, 25)) console.error(`  ${m.name}: less=${m.expected} ts=${m.actual}`);
  process.exit(1);
}
console.log(`OK - ${checked} colors match the LESS-compiled Scout theme exactly.`);
void less;
