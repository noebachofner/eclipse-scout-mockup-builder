#!/usr/bin/env node
import {execFileSync, execSync} from 'node:child_process';
import {mkdirSync, writeFileSync, rmSync, readdirSync, existsSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {build} from 'vite';

const SCOUT_VERSION = '26.1.18';
const jarDir = resolve('.scout/java');
const workDir = resolve('javac-out');

const ARTIFACTS = [
  'org.eclipse.scout.rt.client',
  'org.eclipse.scout.rt.platform',
  'org.eclipse.scout.rt.shared',
  'org.eclipse.scout.rt.dataobject',
  'org.eclipse.scout.rt.security'
];

function have(command) {
  try {
    execSync(`command -v ${command}`, {stdio: 'ignore'});
    return true;
  } catch {
    return false;
  }
}

if (!have('javac')) {
  console.log('SKIP  no javac on PATH - the generated Java cannot be compiled here.');
  process.exit(0);
}

mkdirSync(jarDir, {recursive: true});
for (const artifact of ARTIFACTS) {
  const file = join(jarDir, `${artifact}.jar`);
  if (existsSync(file)) continue;
  const url = `https://repo1.maven.org/maven2/org/eclipse/scout/rt/${artifact}/${SCOUT_VERSION}/${artifact}-${SCOUT_VERSION}.jar`;
  try {
    console.log(`downloading ${artifact} ${SCOUT_VERSION}`);
    execFileSync('curl', ['-sSf', '-o', file, url], {stdio: ['ignore', 'inherit', 'inherit']});
  } catch {
    console.log('SKIP  could not download the Scout jars - no network?');
    process.exit(0);
  }
}

async function importTs(entry) {
  const bundle = await build({
    logLevel: 'silent',
    configFile: false,
    build: {write: false, lib: {entry, formats: ['es'], fileName: 'm'}, minify: false}
  });
  const code = bundle[0].output[0].code;
  return import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
}

const templates = await importTs('src/model/templates.ts');
const java = await importTs('src/io/exportJava.ts');

rmSync(workDir, {recursive: true, force: true});
const sourceDir = join(workDir, 'gen');
mkdirSync(sourceDir, {recursive: true});

const written = [];
for (const template of templates.TEMPLATES) {
  const doc = template.create();
  const forms = java.collectForms(doc.root);
  forms.forEach((form, index) => {
    for (const detail of ['changed', 'layout', 'all']) {
      for (const useTexts of [false, true]) {
        const className = `${template.id.replace(/[^a-zA-Z0-9]/g, '')}${index}${detail}${useTexts ? 'Texts' : ''}Form`;
        const result = java.generateFormJava(form, {
          detail, useTexts, packageName: 'gen', className, includeGetters: true
        });
        writeFileSync(join(sourceDir, `${className}.java`), result.code);
        written.push(className);
      }
    }
  });
}

const classpath = readdirSync(jarDir).filter(name => name.endsWith('.jar')).map(name => join(jarDir, name)).join(':');
const classesDir = join(workDir, 'classes');
mkdirSync(classesDir, {recursive: true});

let output = '';
let failed = false;
try {
  output = execFileSync('javac', [
    '-nowarn', '-proc:none', '-cp', classpath, '-d', classesDir,
    ...readdirSync(sourceDir).map(name => join(sourceDir, name))
  ], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']});
} catch (error) {
  output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
  failed = true;
}

const errors = output.split('\n').filter(line => line.includes('error:'));
console.log(`${written.length} generated form(s) compiled against Scout ${SCOUT_VERSION}`);
if (failed || errors.length) {
  console.log(`\n${errors.length} compile error(s):`);
  console.log(output.split('\n').filter(line => !line.includes('JAVA_TOOL_OPTIONS')).slice(0, 60).join('\n'));
  console.log(`\nThe sources are in ${sourceDir}.`);
  process.exit(1);
}
rmSync(workDir, {recursive: true, force: true});
console.log('No compile errors.');
