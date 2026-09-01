/**
 * Launches Chromium for the development helpers.
 *
 * Playwright pins a browser revision that may not match the one already present
 * in a CI image, so try the pinned download first and fall back to any Chromium
 * found under PLAYWRIGHT_BROWSERS_PATH. Set CHROMIUM_PATH to override.
 */
import {chromium} from 'playwright';
import {existsSync, readdirSync} from 'node:fs';
import {join} from 'node:path';

const ARGS = ['--no-sandbox', '--font-render-hinting=none'];

function discover() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!root || !existsSync(root)) return null;
  const candidates = readdirSync(root)
    .filter(name => name.startsWith('chromium'))
    .map(name => join(root, name, 'chrome-linux', 'chrome'))
    .filter(existsSync);
  return candidates[0] ?? null;
}

export async function launchBrowser() {
  const executablePath = discover();
  try {
    return await chromium.launch(executablePath ? {executablePath, args: ARGS} : {args: ARGS});
  } catch (error) {
    if (!executablePath) throw error;
    return chromium.launch({executablePath, args: ARGS});
  }
}
