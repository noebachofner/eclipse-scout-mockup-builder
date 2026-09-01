#!/usr/bin/env node
/**
 * End-to-end smoke test of the editor: palette insert, drag & drop, property
 * editing, theming, free placement, save/load round trip and both exports.
 * The exported HTML is loaded in a fresh page and screenshotted, which is the
 * only way to prove the export really is standalone.
 *
 * Usage: node tools/dev/e2e.mjs [outDir]
 */
import {launchBrowser} from './browser.mjs';
import {createServer} from 'node:http';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';

const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff': 'font/woff', '.png': 'image/png'};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let path = normalize(decodeURIComponent(url.pathname));
    if (path === '/') path = '/index.html';
    const body = await readFile(join('dist', path));
    res.writeHead(200, {'content-type': TYPES[extname(path)] ?? 'application/octet-stream'});
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise(r => server.listen(4177, r));

const outDir = process.argv[2] ?? 'e2e-out';
await mkdir(outDir, {recursive: true});

const browser = await launchBrowser();
const context = await browser.newContext({viewport: {width: 1900, height: 1100}, acceptDownloads: true});
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

const checks = [];
const check = (name, ok, detail = '') => {
  checks.push({name, ok, detail});
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' - ' + detail : ''}`);
};

await page.goto('http://localhost:4177/', {waitUntil: 'networkidle'});
await page.evaluate(() => localStorage.clear());
await page.reload({waitUntil: 'networkidle'});
await page.waitForSelector('.es-canvas-host .desktop');

const countNodes = () => page.evaluate(() => {
  let n = 0;
  const walk = node => { n++; node.children.forEach(walk); };
  walk(window.esMockup.store.doc.root);
  return n;
});

// --- 1. add a widget by clicking it in the palette -------------------------
const before = await countNodes();
await page.click('.es-structure-row:has-text("Personal data")');
await page.fill('.es-search', 'Check box');
await page.click('.es-palette-item:has-text("Check box")');
await page.waitForTimeout(150);
const after = await countNodes();
check('palette click inserts a widget', after === before + 1, `${before} -> ${after}`);
check('inserted widget is selected', await page.evaluate(() =>
  window.esMockup.store.selectedNode?.objectType === 'CheckBoxField'));
check('check box is rendered on the canvas',
  (await page.locator('.es-canvas-host .scout-check-box-field').count()) === 1);

// --- 2. drag & drop from the palette onto the canvas ----------------------
await page.fill('.es-search', 'Slider');
const source = page.locator('.es-palette-item:has-text("Slider field")');
const target = page.locator('.es-canvas-host .scout-group-box .group-box-body').first();
await source.dragTo(target);
await page.waitForTimeout(200);
check('drag & drop inserts a widget',
  (await page.locator('.es-canvas-host .scout-slider-field').count()) === 1);

// --- 3. edit a property ---------------------------------------------------
await page.click('.es-canvas-host .scout-slider-field');
await page.waitForTimeout(100);
const labelInput = page.locator('.es-property-row:has(.es-property-label:text-is("Label")) input.es-input').first();
await labelInput.fill('Completion');
await labelInput.press('Enter');
await labelInput.blur().catch(() => {});
await page.waitForTimeout(200);
check('property edit reaches the canvas',
  (await page.locator('.es-canvas-host .scout-slider-field > label').innerText()).trim() === 'Completion');

// --- 4. undo / redo -------------------------------------------------------
await page.keyboard.press('Control+z');
await page.waitForTimeout(150);
const afterUndo = await page.locator('.es-canvas-host .scout-slider-field > label').innerText();
check('undo reverts the property edit', afterUndo.trim() !== 'Completion', afterUndo.trim());
await page.keyboard.press('Control+Shift+z');
await page.waitForTimeout(150);
check('redo re-applies the property edit',
  (await page.locator('.es-canvas-host .scout-slider-field > label').innerText()).trim() === 'Completion');

// --- 5. theme ------------------------------------------------------------
const headerColorBefore = await page.evaluate(() =>
  getComputedStyle(document.querySelector('.es-canvas-host .desktop-header')).backgroundColor);
await page.click('.es-tab:text-is("Theme")');
await page.click('.es-preset:has-text("Plum")');
await page.waitForTimeout(250);
const headerColorAfter = await page.evaluate(() =>
  getComputedStyle(document.querySelector('.es-canvas-host .desktop-header')).backgroundColor);
check('theme preset recolours the desktop', headerColorBefore !== headerColorAfter,
  `${headerColorBefore} -> ${headerColorAfter}`);
const selectionColor = await page.evaluate(() =>
  getComputedStyle(document.querySelector('.es-canvas-host .tree-node.selected')).backgroundColor);
check('theme propagates to derived colors (selection)', selectionColor !== 'rgb(233, 240, 246)', selectionColor);
await page.click('.es-preset:has-text("Scout blue")');
await page.waitForTimeout(200);

// --- 6. free placement ---------------------------------------------------
await page.click('.es-tab:text-is("Properties")');
await page.click('.es-structure-row:has-text("Personal data")');
await page.waitForTimeout(120);
const layoutSelect = page.locator('.es-property-row:has(.es-property-label:text-is("Layout mode")) select').first();
await layoutSelect.selectOption({label: 'Free placement (sketch)'});
await page.waitForTimeout(250);
check('free placement warns that Scout cannot reproduce it',
  (await page.locator('.es-warning:has-text("Free placement")').count()) > 0);
check('free placement positions children absolutely',
  await page.evaluate(() => {
    const el = document.querySelector('.es-canvas-host .free-form > *');
    return !!el && getComputedStyle(el).position === 'absolute';
  }));
await page.keyboard.press('Control+z');
await page.waitForTimeout(200);

// --- 7. save / load round trip -------------------------------------------
const roundTrip = await page.evaluate(() => {
  const before = window.esMockup.store.serialize();
  const parsed = JSON.parse(before);
  return {ok: parsed.format === 'es-mockup' && !!parsed.root, size: before.length};
});
check('document serializes to the .esmockup format', roundTrip.ok, `${roundTrip.size} bytes`);

const savePromise = page.waitForEvent('download');
await page.click('.es-toolbar .es-button:text-is("Save")');
const saved = await savePromise;
const savedPath = join(outDir, 'roundtrip.esmockup');
await saved.saveAs(savedPath);
const savedText = await readFile(savedPath, 'utf8');
check('save downloads a JSON file', savedText.trim().startsWith('{') && savedText.includes('"es-mockup"'));

// Load it back through the real file picker.
const savedName = await page.evaluate(() => {
  window.esMockup.store.updateMeta({name: 'Round trip probe'});
  return window.esMockup.store.doc.meta.name;
});
check('meta edit applied before reload', savedName === 'Round trip probe');

const chooserPromise = page.waitForEvent('filechooser');
await page.click('.es-toolbar .es-button:text-is("Open…")');
const chooser = await chooserPromise;
await chooser.setFiles(savedPath);
await page.waitForTimeout(400);
const loaded = await page.evaluate(() => {
  const doc = window.esMockup.store.doc;
  let n = 0;
  const walk = node => { n++; node.children.forEach(walk); };
  walk(doc.root);
  return {name: doc.meta.name, nodes: n, format: doc.format};
});
check('open restores the saved document', loaded.format === 'es-mockup' && loaded.name !== 'Round trip probe',
  `${loaded.nodes} nodes, name "${loaded.name}"`);
check('open restores the full widget tree', loaded.nodes === after + 1, `${loaded.nodes} nodes`);

// Rejecting a non-mockup file must not destroy the current document.
const badPath = join(outDir, 'not-a-mockup.json');
await writeFile(badPath, JSON.stringify({hello: 'world'}));
const badChooserPromise = page.waitForEvent('filechooser');
await page.click('.es-toolbar .es-button:text-is("Open…")');
(await badChooserPromise).setFiles(badPath);
await page.waitForTimeout(400);
check('a foreign JSON file is rejected with a message',
  (await page.locator('.es-toast.error').count()) > 0 &&
  (await page.evaluate(() => window.esMockup.store.doc.format)) === 'es-mockup');

// --- 8. HTML export ------------------------------------------------------
const htmlPromise = page.waitForEvent('download');
await page.click('.es-toolbar .es-menu-button:has-text("Export") .es-button');
await page.click('.es-dropdown-item:has-text("HTML file")');
const htmlDownload = await htmlPromise;
const htmlPath = join(outDir, 'export.html');
await htmlDownload.saveAs(htmlPath);
const html = await readFile(htmlPath, 'utf8');
check('HTML export inlines the icon font', html.includes('data:font/woff;base64,'));
check('HTML export inlines the Scout tokens', html.includes('--scout-desktop-header-background-color'));
check('HTML export contains no external references',
  !/(src|href)\s*=\s*"(?!data:)(https?:)?\/\//.test(html) && !/url\(['"]?\/fonts/.test(html));

// Render the exported file in a fresh page to prove it stands alone.
const exportPage = await context.newPage();
const exportErrors = [];
exportPage.on('pageerror', e => exportErrors.push(String(e)));
exportPage.on('response', r => { if (r.status() >= 400) exportErrors.push(`${r.status()} ${r.url()}`); });
await exportPage.setContent(html, {waitUntil: 'networkidle'});
await exportPage.waitForTimeout(400);
await exportPage.locator('.es-export-page').screenshot({path: join(outDir, 'export.png')});
check('exported HTML renders the desktop',
  (await exportPage.locator('.es-export-page .desktop-header').count()) === 1);
check('exported HTML loads without errors', exportErrors.length === 0, exportErrors.join('; '));
await exportPage.close();

// --- 9. PNG export -------------------------------------------------------
const pngPromise = page.waitForEvent('download', {timeout: 30000});
await page.click('.es-toolbar .es-menu-button:has-text("Export") .es-button');
await page.click('.es-dropdown-item:has-text("PNG image (1")');
const pngDownload = await pngPromise;
const pngPath = join(outDir, 'export-canvas.png');
await pngDownload.saveAs(pngPath);
const png = await readFile(pngPath);
check('PNG export produces a PNG', png.length > 5000 && png[0] === 0x89 && png[1] === 0x50,
  `${Math.round(png.length / 1024)} KB`);

await page.screenshot({path: join(outDir, 'editor.png')});
await writeFile(join(outDir, 'result.json'), JSON.stringify(checks, null, 2));

await browser.close();
server.close();

const failed = checks.filter(c => !c.ok);
if (errors.length) {
  console.log('\nCONSOLE ERRORS:');
  errors.forEach(e => console.log('  ' + e));
}
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed.`);
if (failed.length || errors.length) process.exit(1);
