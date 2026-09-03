#!/usr/bin/env node
import {execFileSync} from 'node:child_process';
import {readdirSync, writeFileSync, mkdirSync, existsSync} from 'node:fs';
import {join, resolve} from 'node:path';

const SCOUT_VERSION = process.argv[2] ?? '26.1.18';
const jarDir = resolve(process.argv[3] ?? '.scout/java');
const outFile = resolve(process.argv[4] ?? 'src/model/scoutJavaApi.generated.ts');

const ARTIFACTS = [
  'org.eclipse.scout.rt.client',
  'org.eclipse.scout.rt.platform',
  'org.eclipse.scout.rt.shared',
  'org.eclipse.scout.rt.dataobject',
  'org.eclipse.scout.rt.security'
];

const FIELDS = 'org.eclipse.scout.rt.client.ui.form.fields';
const COLUMNS = 'org.eclipse.scout.rt.client.ui.basic.table.columns';

const CLASSES = [
  'org.eclipse.scout.rt.client.ui.form.AbstractForm',
  `${FIELDS}.AbstractFormField`,
  `${FIELDS}.groupbox.AbstractGroupBox`,
  `${FIELDS}.tabbox.AbstractTabBox`,
  `${FIELDS}.sequencebox.AbstractSequenceBox`,
  `${FIELDS}.splitbox.AbstractSplitBox`,
  `${FIELDS}.placeholder.AbstractPlaceholderField`,
  `${FIELDS}.wrappedform.AbstractWrappedFormField`,
  `${FIELDS}.stringfield.AbstractStringField`,
  `${FIELDS}.bigdecimalfield.AbstractBigDecimalField`,
  `${FIELDS}.integerfield.AbstractIntegerField`,
  `${FIELDS}.datefield.AbstractDateField`,
  `${FIELDS}.smartfield.AbstractSmartField`,
  `${FIELDS}.smartfield.AbstractProposalField`,
  `${FIELDS}.tagfield.AbstractTagField`,
  `${FIELDS}.colorfield.AbstractColorField`,
  `${FIELDS}.filechooserfield.AbstractFileChooserField`,
  `${FIELDS}.clipboardfield.AbstractClipboardField`,
  `${FIELDS}.labelfield.AbstractLabelField`,
  `${FIELDS}.htmlfield.AbstractHtmlField`,
  `${FIELDS}.browserfield.AbstractBrowserField`,
  `${FIELDS}.imagefield.AbstractImageField`,
  `${FIELDS}.beanfield.AbstractBeanField`,
  `${FIELDS}.booleanfield.AbstractBooleanField`,
  `${FIELDS}.radiobuttongroup.AbstractRadioButtonGroup`,
  `${FIELDS}.listbox.AbstractListBox`,
  `${FIELDS}.treebox.AbstractTreeBox`,
  `${FIELDS}.modeselector.AbstractModeSelectorField`,
  `${FIELDS}.tablefield.AbstractTableField`,
  `${FIELDS}.treefield.AbstractTreeField`,
  `${FIELDS}.calendarfield.AbstractCalendarField`,
  `${FIELDS}.button.AbstractButton`,
  `${FIELDS}.wizard.AbstractWizardProgressField`,
  `${FIELDS}.breadcrumbbarfield.AbstractBreadcrumbBarField`,
  `${FIELDS}.tilefield.AbstractTileField`,
  `${FIELDS}.accordionfield.AbstractAccordionField`,
  'org.eclipse.scout.rt.client.ui.action.menu.AbstractMenu',
  'org.eclipse.scout.rt.client.ui.basic.table.AbstractTable',
  `${COLUMNS}.AbstractColumn`,
  `${COLUMNS}.AbstractStringColumn`,
  `${COLUMNS}.AbstractDateColumn`,
  `${COLUMNS}.AbstractBigDecimalColumn`
];

mkdirSync(jarDir, {recursive: true});
for (const artifact of ARTIFACTS) {
  const file = join(jarDir, `${artifact}.jar`);
  if (existsSync(file)) continue;
  const url = `https://repo1.maven.org/maven2/org/eclipse/scout/rt/${artifact}/${SCOUT_VERSION}/${artifact}-${SCOUT_VERSION}.jar`;
  console.log(`downloading ${artifact} ${SCOUT_VERSION}`);
  execFileSync('curl', ['-sSf', '-o', file, url], {stdio: ['ignore', 'inherit', 'inherit']});
}

const classpath = readdirSync(jarDir).filter(name => name.endsWith('.jar')).map(name => join(jarDir, name)).join(':');

function javap(className, flags = []) {
  try {
    return execFileSync('javap', ['-cp', classpath, ...flags, className], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']});
  } catch {
    return '';
  }
}

function stripTypeParameters(text) {
  let previous;
  let result = text;
  do {
    previous = result;
    result = result.replace(/<[^<>]*>/g, '');
  } while (result !== previous);
  return result;
}

function superclassOf(className) {
  const line = stripTypeParameters(javap(className).split('\n')[1] ?? '');
  const match = line.match(/ extends ([A-Za-z0-9_.]+)/);
  return match ? match[1] : null;
}

function configuredMethods(className) {
  const found = new Set();
  let current = className;
  for (let depth = 0; current && current !== 'java.lang.Object' && depth < 12; depth++) {
    for (const match of javap(current, ['-protected']).matchAll(/\b(getConfigured[A-Za-z0-9]+)\(/g)) {
      found.add(match[1]);
    }
    current = superclassOf(current);
  }
  return [...found].sort();
}

const api = {};
for (const className of CLASSES) {
  const simple = className.slice(className.lastIndexOf('.') + 1);
  const methods = configuredMethods(className);
  if (!methods.length) {
    console.error(`no methods found for ${className} - is the classpath complete?`);
    process.exit(1);
  }
  api[simple] = methods;
}

const entries = Object.entries(api)
  .map(([name, methods]) => `  ${name}: [\n${methods.map(m => `    '${m}'`).join(',\n')}\n  ]`)
  .join(',\n');

writeFileSync(outFile, `/*
 * Configured methods of the Scout Java API - GENERATED FILE, DO NOT EDIT.
 *
 * Extracted from org.eclipse.scout.rt ${SCOUT_VERSION} by
 * tools/extract-scout-java-api.mjs. Upstream is EPL-2.0 - see THIRD-PARTY-NOTICES.md.
 *
 * The Java export consults this so it can only emit an @Override for a method
 * the target class actually has.
 */
export const SCOUT_JAVA_VERSION = '${SCOUT_VERSION}';

export const SCOUT_JAVA_API: Record<string, string[]> = {
${entries}
};
`);
console.log(`wrote ${Object.keys(api).length} classes to ${outFile}`);
