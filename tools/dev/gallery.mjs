#!/usr/bin/env node
/**
 * Dev helper: loads the widget gallery template and screenshots every view, so
 * a regression in a rarely used renderer shows up as an image diff.
 *
 * Usage: node tools/dev/gallery.mjs <outDir>
 */
import {launchBrowser} from './browser.mjs';
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';

const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml'};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let path = normalize(decodeURIComponent(url.pathname));
    if (path === '/') path = '/index.html';
    const file = join('dist', path);
    const body = await readFile(file);
    res.writeHead(200, {'content-type': TYPES[extname(file)] ?? 'application/octet-stream'});
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise(r => server.listen(4174, r));

const outDir = process.argv[2] ?? 'gallery';
await mkdir(outDir, {recursive: true});

const browser = await launchBrowser();
const page = await browser.newPage({viewport: {width: 2400, height: 1400}});
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });

await page.goto('http://localhost:4174/', {waitUntil: 'networkidle'});
await page.evaluate(() => localStorage.clear());
await page.reload({waitUntil: 'networkidle'});
await page.waitForSelector('.es-canvas-host .desktop');

// Switch to the gallery template through the New menu, like a user would.
await page.click('.es-toolbar .es-menu-button .es-button:has-text("File")');
await page.click('.es-dropdown-item:has-text("Widget gallery")');
await page.waitForTimeout(300);

const views = await page.evaluate(() => {
  const app = window.esMockup;
  return app.store.doc.root.children.filter(c => c.slot === 'views').map(c => String(c.properties.title));
});

for (const [index, title] of views.entries()) {
  await page.evaluate(i => {
    const app = window.esMockup;
    app.store.setProperty(app.store.doc.root.id, 'selectedView', i);
  }, index);
  await page.waitForTimeout(250);
  const canvas = await page.$('.es-canvas-page');
  const file = join(outDir, `${index}-${title.replace(/[^\w]+/g, '-').toLowerCase()}.png`);
  await canvas.screenshot({path: file});
  console.log('wrote', file);
}

await browser.close();
server.close();
if (errors.length) {
  console.log('ERRORS:');
  errors.forEach(e => console.log(' ', e));
  process.exit(1);
}
console.log('No console errors.');
