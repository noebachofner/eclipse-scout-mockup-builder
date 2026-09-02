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

// --- 4b. Scout's default field style is ALTERNATIVE ------------------------
check('value fields use the underlined ALTERNATIVE style by default',
  await page.evaluate(() => {
    const el = document.querySelector('.es-canvas-host .scout-string-field .input-field');
    const style = getComputedStyle(el);
    return el.classList.contains('alternative')
      && style.borderLeftWidth === '0px'
      && style.borderBottomWidth === '1px';
  }));

// --- 4c. responsive CONDENSED state ---------------------------------------
const labelsSideBySide = await page.evaluate(() => {
  const f = document.querySelector('.es-canvas-host .scout-string-field');
  return f.querySelector('label').getBoundingClientRect().bottom > f.querySelector('.field').getBoundingClientRect().top + 2;
});
check('wide grid keeps the labels beside the field', labelsSideBySide);

await page.evaluate(() => window.esMockup.store.updateCanvas({width: 1100}));
await page.waitForTimeout(250);
check('narrow grid moves the labels on top (CONDENSED)',
  await page.evaluate(() => {
    const f = document.querySelector('.es-canvas-host .scout-string-field');
    return f.querySelector('label').getBoundingClientRect().bottom <= f.querySelector('.field').getBoundingClientRect().top + 2;
  }));

await page.evaluate(() => window.esMockup.store.updateTheme({responsive: false}));
await page.waitForTimeout(250);
check('the responsive setting can be turned off',
  await page.evaluate(() => {
    const f = document.querySelector('.es-canvas-host .scout-string-field');
    return f.querySelector('label').getBoundingClientRect().bottom > f.querySelector('.field').getBoundingClientRect().top + 2;
  }));
await page.evaluate(() => {
  window.esMockup.store.updateTheme({responsive: true});
  window.esMockup.store.updateCanvas({width: 1440});
});
await page.waitForTimeout(200);

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

// The file commands live in the File menu now.
const savePromise = page.waitForEvent('download');
await page.click('.es-toolbar .es-menu-button .es-button:has-text("File")');
await page.click('.es-dropdown-item:has-text("Save")');
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
await page.click('.es-toolbar .es-menu-button .es-button:has-text("File")');
await page.click('.es-dropdown-item:has-text("Open…")');
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
await page.click('.es-toolbar .es-menu-button .es-button:has-text("File")');
await page.click('.es-dropdown-item:has-text("Open…")');
(await badChooserPromise).setFiles(badPath);
await page.waitForTimeout(400);
check('a foreign JSON file is rejected with a message',
  (await page.locator('.es-toast.error').count()) > 0 &&
  (await page.evaluate(() => window.esMockup.store.doc.format)) === 'es-mockup');

// --- 8. HTML export ------------------------------------------------------
const htmlPromise = page.waitForEvent('download');
await page.click('.es-toolbar .es-menu-button .es-button:has-text("Export")');
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
await page.click('.es-toolbar .es-menu-button .es-button:has-text("Export")');
await page.click('.es-dropdown-item:has-text("PNG image, 1")');
const pngDownload = await pngPromise;
const pngPath = join(outDir, 'export-canvas.png');
await pngDownload.saveAs(pngPath);
const png = await readFile(pngPath);
check('PNG export produces a PNG', png.length > 5000 && png[0] === 0x89 && png[1] === 0x50,
  `${Math.round(png.length / 1024)} KB`);

// --- 10. editor usability -------------------------------------------------
await page.keyboard.press('Escape');
await page.keyboard.press('Shift+Slash');
await page.waitForTimeout(200);
check('“?” opens the shortcut help', (await page.locator('.es-modal:has-text("Keyboard shortcuts")').count()) === 1);
await page.keyboard.press('Escape');
await page.waitForTimeout(150);
check('Escape closes the shortcut help', (await page.locator('.es-modal-backdrop').count()) === 0);

await page.keyboard.press('Slash');
await page.waitForTimeout(150);
check('“/” focuses the widget search',
  await page.evaluate(() => document.activeElement?.classList.contains('es-search') === true));
await page.keyboard.press('Escape');

const groupsBefore = await page.locator('.es-palette-group').count();
await page.click('.es-palette-group-title:has-text("Value fields")');
await page.waitForTimeout(150);
check('palette categories collapse',
  (await page.locator('.es-palette-group:has(.es-palette-group-title:has-text("Value fields")) .es-palette-item').count()) === 0
  && (await page.locator('.es-palette-group').count()) === groupsBefore);
await page.click('.es-palette-group-title:has-text("Value fields")');

await page.click('.es-structure-row:has-text("First name")');
await page.waitForTimeout(150);
await page.fill('.es-property-filter .es-search', 'label');
await page.waitForTimeout(200);
const filtered = await page.$$eval('.es-property-row .es-property-label', els => els.map(e => e.textContent));
check('property filter narrows the list',
  filtered.length > 0 && filtered.every(label => /label/i.test(label ?? '')), filtered.join(', '));
await page.fill('.es-property-filter .es-search', '');

await page.click('.es-structure-row:has-text("Last name")', {button: 'right'});
await page.waitForTimeout(200);
check('structure tree has a context menu', (await page.locator('.es-context-menu').count()) === 1);
const nodesBeforeDuplicate = await countNodes();
await page.click('.es-context-menu-item:has-text("Duplicate")');
await page.waitForTimeout(200);
check('context menu duplicates a widget', (await countNodes()) === nodesBeforeDuplicate + 1);
await page.keyboard.press('Control+z');
await page.waitForTimeout(150);

// --- 11. free placement: resize with the handles --------------------------
await page.click('.es-structure-row:has-text("Personal data")');
await page.waitForTimeout(150);
await page.locator('.es-property-row:has(.es-property-label:text-is("Layout mode")) select').first()
  .selectOption({label: 'Free placement (sketch)'});
await page.waitForTimeout(350);
const seeded = await page.evaluate(() => {
  const parent = window.esMockup.store.selectedNode;
  const ys = parent.children.map(child => child.properties['bounds.y']);
  return {count: ys.length, distinct: new Set(ys).size};
});
check('switching to free placement keeps the widgets where they were',
  seeded.distinct > 1, `${seeded.distinct} distinct y positions for ${seeded.count} widgets`);

await page.click('.es-structure-row:has-text("First name")');
await page.waitForTimeout(200);
const handleNames = await page.$$eval('.es-selection-box .es-resize-handle', els => els.map(e => e.dataset.handle));
check('a free-form widget has eight resize handles', handleNames.length === 8, handleNames.join(','));

const readBounds = () => page.evaluate(() => {
  const n = window.esMockup.store.selectedNode;
  return {
    x: Number(n.properties['bounds.x']), y: Number(n.properties['bounds.y']),
    w: Number(n.properties['bounds.width']), h: Number(n.properties['bounds.height'])
  };
});
const boundsBefore = await readBounds();
let handleBox = await page.locator('.es-selection-box .es-handle-se').boundingBox();
await page.mouse.move(handleBox.x + 4, handleBox.y + 4);
await page.mouse.down();
await page.mouse.move(handleBox.x + 104, handleBox.y + 54, {steps: 8});
await page.mouse.up();
await page.waitForTimeout(250);
const afterSe = await readBounds();
check('the south-east handle resizes the widget',
  afterSe.w > boundsBefore.w + 50 && afterSe.h > boundsBefore.h + 20,
  `${boundsBefore.w}×${boundsBefore.h} -> ${afterSe.w}×${afterSe.h}`);

handleBox = await page.locator('.es-selection-box .es-handle-nw').boundingBox();
await page.mouse.move(handleBox.x + 4, handleBox.y + 4);
await page.mouse.down();
await page.mouse.move(handleBox.x + 44, handleBox.y + 24, {steps: 6});
await page.mouse.up();
await page.waitForTimeout(250);
const afterNw = await readBounds();
check('the north-west handle moves the origin and shrinks the widget',
  afterNw.x > afterSe.x && afterNw.y > afterSe.y && afterNw.w < afterSe.w && afterNw.h < afterSe.h,
  JSON.stringify(afterNw));

await page.keyboard.press('Shift+ArrowRight');
await page.keyboard.press('ArrowDown');
await page.waitForTimeout(200);
const afterKeys = await readBounds();
check('arrow keys move and Shift+arrows resize',
  afterKeys.w === afterNw.w + 5 && afterKeys.y === afterNw.y + 5, JSON.stringify(afterKeys));

await page.keyboard.press('Control+z');
await page.keyboard.press('Control+z');
await page.keyboard.press('Control+z');
await page.keyboard.press('Control+z');
await page.waitForTimeout(250);

// --- 12. no widget may overlap another in the logical grid ----------------
const overlapProbe = async () => page.evaluate(() => {
  const found = new Set();
  document.querySelectorAll('.es-canvas-host .logical-grid').forEach(grid => {
    const items = [...grid.children].map(el => ({el, rect: el.getBoundingClientRect()}));
    for (const a of items) {
      for (const b of items) {
        if (a.el === b.el) continue;
        const overlaps = a.rect.left < b.rect.right - 1 && b.rect.left < a.rect.right - 1
          && a.rect.top < b.rect.bottom - 1 && b.rect.top < a.rect.bottom - 1;
        if (overlaps) found.add(`${a.el.dataset.objectType ?? a.el.className} / ${b.el.dataset.objectType ?? b.el.className}`);
      }
    }
  });
  return [...found];
});

await page.click('.es-toolbar .es-menu-button .es-button:has-text("File")');
await page.click('.es-dropdown-item:has-text("Widget gallery")');
await page.waitForTimeout(400);
// This used to be swallowed by a confirm() dialog Playwright auto-dismisses,
// which left the checks below inspecting the default desktop instead.
const galleryNodes = await page.evaluate(() => {
  let count = 0;
  const walk = node => { count++; node.children.forEach(walk); };
  walk(window.esMockup.store.doc.root);
  return count;
});
check('the widget gallery template loads', galleryNodes > 60, `${galleryNodes} nodes`);
// Intersecting boxes are only half the story: a widget whose *content* is
// taller than the box it was given spills over the widget below it without the
// two rectangles ever crossing. That is how the chart used to overlap the form.
const overflowProbe = async () => page.evaluate(() => {
  const found = new Set();
  document.querySelectorAll('.es-canvas-host .logical-grid, .es-canvas-host .group-box-body').forEach(box => {
    if (getComputedStyle(box).overflowY !== 'visible') return;
    // Scout scrolls a form's main box, so a form taller than the canvas is
    // normal. Everything inside it must fit the box it was given.
    if (box.parentElement?.classList.contains('root-group-box')) return;
    if (box.scrollHeight > box.clientHeight + 1) {
      const owner = box.closest('[data-object-type]');
      found.add(`${owner?.dataset.objectType ?? box.className} needs ${box.scrollHeight}px but has ${box.clientHeight}px`);
    }
  });
  return [...found];
});

const overlapReport = [];
const overflowReport = [];
for (const view of [0, 1, 2, 3, 4]) {
  await page.evaluate(v => window.esMockup.store.setProperty(window.esMockup.store.doc.root.id, 'selectedView', v), view);
  await page.waitForTimeout(250);
  overlapReport.push(...(await overlapProbe()));
  overflowReport.push(...(await overflowProbe()));
}
check('no widget overlaps another in the logical grid', overlapReport.length === 0, overlapReport.join('; '));
check('no widget content overflows its box', overflowReport.length === 0, overflowReport.join('; '));

// --- 13. the canvas context menu -------------------------------------------
await page.click('.es-toolbar .es-menu-button .es-button:has-text("File")');
await page.click('.es-dropdown-item:has-text("New: Scout desktop")');
await page.waitForTimeout(300);
const menuBox = await page.locator('.es-canvas-page').boundingBox();
await page.mouse.click(menuBox.x + 700, menuBox.y + 240, {button: 'right'});
await page.waitForTimeout(250);
check('right click opens the editor menu instead of the browser one', await page.isVisible('.es-context-menu'));
const menuItems = await page.locator('.es-context-menu-item').allTextContents();
check('the menu names the widget and offers the usual actions',
  menuItems[0]?.trim() === 'String field' && menuItems.some(item => item.startsWith('Duplicate')) && menuItems.some(item => item.startsWith('Remove')),
  menuItems.join(' | '));

await page.hover('.es-context-menu-item:has-text("Add widget")');
await page.waitForTimeout(300);
const categories = await page.locator('.es-context-menu[data-depth="1"] .es-context-menu-item').allTextContents();
check('the add submenu groups the widgets by category', categories.length >= 5, categories.join(', '));

await page.hover('.es-context-menu[data-depth="1"] .es-context-menu-item:has-text("Value fields")');
await page.waitForTimeout(300);
const rowsBeforeInsert = await page.evaluate(() => document.querySelectorAll('.es-structure-row').length);
await page.click('.es-context-menu[data-depth="2"] .es-context-menu-item:has-text("Number field")');
await page.waitForTimeout(300);
const rowsAfterInsert = await page.evaluate(() => document.querySelectorAll('.es-structure-row').length);
check('adding from the submenu inserts the widget', rowsAfterInsert === rowsBeforeInsert + 1, `${rowsBeforeInsert} -> ${rowsAfterInsert}`);
check('the menu closes after an action', !(await page.isVisible('.es-context-menu')));

// The menu has to be usable without a mouse.
await page.mouse.click(menuBox.x + 700, menuBox.y + 240, {button: 'right'});
await page.waitForTimeout(250);
await page.keyboard.press('ArrowDown');
await page.keyboard.press('ArrowDown');
const focused = await page.evaluate(() => document.activeElement?.textContent?.trim());
check('the arrow keys move through the menu', (focused ?? '').startsWith('Copy'), (focused ?? '').slice(0, 40));
await page.keyboard.press('Escape');
await page.waitForTimeout(150);
check('Escape closes the menu', !(await page.isVisible('.es-context-menu')));

// --- 14. multi select, group drag and snapping -----------------------------
await page.click('.es-toolbar .es-menu-button .es-button:has-text("File")');
await page.click('.es-dropdown-item:has-text("New: Form only")');
await page.waitForTimeout(300);
// Switch the group box to free placement so the widgets have positions.
await page.evaluate(() => {
  const store = window.esMockup.store;
  const box = store.doc.root.children[0];
  store.setPropertyWithChildren(box.id, 'layoutMode', 'free', window.esMockup.measureBounds(box.id));
});
await page.waitForTimeout(300);

const freeIds = await page.evaluate(() => window.esMockup.store.doc.root.children[0].children.map(child => child.id));
check('the form has widgets to select', freeIds.length >= 2, `${freeIds.length} widgets`);

const boxOf = id => page.evaluate(nodeId => {
  const store = window.esMockup.store;
  const find = node => node.id === nodeId ? node : node.children.map(find).find(Boolean);
  const node = find(store.doc.root);
  return {
    x: Number(node.properties['bounds.x']),
    y: Number(node.properties['bounds.y']),
    w: Number(node.properties['bounds.width']),
    h: Number(node.properties['bounds.height'])
  };
}, id);

const first = await page.locator(`.es-canvas-host [data-node-id="${freeIds[0]}"]`).boundingBox();
const second = await page.locator(`.es-canvas-host [data-node-id="${freeIds[1]}"]`).boundingBox();
await page.mouse.click(first.x + 20, first.y + 10);
await page.keyboard.down('Shift');
await page.mouse.click(second.x + 20, second.y + 10);
await page.keyboard.up('Shift');
await page.waitForTimeout(200);
const selected = await page.evaluate(() => window.esMockup.store.selectedIds.length);
check('shift-click extends the selection', selected === 2, `${selected} selected`);
check('every selected widget gets a frame', (await page.locator('.es-selection-box').count()) === 2);

const before0 = await boxOf(freeIds[0]);
const before1 = await boxOf(freeIds[1]);
await page.keyboard.press('ArrowDown');
await page.keyboard.press('ArrowDown');
await page.waitForTimeout(200);
const after0 = await boxOf(freeIds[0]);
const after1 = await boxOf(freeIds[1]);
check('arrow keys move the whole selection',
  after0.y === before0.y + 10 && after1.y === before1.y + 10,
  `${before0.y}->${after0.y}, ${before1.y}->${after1.y}`);

// Drag the second widget until its left edge is a few pixels off the first,
// and let the snap pull it into line.
await page.mouse.click(second.x + 20, second.y + 10);
await page.waitForTimeout(150);
const snapAnchor = await boxOf(freeIds[0]);
const snapMover = await boxOf(freeIds[1]);
const zoom = await page.evaluate(() => window.esMockup.store.doc.canvas.zoom);
const grab = await page.locator(`.es-canvas-host [data-node-id="${freeIds[1]}"]`).boundingBox();
await page.mouse.move(grab.x + 20, grab.y + 10);
await page.mouse.down();
await page.mouse.move(grab.x + 20 + (snapAnchor.x - snapMover.x + 3) * zoom, grab.y + 40, {steps: 8});
const guides = await page.locator('.es-guide').count();
await page.mouse.up();
await page.waitForTimeout(200);
const snapped = await boxOf(freeIds[1]);
check('a guide line is drawn while snapping', guides > 0, `${guides} guides`);
check('the widget snaps onto its neighbour', snapped.x === snapAnchor.x, `${snapped.x} vs ${snapAnchor.x}`);

// Rubber band over both widgets.
await page.mouse.click(first.x - 60, first.y - 30);
const band = await page.locator('.es-canvas-page').boundingBox();
await page.mouse.move(band.x + 4, band.y + 4);
await page.mouse.down();
await page.mouse.move(band.x + band.width - 4, band.y + band.height - 4, {steps: 10});
await page.mouse.up();
await page.waitForTimeout(200);
const banded = await page.evaluate(() => window.esMockup.store.selectedIds.length);
check('a rubber band selects everything it encloses', banded >= 2, `${banded} selected`);

// Align them through the context menu.
const alignAnchor = await page.locator(`.es-canvas-host [data-node-id="${freeIds[0]}"]`).boundingBox();
await page.mouse.click(alignAnchor.x + 20, alignAnchor.y + 10, {button: 'right'});
await page.waitForTimeout(250);
const hasAlign = await page.locator('.es-context-menu-item:has-text("Align")').count();
check('the menu offers alignment for a multi selection', hasAlign === 1);
await page.keyboard.press('Escape');
await page.waitForTimeout(150);

// --- 15. the logical grid inspector ----------------------------------------
// Back to a document that actually has logical grids.
await page.click('.es-toolbar .es-menu-button .es-button:has-text("File")');
await page.click('.es-dropdown-item:has-text("New: Scout desktop")');
await page.waitForTimeout(300);
await page.keyboard.press('Control+g');
await page.waitForTimeout(300);
const gridBoxes = await page.locator('.es-grid-box').count();
const gridBadges = await page.locator('.es-grid-badge').count();
check('the grid inspector outlines every logical grid', gridBoxes >= 3, `${gridBoxes} boxes`);
check('every placed widget gets an x/y/w/h badge', gridBadges >= 8, `${gridBadges} badges`);
const badgeText = await page.locator('.es-grid-badge').first().textContent();
check('the badge shows the resolved cell', /^\d+,\d+\d*×\d+/.test((badgeText ?? '').replace(/\s/g, '')), badgeText);
// The multiline notes field spans three rows and inherits weightY 3.
const spanning = await page.evaluate(() => [...document.querySelectorAll('.es-grid-badge')]
  .map(badge => badge.title).find(title => /w 2, h 3/.test(title)) ?? '');
check('the badge reports the inherited weight', /weightY 3/.test(spanning), spanning.replace(/\n/g, ' | '));
await page.keyboard.press('Control+g');
await page.waitForTimeout(200);
check('the inspector can be turned off again', (await page.locator('.es-grid-box').count()) === 0);

// --- 16. review callouts ---------------------------------------------------
await page.click('.es-toolbar .es-menu-button .es-button:has-text("File")');
await page.click('.es-dropdown-item:has-text("New: Scout desktop")');
await page.waitForTimeout(300);
await page.keyboard.press('Control+m');
const canvasBox = await page.locator('.es-canvas-page').boundingBox();
await page.mouse.click(canvasBox.x + 420, canvasBox.y + 250);
await page.waitForTimeout(120);
await page.keyboard.press('Escape');
const placed = await page.evaluate(() => window.esMockup.store.doc.annotations);
check('the callout tool places a numbered marker', placed.length === 1, JSON.stringify(placed));
check('the marker is drawn on the canvas', await page.isVisible('.es-annotation-layer .annotation-marker'));

await page.evaluate(id => window.esMockup.store.updateAnnotation(id, {text: 'Check this field'}), placed[0].id);
await page.waitForTimeout(150);
const calloutHtml = await page.evaluate(async () => {
  const mod = window.esMockup;
  return mod.store.doc.annotations[0].text;
});
check('a callout keeps its text', calloutHtml === 'Check this field', calloutHtml);

// Dragging a marker moves it in the mockup's own coordinate space.
const marker = await page.locator('.es-annotation-layer .annotation-marker').boundingBox();
await page.mouse.move(marker.x + 14, marker.y + 14);
await page.mouse.down();
await page.mouse.move(marker.x + 94, marker.y + 54, {steps: 6});
await page.mouse.up();
await page.waitForTimeout(150);
const moved = await page.evaluate(() => window.esMockup.store.doc.annotations[0]);
check('a callout can be dragged', moved.x === placed[0].x + 80 && moved.y === placed[0].y + 40, JSON.stringify(moved));

// Callouts are review material, so they have to survive an export.
const annotatedPromise = page.waitForEvent('download');
await page.click('.es-toolbar .es-menu-button .es-button:has-text("Export")');
await page.click('.es-dropdown-item:has-text("HTML file")');
const annotatedPath = join(outDir, 'export-annotated.html');
await (await annotatedPromise).saveAs(annotatedPath);
const annotatedHtml = await readFile(annotatedPath, 'utf8');
check('the HTML export carries the callouts',
  annotatedHtml.includes('annotation-marker') && annotatedHtml.includes('Check this field'));

// --- 17. a share link carries the document in its fragment -----------------
await page.evaluate(() => window.esMockup.store.updateMeta({name: 'Shared mockup'}));
const shareUrl = await page.evaluate(() => window.esMockup.shareUrl());
check('the share link fits in a URL', shareUrl.length < 8000, `${shareUrl.length} characters`);
check('the share link is gzip encoded', shareUrl.includes('#m=z'), shareUrl.slice(0, 60));

const shared = await browser.newPage();
await shared.goto(shareUrl, {waitUntil: 'networkidle'});
await shared.waitForSelector('.es-canvas-host .desktop');
await shared.waitForTimeout(300);
const sharedName = await shared.evaluate(() => window.esMockup.store.doc.meta.name);
const sharedNodes = await shared.evaluate(() => {
  let count = 0;
  const walk = n => { count++; n.children.forEach(walk); };
  walk(window.esMockup.store.doc.root);
  return count;
});
check('opening the share link restores the document', sharedName === 'Shared mockup' && sharedNodes > 20, `${sharedName}, ${sharedNodes} nodes`);
check('the fragment is dropped after loading', (await shared.evaluate(() => location.hash)) === '');
await shared.close();

// --- 18. keyboard operability ----------------------------------------------
await page.click('.es-toolbar .es-menu-button .es-button:has-text("File")');
await page.click('.es-dropdown-item:has-text("New: Scout desktop")');
await page.waitForTimeout(300);

const focusInfo = () => page.evaluate(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return {tag: 'body', cls: '', text: ''};
  return {
    tag: el.tagName.toLowerCase(),
    cls: (el.className || '').toString(),
    text: (el.textContent || el.value || '').trim().slice(0, 40)
  };
});

// The palette: one tab stop, arrows inside it, Enter adds.
await page.focus('.es-palette .es-search');
await page.keyboard.press('ArrowDown');
let focus = await focusInfo();
check('ArrowDown from the search box enters the widget list', focus.cls.includes('es-palette-item'), JSON.stringify(focus));
await page.keyboard.press('ArrowDown');
await page.keyboard.press('ArrowDown');
const walked = await focusInfo();
check('arrows walk the widget list', walked.text !== focus.text, `${focus.text} -> ${walked.text}`);
const rovingStops = await page.evaluate(() =>
  [...document.querySelectorAll('.es-palette-item')].filter(item => item.tabIndex === 0).length);
check('the palette keeps a single tab stop', rovingStops === 1, `${rovingStops} stops`);

const nodesBeforeKey = await page.evaluate(() => {
  let count = 0;
  const walk = node => { count++; node.children.forEach(walk); };
  walk(window.esMockup.store.doc.root);
  return count;
});
await page.keyboard.press('Enter');
await page.waitForTimeout(250);
const nodesAfterKey = await page.evaluate(() => {
  let count = 0;
  const walk = node => { count++; node.children.forEach(walk); };
  walk(window.esMockup.store.doc.root);
  return count;
});
check('Enter adds the focused widget', nodesAfterKey === nodesBeforeKey + 1, `${nodesBeforeKey} -> ${nodesAfterKey}`);

// The structure tree is the keyboard route through the widget tree.
await page.evaluate(() => document.querySelector('.es-structure-row').focus());
await page.keyboard.press('ArrowDown');
await page.keyboard.press('ArrowDown');
await page.keyboard.press('Enter');
await page.waitForTimeout(200);
const treeSelected = await page.evaluate(() => {
  const id = window.esMockup.store.selectedId;
  const find = node => node.id === id ? node : node.children.map(find).find(Boolean);
  return find(window.esMockup.store.doc.root)?.objectType;
});
check('the structure tree selects with the keyboard', !!treeSelected && treeSelected !== 'Desktop', treeSelected);

await page.evaluate(() => document.querySelector('.es-structure-row').focus());
await page.keyboard.press('ArrowLeft');
await page.waitForTimeout(200);
const collapsedRows = await page.evaluate(() => document.querySelectorAll('.es-structure-row').length);
check('ArrowLeft collapses a tree node', collapsedRows === 1, `${collapsedRows} rows visible`);
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(200);

// Dialogs keep the focus and give it back.
await page.focus('.es-toolbar .es-button[aria-label="Keyboard shortcuts and help"]');
await page.keyboard.press('Enter');
await page.waitForTimeout(250);
const dialogFocus = await focusInfo();
check('the dialog takes the focus', dialogFocus.cls.includes('es-modal-close'), JSON.stringify(dialogFocus));
await page.keyboard.press('Tab');
const trapped = await page.evaluate(() => !!document.activeElement?.closest('.es-modal'));
check('Tab stays inside the dialog', trapped);
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
const restored = await focusInfo();
check('closing the dialog gives the focus back', restored.cls.includes('es-button'), JSON.stringify(restored));

// --- 19. the workspace panels collapse and resize --------------------------
const panelWidth = side => page.evaluate(
  selector => Math.round(document.querySelector(selector)?.getBoundingClientRect().width ?? -1),
  side === 'left' ? '.es-side-left' : '.es-properties'
);

const leftBefore = await panelWidth('left');
await page.keyboard.press('Control+b');
await page.waitForTimeout(120);
const leftCollapsed = await page.isHidden('.es-side-left');
const railVisible = await page.isVisible('.es-splitter-left.collapsed .es-splitter-label');
check('Ctrl+B collapses the element palette into a rail', leftCollapsed && railVisible);

await page.click('.es-splitter-left .es-splitter-grip');
await page.waitForTimeout(120);
check('the rail grip brings the palette back', (await panelWidth('left')) === leftBefore, `${await panelWidth('left')} vs ${leftBefore}`);

await page.keyboard.press('Control+Shift+b');
await page.waitForTimeout(120);
check('Ctrl+Shift+B collapses the property panel', await page.isHidden('.es-properties'));
await page.keyboard.press('Control+Shift+b');
await page.waitForTimeout(120);

const splitter = await page.locator('.es-splitter-left').boundingBox();
await page.mouse.move(splitter.x + splitter.width / 2, splitter.y + splitter.height / 2);
await page.mouse.down();
await page.mouse.move(splitter.x + splitter.width / 2 + 60, splitter.y + splitter.height / 2, {steps: 6});
await page.mouse.up();
await page.waitForTimeout(120);
const leftDragged = await panelWidth('left');
check('dragging the splitter resizes the palette', leftDragged === leftBefore + 60, `${leftBefore} -> ${leftDragged}`);

const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('es-mockup.layout.v1') ?? '{}'));
check('the panel width is persisted', stored.leftWidth === leftDragged, JSON.stringify(stored));

await page.dblclick('.es-splitter-left', {position: {x: 2, y: 120}});
await page.waitForTimeout(120);
check('double clicking the splitter restores the default width', (await panelWidth('left')) === leftBefore, String(await panelWidth('left')));

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
