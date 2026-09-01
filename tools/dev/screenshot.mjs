#!/usr/bin/env node
/** Dev helper: loads the built app, optionally runs a scenario, and screenshots it. */
import {launchBrowser} from './browser.mjs';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';

const DIST = 'dist';
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json'};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let path = normalize(decodeURIComponent(url.pathname));
    if (path === '/' || path === '\\') path = '/index.html';
    const file = join(DIST, path);
    const body = await readFile(file);
    res.writeHead(200, {'content-type': TYPES[extname(file)] ?? 'application/octet-stream'});
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise(r => server.listen(4173, r));

const browser = await launchBrowser();
const page = await browser.newPage({viewport: {width: 2200, height: 1200}, deviceScaleFactor: 1});
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push(String(e)));
page.on('requestfailed', r => errors.push(`request failed: ${r.url()}`));
page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });

await page.goto('http://localhost:4173/', {waitUntil: 'networkidle'});
await page.evaluate(() => localStorage.clear());
await page.reload({waitUntil: 'networkidle'});
await page.waitForSelector('.es-canvas-host .desktop', {timeout: 10000});
await page.waitForTimeout(400);

const out = process.argv[2] ?? 'shot.png';
await page.screenshot({path: out});

// Also capture just the mockup canvas at full fidelity.
const canvas = await page.$('.es-canvas-page');
if (canvas) await canvas.screenshot({path: out.replace(/\.png$/, '-canvas.png')});

if (errors.length) {
  console.log('CONSOLE ERRORS:');
  errors.forEach(e => console.log('  ' + e));
} else {
  console.log('No console errors.');
}
await browser.close();
server.close();
