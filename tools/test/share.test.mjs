/**
 * Share links. `buildShareUrl` reads `location`, which Node does not have, so
 * a minimal stand-in is installed before the module is loaded.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {importTs} from './_bundle.mjs';

globalThis.location = {origin: 'https://example.org', pathname: '/mockup/', search: ''};

const share = await importTs('src/io/share.ts');
const templates = await importTs('src/model/templates.ts');

test('a document round trips through a share URL', async () => {
  const original = templates.defaultDesktopTemplate();
  original.meta.name = 'Round trip';
  const url = await share.buildShareUrl(original);
  assert.ok(url.startsWith('https://example.org/mockup/#m='), url.slice(0, 40));

  const restored = await share.readShareUrl(new URL(url).hash);
  assert.equal(restored.meta.name, 'Round trip');
  assert.equal(restored.root.id, original.root.id);
});

test('the payload is gzipped where the browser supports it', async () => {
  const url = await share.buildShareUrl(templates.defaultDesktopTemplate());
  assert.match(url, /#m=z/);
});

test('gzip keeps a typical mockup well inside a usable URL length', async () => {
  const url = await share.buildShareUrl(templates.defaultDesktopTemplate());
  assert.ok(url.length < share.COMFORTABLE_URL_LENGTH, `${url.length} characters`);
});

test('the fragment is base64url, so nothing needs escaping', async () => {
  const url = await share.buildShareUrl(templates.widgetGalleryTemplate());
  const payload = url.slice(url.indexOf('#m=') + 3);
  assert.match(payload, /^[A-Za-z0-9_-]+$/);
});

test('a hash that is not a share link yields null', async () => {
  assert.equal(await share.readShareUrl('#something-else'), null);
  assert.equal(await share.readShareUrl(''), null);
});

test('a truncated link is rejected rather than half loaded', async () => {
  const url = await share.buildShareUrl(templates.defaultDesktopTemplate());
  const hash = new URL(url).hash;
  assert.equal(await share.readShareUrl(hash.slice(0, hash.length - 40)), null);
});
