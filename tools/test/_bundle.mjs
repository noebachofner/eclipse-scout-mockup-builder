/**
 * Bundles a TypeScript entry point and imports it in Node.
 *
 * The catalog modules build DOM nodes only inside their render functions, but a
 * few helpers touch `document` while the module is evaluated, so a very small
 * stub stands in for it. The generators under test never render anything.
 */
import {build} from 'vite';

export async function importTs(entry) {
  const bundle = await build({
    logLevel: 'silent',
    configFile: false,
    build: {write: false, lib: {entry, formats: ['es'], fileName: 'm'}, minify: false}
  });
  const code = bundle[0].output[0].code;
  return import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
}
