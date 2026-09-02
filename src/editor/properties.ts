import {div, h, span} from '../render/dom';
import {getWidget, type PropDef} from '../model/catalog/registry';
import {SCOUT_ICON_IDS} from '../model/scoutIcons.generated';
import {renderIcon} from '../render/icons';
import {findNode, pathTo} from '../model/document';
import type {MockupNode, PropertyValue} from '../model/types';
import type {Store} from './store';
import {THEME_COLOR_FIELDS, THEME_PRESETS} from './theme';
import {DEFAULT_SCOUT_COLORS} from '../render/colorSystem';
import {TEMPLATES} from '../model/templates';
import {editorIcon} from './icons';
import {pickFile, readAsDataUrl} from '../io/files';
import {renderTableEditor} from './tableEditor';
import {renderRowsEditor} from './rowsEditor';

type Tab = 'properties' | 'theme' | 'document';

const CANVAS_PRESETS = [
  {label: 'Desktop', width: 1920, height: 1080},
  {label: 'Laptop', width: 1440, height: 900},
  {label: 'Small laptop', width: 1280, height: 800},
  {label: 'Tablet', width: 1024, height: 768},
  {label: 'Tablet portrait', width: 768, height: 1024},
  {label: 'Phone', width: 390, height: 844}
];

const ADVANCED_GROUPS = new Set(['Logical grid', 'Appearance']);

export interface PropertyPanelCallbacks {
  measureChildBounds(parentId: string): Record<string, Record<string, number>>;
  notify?(message: string, kind?: 'info' | 'error'): void;
}

export class PropertyPanel {
  readonly element: HTMLElement;
  private readonly tabsEl: HTMLElement;
  private readonly body: HTMLElement;
  private tab: Tab = 'properties';
  private propertyFilter = '';
  private collapsedGroups = new Set<string>();
  private showAdvanced = false;

  constructor(private store: Store, private callbacks: PropertyPanelCallbacks) {
    this.element = div('es-panel es-properties');
    this.tabsEl = div('es-tabs');
    (['properties', 'theme', 'document'] as Tab[]).forEach(tab => {
      const button = h('button', 'es-tab');
      button.type = 'button';
      button.textContent = tab === 'properties' ? 'Properties' : tab === 'theme' ? 'Theme' : 'Document';
      button.addEventListener('click', () => {
        this.tab = tab;
        this.render();
      });
      this.tabsEl.appendChild(button);
    });
    this.element.appendChild(this.tabsEl);
    this.body = div('es-properties-body');
    this.element.appendChild(this.body);
    store.subscribe(() => this.render());
    this.render();
  }

  private render(): void {
    this.tabsEl.querySelectorAll<HTMLElement>('.es-tab').forEach((button, i) => {
      button.classList.toggle('selected', ['properties', 'theme', 'document'][i] === this.tab);
    });
    this.body.replaceChildren();
    if (this.tab === 'properties') this.renderProperties();
    else if (this.tab === 'theme') this.renderTheme();
    else this.renderDocument();
  }

  private renderProperties(): void {
    const node = this.store.selectedNode;
    if (!node) {
      this.body.appendChild(div('es-empty-hint', 'Select a widget on the canvas or in the structure tree.'));
      return;
    }
    const def = getWidget(node.objectType);
    if (!def) {
      this.body.appendChild(div('es-empty-hint', `Unknown widget type "${node.objectType}".`));
      return;
    }

    const header = div('es-property-header');
    header.appendChild(div('es-property-title', def.label));
    header.appendChild(div('es-property-subtitle', def.description));
    const reference = div('es-property-reference');
    reference.appendChild(div('es-code', `objectType: '${def.objectType}'`));
    if (def.javaClass) reference.appendChild(div('es-code', def.javaClass));
    header.appendChild(reference);
    this.body.appendChild(header);

    this.body.appendChild(this.renderActions(node));
    this.renderLayoutWarning(node);

    this.body.appendChild(this.renderFilter());

    const filter = this.propertyFilter;
    const groups = new Map<string, PropDef[]>();
    let hidden = 0;
    for (const prop of def.props) {
      if (prop.visibleWhen && !prop.visibleWhen(this.effectiveProps(node, def.defaults))) continue;
      if (!this.showAdvanced && ADVANCED_GROUPS.has(prop.group) && !filter) {
        hidden++;
        continue;
      }
      if (filter && !`${prop.label} ${prop.name}`.toLowerCase().includes(filter)) continue;
      const list = groups.get(prop.group) ?? [];
      list.push(prop);
      groups.set(prop.group, list);
    }

    for (const [group, props] of groups) {
      const collapsed = this.collapsedGroups.has(group) && !filter;
      const section = div('es-property-group');
      if (collapsed) section.classList.add('collapsed');
      const title = h('button', 'es-property-group-title');
      title.type = 'button';
      title.setAttribute('aria-expanded', String(!collapsed));
      title.appendChild(editorIcon(collapsed ? 'chevronRight' : 'chevronDown', 'es-property-group-caret'));
      title.appendChild(span('es-property-group-label', group));
      const overrides = props.filter(prop => node.properties[prop.name] !== undefined).length;
      if (overrides) title.appendChild(span('es-property-group-badge', String(overrides)));
      title.addEventListener('click', () => {
        if (this.collapsedGroups.has(group)) this.collapsedGroups.delete(group);
        else this.collapsedGroups.add(group);
        this.render();
      });
      section.appendChild(title);
      if (!collapsed) {
        for (const prop of props) section.appendChild(this.renderRow(node, prop, def.defaults));
      }
      this.body.appendChild(section);
    }

    if (!groups.size) {
      this.body.appendChild(div('es-empty-hint', filter
        ? `No property matches “${filter}”.`
        : 'This widget has no configurable properties.'));
    }

    if (hidden && !filter) {
      const toggle = h('button', 'es-button block subtle');
      toggle.type = 'button';
      toggle.textContent = `Show ${hidden} advanced propert${hidden === 1 ? 'y' : 'ies'} (logical grid, appearance)`;
      toggle.addEventListener('click', () => {
        this.showAdvanced = true;
        this.render();
      });
      this.body.appendChild(toggle);
    } else if (this.showAdvanced && !filter) {
      const toggle = h('button', 'es-button block subtle');
      toggle.type = 'button';
      toggle.textContent = 'Hide advanced properties';
      toggle.addEventListener('click', () => {
        this.showAdvanced = false;
        this.render();
      });
      this.body.appendChild(toggle);
    }
  }

  private renderFilter(): HTMLElement {
    const wrapper = div('es-search-wrapper es-property-filter');
    wrapper.appendChild(editorIcon('search', 'es-search-icon'));
    const input = h('input', 'es-search');
    input.type = 'search';
    input.placeholder = 'Filter properties…';
    input.value = this.propertyFilter;
    input.setAttribute('aria-label', 'Filter properties');
    input.addEventListener('input', () => {
      this.propertyFilter = input.value.trim().toLowerCase();
      this.render();
      const next = this.body.querySelector<HTMLInputElement>('.es-property-filter .es-search');
      if (next) {
        next.focus();
        next.setSelectionRange(next.value.length, next.value.length);
      }
    });
    wrapper.appendChild(input);
    return wrapper;
  }

  private effectiveProps(node: MockupNode, defaults: Record<string, PropertyValue>): Record<string, PropertyValue> {
    return {...defaults, ...node.properties};
  }

  private renderActions(node: MockupNode): HTMLElement {
    const bar = div('es-property-actions');
    const isRoot = node.id === this.store.doc.root.id;
    const button = (label: string, title: string, action: () => void, disabled = false): HTMLElement => {
      const b = h('button', 'es-button small');
      b.type = 'button';
      b.textContent = label;
      b.title = title;
      b.disabled = disabled;
      b.addEventListener('click', action);
      return b;
    };
    bar.appendChild(button('Duplicate', 'Duplicate this widget', () => this.store.duplicate(node.id), isRoot));
    bar.appendChild(button('Move up', 'Move before the previous sibling', () => this.store.reorder(node.id, -1), isRoot));
    bar.appendChild(button('Move down', 'Move after the next sibling', () => this.store.reorder(node.id, 1), isRoot));
    bar.appendChild(button('Delete', 'Remove this widget and its children', () => this.store.remove(node.id), isRoot));
    return bar;
  }

  private renderLayoutWarning(node: MockupNode): void {
    const chain = pathTo(this.store.doc.root, node.id);
    const parent = chain[chain.length - 2];
    if (parent?.properties.layoutMode === 'free') {
      const warning = div('es-warning');
      warning.appendChild(span('es-warning-title', 'Free placement'));
      warning.appendChild(span('es-warning-text',
        'This widget is positioned absolutely inside its parent. Standard Scout layout cannot reproduce this - switch the parent back to "Logical grid" before handing the mockup to development.'));
      this.body.appendChild(warning);
    }
    if (node.properties.layoutMode === 'free') {
      const warning = div('es-warning');
      warning.appendChild(span('es-warning-title', 'Free placement container'));
      warning.appendChild(span('es-warning-text',
        'Children of this container are placed by pixel coordinates. Grid properties (w, h, weights) are ignored while this mode is active.'));
      this.body.appendChild(warning);
    }
  }

  private renderRow(node: MockupNode, prop: PropDef, defaults: Record<string, PropertyValue>): HTMLElement {
    const row = div('es-property-row');
    const label = h('label', 'es-property-label');
    label.textContent = prop.label;
    if (prop.description) label.title = prop.description;
    row.appendChild(label);

    const current = node.properties[prop.name];
    const fallback = defaults[prop.name];
    const value = current !== undefined ? current : fallback;
    const set = (next: PropertyValue): void => {
      if (prop.name === 'layoutMode' && next === 'free') {
        this.store.setPropertyWithChildren(node.id, prop.name, next, this.callbacks.measureChildBounds(node.id));
        return;
      }
      this.store.setProperty(node.id, prop.name, next);
    };

    row.appendChild(this.renderEditor(prop, value, set, node));

    if (current !== undefined) {
      row.classList.add('overridden');
      const reset = h('button', 'es-reset');
      reset.type = 'button';
      reset.title = 'Reset to the Scout default';
      reset.textContent = '↺';
      reset.addEventListener('click', () => this.store.setProperty(node.id, prop.name, null));
      row.appendChild(reset);
    }
    if (prop.description) {
      row.appendChild(div('es-property-hint', prop.description));
    }
    return row;
  }

  private renderEditor(prop: PropDef, value: PropertyValue | undefined, set: (v: PropertyValue) => void, node: MockupNode): HTMLElement {
    switch (prop.type) {
      case 'boolean': {
        const wrapper = div('es-property-control');
        const input = h('input', 'es-checkbox');
        input.type = 'checkbox';
        input.checked = value === true;
        input.addEventListener('change', () => set(input.checked));
        wrapper.appendChild(input);
        return wrapper;
      }
      case 'number': {
        const input = h('input', 'es-input');
        input.type = 'number';
        if (prop.min !== undefined) input.min = String(prop.min);
        if (prop.max !== undefined) input.max = String(prop.max);
        if (prop.step !== undefined) input.step = String(prop.step);
        input.value = value === undefined || value === null ? '' : String(value);
        input.addEventListener('change', () => set(input.value === '' ? null : Number(input.value)));
        return input;
      }
      case 'enum': {
        const select = h('select', 'es-input');
        for (const option of prop.options ?? []) {
          const el = h('option');
          el.value = String(option.value);
          el.textContent = option.label;
          select.appendChild(el);
        }
        select.value = String(value ?? '');
        select.addEventListener('change', () => {
          const raw = select.value;
          const option = (prop.options ?? []).find(o => String(o.value) === raw);
          set(option ? option.value : raw);
        });
        return select;
      }
      case 'color': {
        const wrapper = div('es-color-control');
        const swatch = h('input', 'es-color');
        swatch.type = 'color';
        swatch.value = normalizeHex(String(value ?? '#ffffff'));
        const text = h('input', 'es-input');
        text.type = 'text';
        text.placeholder = 'inherit';
        text.value = value === undefined || value === null ? '' : String(value);
        swatch.addEventListener('input', () => {
          text.value = swatch.value;
          set(swatch.value);
        });
        text.addEventListener('change', () => set(text.value || null));
        wrapper.appendChild(swatch);
        wrapper.appendChild(text);
        return wrapper;
      }
      case 'icon': {
        const wrapper = div('es-icon-control');
        const preview = span('es-icon-preview');
        const current = renderIcon(String(value ?? ''));
        if (current) preview.appendChild(current);
        const select = h('select', 'es-input');
        const none = h('option');
        none.value = '';
        none.textContent = '(none)';
        select.appendChild(none);
        for (const id of SCOUT_ICON_IDS) {
          const option = h('option');
          option.value = id;
          option.textContent = id;
          select.appendChild(option);
        }
        select.value = String(value ?? '');
        select.addEventListener('change', () => set(select.value || null));
        wrapper.appendChild(preview);
        wrapper.appendChild(select);
        return wrapper;
      }
      case 'image': {
        return this.renderImageEditor(value, set);
      }
      case 'rows': {
        const current = Array.isArray(value) ? (value as string[][]) : [];
        const fallback = getWidget(node.objectType)?.defaults[prop.name];
        return renderRowsEditor({
          headers: prop.columns ?? ['Value'],
          value: current.length ? current : (Array.isArray(fallback) ? (fallback as string[][]) : []),
          onChange: next => set(next)
        });
      }
      case 'columns': {
        return renderTableEditor(node, {
          read: (target, name) => {
            const own = target.properties[name];
            const value = own !== undefined && own !== null ? own : getWidget(target.objectType)?.defaults[name];
            if (!Array.isArray(value)) return [];
            return value.filter(Array.isArray).map(row => row.map(cell => String(cell ?? '')));
          },
          write: (target, values) => this.store.setProperties(target.id, values)
        });
      }
      case 'text':
      case 'lines': {
        const area = h('textarea', 'es-input es-textarea');
        area.rows = prop.type === 'lines' ? 5 : 3;
        area.value = value === undefined || value === null ? '' : String(value);
        if (prop.placeholder) area.placeholder = prop.placeholder;
        area.addEventListener('change', () => set(area.value || null));
        return area;
      }
      default: {
        const input = h('input', 'es-input');
        input.type = 'text';
        input.value = value === undefined || value === null ? '' : String(value);
        if (prop.placeholder) input.placeholder = prop.placeholder;
        input.addEventListener('change', () => set(input.value || null));
        return input;
      }
    }
  }

  private renderImageEditor(value: PropertyValue | undefined, set: (v: PropertyValue) => void): HTMLElement {
    const wrapper = div('es-image-editor');
    const current = value === undefined || value === null ? '' : String(value);

    if (current) {
      const preview = div('es-image-preview');
      const img = document.createElement('img');
      img.src = current;
      img.alt = '';
      preview.appendChild(img);
      wrapper.appendChild(preview);
    }

    const input = h('input', 'es-input');
    input.type = 'text';
    input.placeholder = 'Pick a file, or paste a URL';
    input.value = current.startsWith('data:') ? `${current.slice(0, 24)}… (${Math.round(current.length / 1024)} KB)` : current;
    input.readOnly = current.startsWith('data:');
    input.addEventListener('change', () => set(input.value || null));
    wrapper.appendChild(input);

    const actions = div('es-image-actions');
    const choose = h('button', 'es-mini-button');
    choose.type = 'button';
    choose.textContent = current ? 'Replace…' : 'Choose file…';
    choose.addEventListener('click', async () => {
      const file = await pickFile('image/*');
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        this.callbacks.notify?.(`${file.name} is ${Math.round(file.size / 1024)} KB. Large images bloat the .esmockup file and the exports.`, 'error');
      }
      set(await readAsDataUrl(file));
    });
    actions.appendChild(choose);
    if (current) {
      const clear = h('button', 'es-mini-button');
      clear.type = 'button';
      clear.textContent = 'Remove';
      clear.addEventListener('click', () => set(null));
      actions.appendChild(clear);
    }
    wrapper.appendChild(actions);

    if (/^https?:/i.test(current)) {
      wrapper.appendChild(div(
        'es-property-warning',
        'External URL: the standalone HTML export would depend on that server, and the PNG export cannot load it at all. Pick a file instead to embed the image.'
      ));
    }
    return wrapper;
  }

  private renderTheme(): void {
    const theme = this.store.doc.theme;

    const presets = div('es-property-group');
    presets.appendChild(div('es-property-group-title', 'Color presets'));
    const presetRow = div('es-preset-row');
    for (const preset of THEME_PRESETS) {
      const button = h('button', 'es-preset');
      button.type = 'button';
      button.title = preset.label;
      const accent = preset.colors['accent-color-3'] ?? DEFAULT_SCOUT_COLORS['accent-color-3'];
      button.style.setProperty('--preset-color', accent);
      button.appendChild(span('es-preset-swatch'));
      button.appendChild(span('es-preset-label', preset.label));
      button.addEventListener('click', () => this.store.updateTheme({colors: {...preset.colors}}));
      presetRow.appendChild(button);
    }
    presets.appendChild(presetRow);
    this.body.appendChild(presets);

    const colors = div('es-property-group');
    colors.appendChild(div('es-property-group-title', 'Scout color variables'));
    colors.appendChild(div('es-property-hint',
      'These are the LESS variables of the Scout theme. Changing one re-evaluates the whole color system, exactly like recompiling colors.less.'));
    for (const field of THEME_COLOR_FIELDS) {
      const row = div('es-property-row');
      const label = h('label', 'es-property-label');
      label.textContent = field.label;
      label.title = field.hint;
      row.appendChild(label);

      const wrapper = div('es-color-control');
      const swatch = h('input', 'es-color');
      swatch.type = 'color';
      const effective = theme.colors[field.name] ?? DEFAULT_SCOUT_COLORS[field.name] ?? '#ffffff';
      swatch.value = normalizeHex(effective);
      const text = h('input', 'es-input');
      text.type = 'text';
      text.value = theme.colors[field.name] ?? '';
      text.placeholder = DEFAULT_SCOUT_COLORS[field.name] ?? '';
      const apply = (next: string | null): void => {
        const nextColors = {...theme.colors};
        if (next) nextColors[field.name] = next;
        else delete nextColors[field.name];
        this.store.updateTheme({colors: nextColors});
      };
      swatch.addEventListener('input', () => apply(swatch.value));
      text.addEventListener('change', () => apply(text.value || null));
      wrapper.appendChild(swatch);
      wrapper.appendChild(text);
      row.appendChild(wrapper);
      row.appendChild(div('es-property-hint', field.hint));
      colors.appendChild(row);
    }
    const reset = h('button', 'es-button small');
    reset.type = 'button';
    reset.textContent = 'Reset all colors';
    reset.addEventListener('click', () => this.store.updateTheme({colors: {}}));
    colors.appendChild(reset);
    this.body.appendChild(colors);

    const typography = div('es-property-group');
    typography.appendChild(div('es-property-group-title', 'Typography & density'));
    typography.appendChild(this.simpleRow('Font family', theme.fontFamily, value => this.store.updateTheme({fontFamily: value || 'Arial, sans-serif'})));
    const denseRow = div('es-property-row');
    const denseLabel = h('label', 'es-property-label');
    denseLabel.textContent = 'Dense mode';
    denseLabel.title = "Scout's compact display style: smaller rows and paddings.";
    denseRow.appendChild(denseLabel);
    const denseInput = h('input', 'es-checkbox');
    denseInput.type = 'checkbox';
    denseInput.checked = theme.dense;
    denseInput.addEventListener('change', () => this.store.updateTheme({dense: denseInput.checked}));
    const denseWrapper = div('es-property-control');
    denseWrapper.appendChild(denseInput);
    denseRow.appendChild(denseWrapper);
    typography.appendChild(denseRow);

    const responsiveRow = div('es-property-row');
    const responsiveLabel = h('label', 'es-property-label');
    responsiveLabel.textContent = 'Responsive labels';
    responsiveRow.appendChild(responsiveLabel);
    const responsiveInput = h('input', 'es-checkbox');
    responsiveInput.type = 'checkbox';
    responsiveInput.checked = theme.responsive !== false;
    responsiveInput.addEventListener('change', () => this.store.updateTheme({responsive: responsiveInput.checked}));
    const responsiveWrapper = div('es-property-control');
    responsiveWrapper.appendChild(responsiveInput);
    responsiveRow.appendChild(responsiveWrapper);
    responsiveRow.appendChild(div('es-property-hint',
      "Like Scout's ResponsiveManager: when a logical grid is narrower than the group box needs, the labels move on top (CONDENSED state)."));
    typography.appendChild(responsiveRow);

    this.body.appendChild(typography);
  }

  private renderDocument(): void {
    const doc = this.store.doc;

    const meta = div('es-property-group');
    meta.appendChild(div('es-property-group-title', 'Mockup'));
    meta.appendChild(this.simpleRow('Name', doc.meta.name, value => this.store.updateMeta({name: value})));
    meta.appendChild(this.simpleRow('Author', doc.meta.author, value => this.store.updateMeta({author: value})));
    meta.appendChild(this.textRow('Description', doc.meta.description, value => this.store.updateMeta({description: value})));
    this.body.appendChild(meta);

    const canvas = div('es-property-group');
    canvas.appendChild(div('es-property-group-title', 'Canvas'));

    const sizes = div('es-size-presets');
    for (const preset of CANVAS_PRESETS) {
      const button = h('button', 'es-size-preset');
      button.type = 'button';
      button.title = `${preset.width} × ${preset.height}`;
      if (doc.canvas.width === preset.width && doc.canvas.height === preset.height) button.classList.add('selected');
      button.appendChild(span('es-size-preset-name', preset.label));
      button.appendChild(span('es-size-preset-size', `${preset.width}×${preset.height}`));
      button.addEventListener('click', () => this.store.updateCanvas({width: preset.width, height: preset.height}));
      sizes.appendChild(button);
    }
    canvas.appendChild(sizes);
    canvas.appendChild(this.numberRow('Width (px)', doc.canvas.width, value => this.store.updateCanvas({width: value})));
    canvas.appendChild(this.numberRow('Height (px)', doc.canvas.height, value => this.store.updateCanvas({height: value})));
    const frameRow = div('es-property-row');
    const frameLabel = h('label', 'es-property-label');
    frameLabel.textContent = 'Browser frame';
    frameRow.appendChild(frameLabel);
    const frameInput = h('input', 'es-checkbox');
    frameInput.type = 'checkbox';
    frameInput.checked = doc.canvas.browserFrame;
    frameInput.addEventListener('change', () => this.store.updateCanvas({browserFrame: frameInput.checked}));
    const frameWrapper = div('es-property-control');
    frameWrapper.appendChild(frameInput);
    frameRow.appendChild(frameWrapper);
    canvas.appendChild(frameRow);
    this.body.appendChild(canvas);

    const annotations = div('es-property-group');
    annotations.appendChild(div('es-property-group-title', 'Review callouts'));
    const visibleRow = div('es-property-row');
    const visibleLabel = h('label', 'es-property-label');
    visibleLabel.textContent = 'Show callouts';
    visibleRow.appendChild(visibleLabel);
    const visibleInput = h('input', 'es-checkbox');
    visibleInput.type = 'checkbox';
    visibleInput.checked = doc.canvas.annotationsVisible;
    visibleInput.addEventListener('change', () => this.store.updateCanvas({annotationsVisible: visibleInput.checked}));
    const visibleWrapper = div('es-property-control');
    visibleWrapper.appendChild(visibleInput);
    visibleRow.appendChild(visibleWrapper);
    annotations.appendChild(visibleRow);

    if (!doc.annotations.length) {
      annotations.appendChild(div('es-property-hint', 'Turn on the callout tool in the toolbar (Ctrl+M) and click the mockup to place one. Callouts are part of the mockup file and appear in the HTML and PNG exports.'));
    }
    doc.annotations.forEach((annotation, index) => {
      const row = div('es-annotation-row');
      row.appendChild(span('annotation-number', String(index + 1)));
      const input = h('input', 'es-input') as HTMLInputElement;
      input.value = annotation.text;
      input.placeholder = 'What should the reviewer look at?';
      input.addEventListener('change', () => this.store.updateAnnotation(annotation.id, {text: input.value}));
      row.appendChild(input);
      const remove = h('button', 'es-table-icon');
      remove.type = 'button';
      remove.textContent = '✕';
      remove.title = 'Remove the callout';
      remove.addEventListener('click', () => this.store.removeAnnotation(annotation.id));
      row.appendChild(remove);
      annotations.appendChild(row);
    });
    this.body.appendChild(annotations);

    const templates = div('es-property-group');
    templates.appendChild(div('es-property-group-title', 'Start over from a template'));
    for (const template of TEMPLATES) {
      const button = h('button', 'es-button block');
      button.type = 'button';
      button.textContent = template.label;
      button.title = template.description;
      button.addEventListener('click', () => {
        if (this.store.dirty && !confirm('Replace the current mockup? Unsaved changes are lost.')) return;
        this.store.replace(template.create(this.store.doc.meta.name));
      });
      templates.appendChild(button);
    }
    this.body.appendChild(templates);

    const shortcuts = div('es-property-group');
    shortcuts.appendChild(div('es-property-group-title', 'Keyboard'));
    const list = div('es-shortcuts');
    for (const [keys, what] of [
      ['Ctrl/Cmd + Z', 'Undo'],
      ['Ctrl/Cmd + Shift + Z', 'Redo'],
      ['Ctrl/Cmd + D', 'Duplicate the selection'],
      ['Delete / Backspace', 'Remove the selection'],
      ['Escape', 'Select the desktop'],
      ['Click a widget in Elements', 'Add it to the current selection'],
      ['Drag a widget onto the canvas', 'Add it to the container under the pointer'],
      ['Drop a .esmockup file on the window', 'Open it']
    ]) {
      const row = div('es-shortcut');
      row.appendChild(span('es-shortcut-keys', keys));
      row.appendChild(span('es-shortcut-text', what));
      list.appendChild(row);
    }
    shortcuts.appendChild(list);
    this.body.appendChild(shortcuts);

    const info = div('es-property-group');
    info.appendChild(div('es-property-group-title', 'File format'));
    info.appendChild(div('es-property-hint',
      `Mockups are saved as .esmockup - a JSON file (format ${doc.format}, version ${doc.formatVersion}) containing the widget tree, theme and canvas settings. Look & feel is derived from @eclipse-scout/core ${doc.meta.scoutVersion}.`));
    this.body.appendChild(info);
  }

  private simpleRow(label: string, value: string, onChange: (value: string) => void): HTMLElement {
    const row = div('es-property-row');
    const labelEl = h('label', 'es-property-label');
    labelEl.textContent = label;
    row.appendChild(labelEl);
    const input = h('input', 'es-input');
    input.type = 'text';
    input.value = value ?? '';
    input.addEventListener('change', () => onChange(input.value));
    row.appendChild(input);
    return row;
  }

  private textRow(label: string, value: string, onChange: (value: string) => void): HTMLElement {
    const row = div('es-property-row');
    const labelEl = h('label', 'es-property-label');
    labelEl.textContent = label;
    row.appendChild(labelEl);
    const area = h('textarea', 'es-input es-textarea');
    area.rows = 3;
    area.value = value ?? '';
    area.addEventListener('change', () => onChange(area.value));
    row.appendChild(area);
    return row;
  }

  private numberRow(label: string, value: number, onChange: (value: number) => void): HTMLElement {
    const row = div('es-property-row');
    const labelEl = h('label', 'es-property-label');
    labelEl.textContent = label;
    row.appendChild(labelEl);
    const input = h('input', 'es-input');
    input.type = 'number';
    input.value = String(value);
    input.addEventListener('change', () => onChange(Number(input.value) || value));
    row.appendChild(input);
    return row;
  }
}

function normalizeHex(color: string): string {
  const value = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    return '#' + value.slice(1).split('').map(c => c + c).join('');
  }
  const rgb = /^rgba?\(([^)]+)\)$/.exec(value);
  if (rgb) {
    const parts = rgb[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    if (parts.length >= 3) {
      return '#' + parts.slice(0, 3).map(n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')).join('');
    }
  }
  return '#ffffff';
}

export {findNode};
