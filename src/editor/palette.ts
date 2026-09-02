import {allWidgets, CATEGORY_ORDER, type WidgetDef} from '../model/catalog/registry';
import {div, h, span} from '../render/dom';
import {renderIcon} from '../render/icons';
import {editorIcon} from './icons';
import type {Canvas} from './canvas';
import {DRAG_MIME} from './canvas';
import {createNode} from '../model/document';
import {findSlot} from './dropTarget';
import type {Store} from './store';
import {findNode, pathTo} from '../model/document';

export class Palette {
  readonly element: HTMLElement;
  private readonly list: HTMLElement;
  private readonly search: HTMLInputElement;
  private readonly hint: HTMLElement;
  private filter = '';
  private collapsed = new Set<string>();
  private recent: string[] = [];

  constructor(private store: Store, private canvas: Canvas) {
    this.element = div('es-panel es-palette');
    const header = div('es-panel-header');
    header.appendChild(span('es-panel-title', 'Elements'));
    this.element.appendChild(header);

    const searchWrapper = div('es-search-wrapper');
    searchWrapper.appendChild(editorIcon('search', 'es-search-icon'));
    this.search = h('input', 'es-search');
    this.search.type = 'search';
    this.search.placeholder = 'Search widgets…  (/)';
    this.search.setAttribute('aria-label', 'Search widgets');
    this.search.addEventListener('input', () => {
      this.filter = this.search.value.trim().toLowerCase();
      this.renderList();
    });
    this.search.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        this.search.value = '';
        this.filter = '';
        this.renderList();
        this.search.blur();
      }
      if (event.key === 'Enter') {
        const first = this.list.querySelector<HTMLElement>('.es-palette-item:not(.es-unavailable)');
        first?.click();
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.list.querySelector<HTMLElement>('.es-palette-item')?.focus();
      }
    });
    searchWrapper.appendChild(this.search);
    this.element.appendChild(searchWrapper);

    this.list = div('es-palette-list');
    this.element.appendChild(this.list);
    this.hint = div('es-panel-footer', 'Click to add to the selection, or drag onto the canvas.');
    this.element.appendChild(this.hint);
    this.renderList();
    store.subscribe((_, reason) => {
      if (reason === 'selection' || reason === 'document') this.updateEnablement();
    });
  }

  private renderList(): void {
    this.list.replaceChildren();
    const restoreRoving = (): void => {
      const first = this.list.querySelector<HTMLElement>('.es-palette-item');
      if (first) first.tabIndex = 0;
    };
    queueMicrotask(restoreRoving);
    const byCategory = new Map<string, WidgetDef[]>();
    for (const def of allWidgets()) {
      if (this.filter && !`${def.label} ${def.objectType} ${def.description}`.toLowerCase().includes(this.filter)) continue;
      const list = byCategory.get(def.category) ?? [];
      list.push(def);
      byCategory.set(def.category, list);
    }
    if (!this.filter && this.recent.length) {
      const recentDefs = this.recent
        .map(objectType => allWidgets().find(def => def.objectType === objectType))
        .filter((def): def is WidgetDef => !!def)
        .slice(0, 6);
      if (recentDefs.length) this.list.appendChild(this.renderGroup('Recently used', recentDefs, false));
    }

    for (const category of CATEGORY_ORDER) {
      const defs = byCategory.get(category);
      if (!defs?.length) continue;
      this.list.appendChild(this.renderGroup(category, [...defs].sort((a, b) => a.label.localeCompare(b.label)), true));
    }
    if (!this.list.childElementCount) {
      this.list.appendChild(div('es-empty-hint', `No widget matches “${this.search.value}”.`));
    }
    this.updateEnablement();
  }

  private renderGroup(title: string, defs: WidgetDef[], collapsible: boolean): HTMLElement {
    const group = div('es-palette-group');
    const isCollapsed = collapsible && !this.filter && this.collapsed.has(title);
    const header = h('button', 'es-palette-group-title');
    header.type = 'button';
    header.setAttribute('aria-expanded', String(!isCollapsed));
    if (collapsible) {
      header.appendChild(editorIcon(isCollapsed ? 'chevronRight' : 'chevronDown', 'es-palette-group-caret'));
      header.addEventListener('click', () => {
        if (this.collapsed.has(title)) this.collapsed.delete(title);
        else this.collapsed.add(title);
        this.renderList();
      });
    } else {
      header.classList.add('static');
    }
    header.appendChild(span('es-palette-group-label', title));
    header.appendChild(span('es-palette-group-count', String(defs.length)));
    group.appendChild(header);
    if (!isCollapsed) {
      for (const def of defs) group.appendChild(this.renderItem(def));
    }
    return group;
  }

  private renderItem(def: WidgetDef): HTMLElement {
    const item = h('button', 'es-palette-item');
    item.type = 'button';
    item.tabIndex = -1;
    item.draggable = true;
    item.dataset.objectType = def.objectType;
    item.title = `${def.description}\n\nobjectType: ${def.objectType}${def.javaClass ? '\nJava: ' + def.javaClass : ''}`;

    const icon = renderIcon(def.icon, 'es-palette-icon');
    if (icon) item.appendChild(icon);
    else item.appendChild(span('es-palette-icon'));
    item.appendChild(span('es-palette-label', def.label));

    item.addEventListener('dragstart', event => {
      this.canvas.setDragPayload({objectType: def.objectType});
      event.dataTransfer?.setData(DRAG_MIME, def.objectType);
      event.dataTransfer?.setData('text/plain', def.label);
      if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy';
      item.classList.add('dragging');
    });
    item.addEventListener('dragend', () => {
      this.canvas.setDragPayload(null);
      item.classList.remove('dragging');
    });
    item.addEventListener('click', () => this.addToSelection(def));
    item.addEventListener('keydown', event => this.onItemKeyDown(event, item));
    item.addEventListener('focus', () => this.setRovingItem(item));
    return item;
  }

  private onItemKeyDown(event: KeyboardEvent, item: HTMLElement): void {
    const items = [...this.list.querySelectorAll<HTMLElement>('.es-palette-item')];
    const index = items.indexOf(item);
    const go = (next: number): void => {
      event.preventDefault();
      items[Math.max(0, Math.min(items.length - 1, next))]?.focus();
    };
    switch (event.key) {
      case 'ArrowDown': return go(index + 1);
      case 'ArrowUp': return go(index - 1);
      case 'Home': return go(0);
      case 'End': return go(items.length - 1);
      case 'Escape':
        event.preventDefault();
        this.search.focus();
        return;
      default:
    }
  }

  private setRovingItem(item: HTMLElement): void {
    this.list.querySelectorAll<HTMLElement>('.es-palette-item').forEach(other => {
      other.tabIndex = other === item ? 0 : -1;
    });
  }

  private addToSelection(def: WidgetDef): void {
    const selectedId = this.store.selectedId ?? this.store.doc.root.id;
    const chain = pathTo(this.store.doc.root, selectedId);
    for (let i = chain.length - 1; i >= 0; i--) {
      const parent = chain[i];
      const slot = findSlot(parent, def.objectType);
      if (!slot) continue;
      const node = createNode(def.objectType);
      const selected = findNode(this.store.doc.root, selectedId);
      let index = parent.children.length;
      if (selected && parent.children.includes(selected)) {
        index = parent.children.indexOf(selected) + 1;
      }
      this.store.insert(parent.id, node, slot.name, index);
      this.remember(def.objectType);
      return;
    }
  }

  remember(objectType: string): void {
    this.recent = [objectType, ...this.recent.filter(type => type !== objectType)].slice(0, 8);
    this.renderList();
  }

  private updateEnablement(): void {
    const selectedId = this.store.selectedId ?? this.store.doc.root.id;
    const chain = pathTo(this.store.doc.root, selectedId);
    this.list.querySelectorAll<HTMLElement>('.es-palette-item').forEach(item => {
      const objectType = item.dataset.objectType;
      if (!objectType) return;
      const accepted = chain.some(parent => !!findSlot(parent, objectType));
      item.classList.toggle('es-unavailable', !accepted);
      item.title = item.title.replace(/\n\nCannot be added.*$/, '');
      if (!accepted) item.title += '\n\nCannot be added to the current selection - drag it onto a matching container instead.';
    });
    const available = this.list.querySelectorAll('.es-palette-item:not(.es-unavailable)').length;
    const total = this.list.querySelectorAll('.es-palette-item').length;
    this.hint.textContent = total
      ? `${available} of ${total} can be added to the selection. Click to add, or drag onto the canvas.`
      : '';
  }
}
