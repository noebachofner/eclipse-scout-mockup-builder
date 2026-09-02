import {div, h, span} from '../render/dom';
import type {MockupNode} from '../model/types';
import {collectForms, generateFormJava, suggestClassName, type JavaExportOptions} from '../io/exportJava';
import {downloadText} from '../io/files';
import {editorIcon} from './icons';

const STORAGE_KEY = 'es-mockup.java.v1';

interface Persisted {
  packageName: string;
  useTexts: boolean;
  includeGetters: boolean;
}

function readPersisted(): Persisted {
  const fallback: Persisted = {packageName: '', useTexts: false, includeGetters: true};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return {
      packageName: String(parsed.packageName ?? ''),
      useTexts: !!parsed.useTexts,
      includeGetters: parsed.includeGetters !== false
    };
  } catch {
    return fallback;
  }
}

/**
 * The Java export dialog.
 *
 * Deliberately scoped to a single form: the generated class is meant to be
 * pasted into an existing Scout project, next to the form data and the service
 * that project already has.
 */
export function showJavaExportDialog(root: MockupNode, notify: (message: string, kind?: 'info' | 'error') => void, preselectedId?: string): void {
  document.querySelector('.es-modal-backdrop')?.remove();

  const forms = collectForms(root);
  const backdrop = div('es-modal-backdrop');
  const dialog = div('es-modal es-java-dialog');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', 'Export the form as Scout Java code');

  const header = div('es-modal-header');
  header.appendChild(span('es-modal-title', 'Export form as Scout Java'));
  const closeButton = h('button', 'es-modal-close');
  closeButton.type = 'button';
  closeButton.textContent = '✕';
  closeButton.title = 'Close (Esc)';
  header.appendChild(closeButton);
  dialog.appendChild(header);

  const body = div('es-modal-body');

  if (!forms.length) {
    body.appendChild(div('es-java-empty', 'This mockup contains no form. Add a Form widget - only forms can be exported as Java.'));
    dialog.appendChild(body);
    finish();
    return;
  }

  const persisted = readPersisted();
  let selected = forms.find(form => form.id === preselectedId) ?? forms[0];

  // --- options row ----------------------------------------------------------
  const options = div('es-java-options');

  const formSelect = h('select', 'es-java-select') as HTMLSelectElement;
  forms.forEach(form => {
    const option = document.createElement('option');
    option.value = form.id;
    option.textContent = String(form.properties.title ?? 'Form');
    formSelect.appendChild(option);
  });
  formSelect.value = selected.id;
  options.appendChild(field('Form', formSelect));

  const classInput = h('input', 'es-java-input') as HTMLInputElement;
  classInput.value = suggestClassName(selected);
  options.appendChild(field('Class name', classInput));

  const packageInput = h('input', 'es-java-input') as HTMLInputElement;
  packageInput.placeholder = 'org.example.client.person';
  packageInput.value = persisted.packageName;
  options.appendChild(field('Package', packageInput));

  const textsInput = h('input', '') as HTMLInputElement;
  textsInput.type = 'checkbox';
  textsInput.checked = persisted.useTexts;
  options.appendChild(checkbox('Wrap texts in TEXTS.get()', textsInput));

  const gettersInput = h('input', '') as HTMLInputElement;
  gettersInput.type = 'checkbox';
  gettersInput.checked = persisted.includeGetters;
  options.appendChild(checkbox('Generate field getters', gettersInput));

  body.appendChild(options);

  const scopeNote = div('es-java-note');
  scopeNote.appendChild(editorIcon('help'));
  scopeNote.appendChild(span('', 'Only the form and its fields are generated. Form data, services, outlines and the desktop stay out on purpose - paste this next to the code your project already has.'));
  body.appendChild(scopeNote);

  const warnings = div('es-java-warnings');
  body.appendChild(warnings);

  const pre = h('pre', 'es-java-code');
  const code = h('code', '');
  pre.appendChild(code);
  body.appendChild(pre);
  dialog.appendChild(body);

  // --- footer ---------------------------------------------------------------
  const footer = div('es-modal-footer');
  const copyButton = h('button', 'es-button primary') as HTMLButtonElement;
  copyButton.type = 'button';
  copyButton.appendChild(editorIcon('copy'));
  copyButton.appendChild(span('', 'Copy to clipboard'));
  const downloadButton = h('button', 'es-button') as HTMLButtonElement;
  downloadButton.type = 'button';
  downloadButton.appendChild(editorIcon('save'));
  downloadButton.appendChild(span('', 'Download .java'));
  footer.appendChild(copyButton);
  footer.appendChild(downloadButton);
  dialog.appendChild(footer);

  let current = '';

  const regenerate = (): void => {
    const exportOptions: JavaExportOptions = {
      packageName: packageInput.value,
      className: classInput.value.trim() || suggestClassName(selected),
      useTexts: textsInput.checked,
      includeGetters: gettersInput.checked
    };
    const result = generateFormJava(selected, exportOptions);
    current = result.code;
    code.textContent = result.code;
    warnings.replaceChildren();
    result.warnings.forEach(message => {
      const row = div('es-java-warning');
      row.appendChild(span('', message));
      warnings.appendChild(row);
    });
    warnings.classList.toggle('empty', result.warnings.length === 0);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        packageName: packageInput.value,
        useTexts: textsInput.checked,
        includeGetters: gettersInput.checked
      }));
    } catch {
      // Persisting the settings is a convenience, never a requirement.
    }
  };

  formSelect.addEventListener('change', () => {
    selected = forms.find(form => form.id === formSelect.value) ?? forms[0];
    classInput.value = suggestClassName(selected);
    regenerate();
  });
  [classInput, packageInput].forEach(input => input.addEventListener('input', regenerate));
  [textsInput, gettersInput].forEach(input => input.addEventListener('change', regenerate));

  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(current);
      notify(`${classInput.value}.java copied to the clipboard.`);
    } catch {
      // Clipboard access can be denied; selecting the text still works.
      notify('The browser refused clipboard access - select the code and copy it manually.', 'error');
    }
  });
  downloadButton.addEventListener('click', () => {
    const name = `${classInput.value.trim() || 'MockupForm'}.java`;
    downloadText(current, name, 'text/x-java-source');
    notify(`Saved ${name}.`);
  });

  regenerate();
  finish();

  function finish(): void {
    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);
    const close = (): void => {
      backdrop.remove();
      document.removeEventListener('keydown', onKeyDown, true);
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        close();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    closeButton.addEventListener('click', close);
    backdrop.addEventListener('mousedown', event => {
      if (event.target === backdrop) close();
    });
    closeButton.focus();
  }
}

function field(label: string, control: HTMLElement): HTMLElement {
  const wrapper = div('es-java-field');
  wrapper.appendChild(span('es-java-label', label));
  wrapper.appendChild(control);
  return wrapper;
}

function checkbox(label: string, input: HTMLInputElement): HTMLElement {
  const wrapper = h('label', 'es-java-check');
  wrapper.appendChild(input);
  wrapper.appendChild(span('', label));
  return wrapper;
}
