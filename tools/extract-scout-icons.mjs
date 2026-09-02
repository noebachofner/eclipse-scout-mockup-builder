#!/usr/bin/env node
import {readFileSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';

const pkgDir = resolve(process.argv[2] ?? '.scout/package');
const outFile = resolve(process.argv[3] ?? 'src/model/scoutIcons.generated.ts');
const text = readFileSync(join(pkgDir, 'src', 'style', 'icons.less'), 'utf8');

const entries = [];
const re = /^@icon-([\w-]+)\s*:\s*'([^']*)'\s*;/gm;
let m;
while ((m = re.exec(text)) !== null) {
  const id = m[1];
  const raw = m[2];
  const char = raw.replace(/\\([0-9A-Fa-f]{1,6})/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));
  if (id === 'nbsp') continue;
  entries.push([id, char]);
}

const body = entries
  .map(([id, char]) => `  '${id}': '\\u${char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}'`)
  .join(',\n');

writeFileSync(outFile, `/*
 * Eclipse Scout icon characters - GENERATED FILE, DO NOT EDIT.
 * Extracted from @eclipse-scout/core by tools/extract-scout-icons.mjs.
 * Upstream is licensed under EPL-2.0 - see THIRD-PARTY-NOTICES.md.
 */

/** Maps a Scout icon id (as used in \`iconId\`, e.g. \`font:\\uE02A\`) to its character in the scoutIcons font. */
export const SCOUT_ICONS: Record<string, string> = {
${body}
};

export const SCOUT_ICON_IDS = Object.keys(SCOUT_ICONS);
`);
console.log(`Wrote ${entries.length} icons to ${outFile}`);
