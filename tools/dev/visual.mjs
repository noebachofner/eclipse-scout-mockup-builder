#!/usr/bin/env node
/**
 * Visual regression tests.
 *
 * Roughly half of this project is CSS, and the layout bugs that actually got
 * shipped - the chart overlapping the form, rows all the same height, the tab
 * marker spanning the whole tab area - were all invisible to assertion tests
 * and obvious in a picture. Each scenario below is rendered and compared with a
 * stored golden image.
 *
 *   node tools/dev/visual.mjs            compare against the goldens
 *   node tools/dev/visual.mjs --update   rewrite the goldens
 *
 * Differences are reported as a pixel count plus a diff image under
 * `visual-out/`, which marks changed pixels in magenta over a faded original.
 * The comparison itself runs in the browser: it is the one place that can
 * decode a PNG without pulling in a dependency.
 */
import {launchBrowser} from './browser.mjs';
import {createServer} from 'node:http';
import {readFile, writeFile, mkdir, access} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';

const DIST = 'dist';
const GOLDEN_DIR = 'tools/test/golden';
const OUT_DIR = 'visual-out';
const UPDATE = process.argv.includes('--update');
/** A handful of pixels may differ from font rasterisation between runs. */
const TOLERANCE = 40;

const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json'};

/**
 * Each scenario runs inside the page against `window.esMockup`, so it can use
 * the same store the editor uses.
 */
/**
 * A scenario picks a template through the File menu - the way a user does -
 * and then adjusts the document through the store on `window.esMockup`.
 */
const SCENARIOS = [
  {
    name: 'desktop-default',
    template: 'Scout desktop',
    description: 'The standard Scout desktop template.'
  },
  {
    name: 'desktop-dense',
    template: 'Scout desktop',
    description: "The same desktop in Scout's dense mode.",
    tweak: () => window.esMockup.store.updateTheme({dense: true})
  },
  {
    name: 'desktop-themed',
    template: 'Scout desktop',
    description: 'A recoloured desktop, to catch drift in the derived colors.',
    tweak: () => window.esMockup.store.updateTheme({colors: {'accent-color-3': '#7a2e96', 'accent-color-4': '#5d1f75'}})
  },
  {
    name: 'form-condensed',
    template: 'Form only',
    description: 'A narrow canvas, where Scout moves the labels on top.',
    tweak: () => window.esMockup.store.updateCanvas({width: 520, height: 700})
  },
  {
    name: 'gallery-fields',
    template: 'Widget gallery',
    description: 'Value and selection fields from the widget gallery.',
    tweak: () => {
      const store = window.esMockup.store;
      store.setProperty(store.doc.root.id, 'selectedView', 0);
      store.updateCanvas({zoom: 0.5});
    }
  },
  {
    name: 'gallery-tables',
    template: 'Widget gallery',
    description: 'Tables, trees and tiles - the view the chart used to break.',
    tweak: () => {
      const store = window.esMockup.store;
      store.setProperty(store.doc.root.id, 'selectedView', 2);
      store.updateCanvas({zoom: 0.5});
    }
  },
  {
    name: 'gallery-advanced',
    template: 'Widget gallery',
    description: 'Charts, heatmap and the other advanced widgets.',
    tweak: () => {
      const store = window.esMockup.store;
      store.setProperty(store.doc.root.id, 'selectedView', 4);
      store.updateCanvas({zoom: 0.5});
    }
  },
  {
    name: 'gallery-tiles',
    template: 'Widget gallery',
    description: 'Tiles, accordions and the layout containers.',
    tweak: () => {
      const store = window.esMockup.store;
      store.setProperty(store.doc.root.id, 'selectedView', 3);
      store.updateCanvas({zoom: 0.5});
    }
  },
  {
    name: 'gallery-selection',
    template: 'Widget gallery',
    description: 'Check boxes, radio groups, list and tree boxes.',
    tweak: () => {
      const store = window.esMockup.store;
      store.setProperty(store.doc.root.id, 'selectedView', 1);
      store.updateCanvas({zoom: 0.5});
    }
  },
  {
    name: 'statuses-and-callouts',
    template: 'Form only',
    description: 'Field status icons plus a review callout.',
    tweak: () => {
      const store = window.esMockup.store;
      const fields = [];
      const walk = node => { if (node.objectType === 'StringField') fields.push(node); node.children.forEach(walk); };
      walk(store.doc.root);
      if (fields[0]) store.setProperties(fields[0].id, {errorStatus: 'warning', errorStatusMessage: 'Please check this value', statusTooltipVisible: true});
      if (fields[1]) store.setProperties(fields[1].id, {errorStatus: 'error', errorStatusMessage: 'Required'});
      store.addAnnotation(40, 40);
      store.updateAnnotation(store.doc.annotations[0].id, {text: 'Should this be mandatory?'});
    }
  }
];

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let path = normalize(decodeURIComponent(url.pathname));
    if (path === '/' || path === '\\') path = '/index.html';
    const body = await readFile(join(DIST, path));
    res.writeHead(200, {'content-type': TYPES[extname(path)] ?? 'application/octet-stream'});
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise(resolve => server.listen(4185, resolve));

await mkdir(GOLDEN_DIR, {recursive: true});
await mkdir(OUT_DIR, {recursive: true});

const browser = await launchBrowser();
const page = await browser.newPage({viewport: {width: 1600, height: 1000}, deviceScaleFactor: 1});
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });

await page.goto('http://localhost:4185/', {waitUntil: 'networkidle'});
await page.evaluate(() => localStorage.clear());
await page.reload({waitUntil: 'networkidle'});
await page.waitForSelector('.es-canvas-host .desktop');

const results = [];
for (const scenario of SCENARIOS) {
  await page.click('.es-toolbar .es-menu-button .es-button:has-text("File")');
  await page.click(`.es-dropdown-item:has-text("New: ${scenario.template}")`);
  await page.waitForTimeout(250);
  if (scenario.tweak) await page.evaluate(scenario.tweak);
  await page.waitForTimeout(350);
  const shot = await page.locator('.es-canvas-page').screenshot();
  const goldenPath = join(GOLDEN_DIR, `${scenario.name}.png`);

  if (UPDATE || !(await exists(goldenPath))) {
    await writeFile(goldenPath, shot);
    results.push({name: scenario.name, status: UPDATE ? 'updated' : 'created', pixels: 0});
    continue;
  }

  const golden = await readFile(goldenPath);
  const diff = await compare(page, golden, shot);
  if (diff.pixels > TOLERANCE) {
    await writeFile(join(OUT_DIR, `${scenario.name}-actual.png`), shot);
    await writeFile(join(OUT_DIR, `${scenario.name}-diff.png`), Buffer.from(diff.image.split(',')[1], 'base64'));
  }
  results.push({name: scenario.name, status: diff.pixels > TOLERANCE ? 'changed' : 'ok', pixels: diff.pixels, note: diff.note});
}

await browser.close();
server.close();

const failed = results.filter(result => result.status === 'changed');
for (const result of results) {
  const mark = result.status === 'changed' ? 'CHANGED' : result.status.toUpperCase();
  console.log(`${mark.padEnd(8)} ${result.name}${result.pixels ? ` - ${result.pixels} pixels differ` : ''}${result.note ? ` (${result.note})` : ''}`);
}
if (errors.length) {
  console.log('\nCONSOLE ERRORS:');
  errors.forEach(error => console.log('  ' + error));
}
if (failed.length) {
  console.log(`\n${failed.length} scenario(s) changed. Look at ${OUT_DIR}/*-diff.png, then re-run with --update if the change is wanted.`);
  process.exit(1);
}
console.log(`\n${results.length} scenario(s) match their golden image.`);
if (errors.length) process.exit(1);

/* ------------------------------------------------------------------ helpers */

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Compares two PNGs in the browser: it decodes them, walks the pixels and
 * paints the differing ones magenta over a faded copy of the golden.
 */
function compare(page, golden, actual) {
  return page.evaluate(async ([a, b]) => {
    const load = src => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
    const [expected, got] = await Promise.all([load(a), load(b)]);
    if (expected.width !== got.width || expected.height !== got.height) {
      return {pixels: Number.MAX_SAFE_INTEGER, image: b, note: `size ${expected.width}x${expected.height} -> ${got.width}x${got.height}`};
    }
    const draw = image => {
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      return {canvas, context, data: context.getImageData(0, 0, image.width, image.height)};
    };
    const left = draw(expected);
    const right = draw(got);
    const out = left.context.createImageData(expected.width, expected.height);
    let pixels = 0;
    for (let i = 0; i < left.data.data.length; i += 4) {
      const same = Math.abs(left.data.data[i] - right.data.data[i]) < 8
        && Math.abs(left.data.data[i + 1] - right.data.data[i + 1]) < 8
        && Math.abs(left.data.data[i + 2] - right.data.data[i + 2]) < 8;
      if (same) {
        out.data[i] = 255 - (255 - left.data.data[i]) * 0.25;
        out.data[i + 1] = 255 - (255 - left.data.data[i + 1]) * 0.25;
        out.data[i + 2] = 255 - (255 - left.data.data[i + 2]) * 0.25;
      } else {
        pixels++;
        out.data[i] = 255;
        out.data[i + 1] = 0;
        out.data[i + 2] = 255;
      }
      out.data[i + 3] = 255;
    }
    left.context.putImageData(out, 0, 0);
    return {pixels, image: left.canvas.toDataURL('image/png'), note: ''};
  }, [`data:image/png;base64,${golden.toString('base64')}`, `data:image/png;base64,${actual.toString('base64')}`]);
}
