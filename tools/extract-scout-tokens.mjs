#!/usr/bin/env node
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {join, resolve} from 'node:path';
import less from 'less';

const pkgDir = resolve(process.argv[2] ?? 'scout/package');
const outFile = resolve(process.argv[3] ?? 'src/styles/scout-tokens.generated.css');
const styleDir = join(pkgDir, 'src', 'style');

const SOURCES = ['colors.less', 'sizes.less', 'fonts.less'];

const SKIP = /^(font-face|scout)$/;

function collectVariableNames(file) {
  const text = readFileSync(join(styleDir, file), 'utf8');
  const names = [];
  const re = /^@([a-zA-Z][\w-]*)\s*:\s*([^;]*);/gm;
  let m;
  while ((m = re.exec(text)) !== null) {
    const name = m[1];
    const value = m[2].trim();
    if (SKIP.test(name)) continue;
    if (value.startsWith('~')) continue;
    if (!names.includes(name)) names.push(name);
  }
  return names;
}

const names = SOURCES.flatMap(collectVariableNames);

const imports = ['colors.less', 'sizes.less', 'fonts.less']
  .map(f => `@import (reference) "${join(styleDir, f).replace(/\\/g, '/')}";`)
  .join('\n');

if (!existsSync(styleDir)) {
  console.error(`Scout style dir not found: ${styleDir}`);
  console.error('Run:  npm run scout:fetch');
  process.exit(1);
}

async function compile(varNames) {
  const body = varNames.map(n => `  --scout-${n}: @${n};`).join('\n');
  return less.render(`${imports}\n:root {\n${body}\n}`, {
    filename: join(styleDir, 'es-mockup-tokens.less'),
    math: 'always'
  });
}

let current = [...names];
const dropped = [];
for (let attempt = 0; attempt < 200; attempt++) {
  try {
    const out = await compile(current);
    const header = [
      '/*',
      ' * Eclipse Scout design tokens - GENERATED FILE, DO NOT EDIT.',
      ' *',
      ` * Extracted from @eclipse-scout/core (${readFileSync(join(pkgDir, 'package.json'), 'utf8').match(/"version":\s*"([^"]+)"/)[1]})`,
      ' * by tools/extract-scout-tokens.mjs. The upstream sources are licensed',
      ' * under EPL-2.0 - see THIRD-PARTY-NOTICES.md.',
      ` * ${current.length} tokens.`,
      ' */',
      ''
    ].join('\n');
    writeFileSync(outFile, header + out.css.trim() + '\n');
    console.log(`Wrote ${current.length} tokens to ${outFile}` + (dropped.length ? ` (skipped ${dropped.length}: ${dropped.join(', ')})` : ''));
    process.exit(0);
  } catch (e) {
    const bad = String(e.message ?? e).match(/@?([\w-]+) is undefined|variable @([\w-]+)/);
    const name = bad ? (bad[1] ?? bad[2]) : null;
    const idx = name ? current.indexOf(name) : -1;
    if (idx < 0) {
      if (e.line && e.line >= 5) {
        const removed = current.splice(e.line - 5, 1);
        dropped.push(...removed);
        continue;
      }
      console.error('Unrecoverable LESS error:', e.message ?? e);
      process.exit(1);
    }
    dropped.push(...current.splice(idx, 1));
  }
}
console.error('Too many unresolvable variables.');
process.exit(1);
