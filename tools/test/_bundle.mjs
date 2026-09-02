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
