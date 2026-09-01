#!/usr/bin/env node
/**
 * Downloads the official `@eclipse-scout/core` package into .scout/ so that the
 * design tokens, icon font and icon names can be regenerated from the real
 * upstream sources. Run once, then `npm run scout:tokens` / `npm run scout:icons`.
 */
import {execFileSync} from 'node:child_process';
import {mkdirSync, readdirSync, rmSync, copyFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';

const VERSION = process.argv[2] ?? '26.2.2';
const dir = '.scout';

rmSync(dir, {recursive: true, force: true});
mkdirSync(dir, {recursive: true});

console.log(`Downloading @eclipse-scout/core@${VERSION} ...`);
execFileSync('npm', ['pack', `@eclipse-scout/core@${VERSION}`], {cwd: dir, stdio: 'inherit'});
const tgz = readdirSync(dir).find(f => f.endsWith('.tgz'));
execFileSync('tar', ['xzf', tgz], {cwd: dir, stdio: 'inherit'});

mkdirSync('public/fonts', {recursive: true});
for (const font of ['scoutIcons.woff', 'scoutIcons-light.woff']) {
  const src = join(dir, 'package', 'res', 'fonts', font);
  if (existsSync(src)) {
    copyFileSync(src, join('public', 'fonts', font));
    console.log(`Copied ${font} -> public/fonts/`);
  }
}
console.log('Done. Now run: npm run scout:tokens && npm run scout:icons');
