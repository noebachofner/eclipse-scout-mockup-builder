import {allWidgets, CATEGORY_ORDER, type WidgetDef} from '../model/catalog/registry';
import {div, h, span} from '../render/dom';
import {renderIcon} from '../render/icons';
import type {Canvas} from './canvas';
import {DRAG_MIME} from './canvas';
import {createNode} from '../model/document';
import {findSlot} from './dropTarget';
import type {Store} from './store';
import {findNode, pathTo} from '../model/document';

/**
 * The element library. Widgets can be dragged onto the canvas or added to the
 * current selection with a click, which is faster for deep structures.
 */
export class Palette {
  readonly element: HTMLElement;
  private readonly list: HTMLElement;
  private readonly search: HTMLInputElement;
  private filter = '';

  constructor(private store: Store, private canvas: Canvas) {
    this.element = div('es-panel es-palette');
    const header = div('es-panel-header');
    header.appendChild(span('es-panel-title', 'Elements'));
    this.element.appendChild(header);

    this.search = h('input', 'es-search');
    this.search.type = 'search';
    this.search.placeholder = 'Search widgets…';
    this.search.addEventListener('input', () => {
      this.filter = this.search.value.trim().toLowerCase();
      this.renderList();
    });
    this.element.appendChild(this.search);

    this.list = div('es-palette-list');
    this.element.appendChild(this.list);
    this.renderList();
    store.subscribe((_, reason) => {
      if (reason === 'selection' || reason === 'document') this.updateEnablement();
    });
  }

  private renderList(): void {
    this.list.replaceChildren();
    const byCategory = new Map<string, WidgetDef[]>();
    for (const def of allWidgets()) {
      if (this.filter && !`${def.label} ${def.objectType} ${def.description}`.toLowerCase().includes(this.filter)) continue;
      const list = byCategory.get(def.category) ?? [];
      list.push(def);
      byCategory.set(def.category, list);
    }
    for (const category of CATEGORY_ORDER) {
      const defs = byCategory.get(category);
      if (!defs?.length) continue;
      const group = div('es-palette-group');
      group.appendChild(div('es-palette-group-title', category));
      for (const def of defs.sort((a, b) => a.label.localeCompare(b.label))) {
        group.appendChild(this.renderItem(def));
      }
      this.list.appendChild(group);
    }
    if (!this.list.childElementCount) {
      this.list.appendChild(div('es-empty-hint', 'No widget matches the search.'));
    }
    this.updateEnablement();
  }

  private renderItem(def: WidgetDef): HTMLElement {
    const item = div('es-palette-item');
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
    return item;
  }

  /** Adds the widget to the nearest container of the current selection. */
  private addToSelection(def: WidgetDef): void {
    const selectedId = this.store.selectedId ?? this.store.doc.root.id;
    const chain = pathTo(this.store.doc.root, selectedId);
    for (let i = chain.length - 1; i >= 0; i--) {
      const parent = chain[i];
      const slot = findSlot(parent, def.objectType);
      if (!slot) continue;
      const node = createNode(def.objectType);
      // Insert right after the selected sibling when dropping into its parent.
      const selected = findNode(this.store.doc.root, selectedId);
      let index = parent.children.length;
      if (selected && parent.children.includes(selected)) {
        index = parent.children.indexOf(selected) + 1;
      }
      this.store.insert(parent.id, node, slot.name, index);
      return;
    }
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
  }
}
