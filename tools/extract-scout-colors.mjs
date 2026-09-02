#!/usr/bin/env node
import {readFileSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';

const pkgDir = resolve(process.argv[2] ?? '.scout/package');
const outFile = resolve(process.argv[3] ?? 'src/model/scoutColors.generated.ts');
const text = readFileSync(join(pkgDir, 'src', 'style', 'colors.less'), 'utf8');

function parseExpr(input) {
  let pos = 0;
  const ws = () => {
    while (pos < input.length && /\s/.test(input[pos])) pos++;
  };
  function parse() {
    ws();
    if (input[pos] === '@') {
      pos++;
      const start = pos;
      while (pos < input.length && /[\w-]/.test(input[pos])) pos++;
      return {k: 'ref', name: input.slice(start, pos)};
    }
    const start = pos;
    while (pos < input.length && /[\w.#%-]/.test(input[pos])) pos++;
    const word = input.slice(start, pos);
    ws();
    if (input[pos] === '(') {
      pos++;
      const args = [];
      for (;;) {
        ws();
        if (input[pos] === ')') { pos++; break; }
        args.push(parse());
        ws();
        if (input[pos] === ',') { pos++; continue; }
        if (input[pos] === ')') { pos++; break; }
        if (pos >= input.length) break;
        pos++;
      }
      return {k: 'call', fn: word.toLowerCase(), args};
    }
    return {k: 'lit', value: word};
  }
  const node = parse();
  ws();
  return pos >= input.length ? node : {k: 'lit', value: input.trim()};
}

const decls = [];
const re = /^@([a-zA-Z][\w-]*)\s*:\s*([^;]*);/gm;
let m;
while ((m = re.exec(text)) !== null) {
  const name = m[1];
  const raw = m[2].replace(/\/\/.*$/, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
  if (!raw) continue;
  decls.push({name, expr: parseExpr(raw)});
}

const palette = decls.map(d => d.name).filter(n => /^palette-/.test(n));
const accents = decls.map(d => d.name).filter(n => /^accent-color-\d$/.test(n));
const version = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8')).version;

writeFileSync(outFile, `/*
 * Eclipse Scout color expression tree - GENERATED FILE, DO NOT EDIT.
 *
 * Extracted from @eclipse-scout/core (${version}) colors.less by
 * tools/extract-scout-colors.mjs. Upstream is EPL-2.0 - see THIRD-PARTY-NOTICES.md.
 *
 * Evaluated at runtime by src/render/colorSystem.ts so that changing a palette
 * or accent color propagates through the whole Scout color system the same way
 * a recompile of the LESS theme would.
 */

export type ColorExpr =
  | {k: 'lit'; value: string}
  | {k: 'ref'; name: string}
  | {k: 'call'; fn: string; args: ColorExpr[]};

export interface ColorDecl {
  name: string;
  expr: ColorExpr;
}

/** All declarations of colors.less, in source order (later ones may reference earlier ones). */
export const SCOUT_COLOR_DECLS: ColorDecl[] = ${JSON.stringify(decls, null, 2)};

/** The raw palette entries (\`@palette-*\`) - the base of the whole color system. */
export const SCOUT_PALETTE_NAMES: string[] = ${JSON.stringify(palette)};

/** The accent colors that drive headers, selection, focus and default buttons. */
export const SCOUT_ACCENT_NAMES: string[] = ${JSON.stringify(accents)};

export const SCOUT_VERSION = '${version}';
`);
console.log(`Wrote ${decls.length} color declarations (${palette.length} palette, ${accents.length} accent) to ${outFile}`);
