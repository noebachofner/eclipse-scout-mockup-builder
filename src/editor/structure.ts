import {div, span} from '../render/dom';
import {getWidget} from '../model/catalog/registry';
import type {MockupNode} from '../model/types';
import type {Store} from './store';
import type {Canvas} from './canvas';
import {DRAG_MIME} from './canvas';
import {renderIcon} from '../render/icons';

/** Tree view of the widget hierarchy - the reliable way to reach nested nodes. */
export class StructureTree {
  readonly element: HTMLElement;
  private readonly body: HTMLElement;
  private collapsed = new Set<string>();

  constructor(private store: Store, private canvas: Canvas) {
    this.element = div('es-panel es-structure');
    const header = div('es-panel-header');
    header.appendChild(span('es-panel-title', 'Structure'));
    this.element.appendChild(header);
    this.body = div('es-structure-body');
    this.element.appendChild(this.body);
    store.subscribe(() => this.render());
    this.render();
  }

  render(): void {
    this.body.replaceChildren();
    this.renderNode(this.store.doc.root, 0, null);
  }

  private renderNode(node: MockupNode, depth: number, parent: MockupNode | null): void {
    const def = getWidget(node.objectType);
    const row = div('es-structure-row');
    row.style.paddingLeft = `${6 + depth * 14}px`;
    row.dataset.nodeId = node.id;
    if (node.id === this.store.selectedId) row.classList.add('selected');

    if (node.children.length) {
      const toggle = span('es-structure-toggle');
      toggle.classList.toggle('collapsed', this.collapsed.has(node.id));
      toggle.addEventListener('click', event => {
        event.stopPropagation();
        if (this.collapsed.has(node.id)) this.collapsed.delete(node.id);
        else this.collapsed.add(node.id);
        this.render();
      });
      row.appendChild(toggle);
    } else {
      row.appendChild(span('es-structure-toggle empty'));
    }

    const icon = renderIcon(def?.icon ?? 'file', 'es-structure-icon');
    if (icon) row.appendChild(icon);
    row.appendChild(span('es-structure-label', this.labelOf(node, def?.label ?? node.objectType)));
    row.appendChild(span('es-structure-type', def?.label ?? node.objectType));

    row.addEventListener('click', () => this.store.select(node.id));

    if (parent) {
      row.draggable = true;
      row.addEventListener('dragstart', event => {
        this.canvas.setDragPayload({objectType: node.objectType, nodeId: node.id});
        event.dataTransfer?.setData(DRAG_MIME, node.objectType);
        if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
      });
      row.addEventListener('dragend', () => this.canvas.setDragPayload(null));
    }

    this.body.appendChild(row);
    if (this.collapsed.has(node.id)) return;
    for (const child of node.children) this.renderNode(child, depth + 1, node);
  }

  private labelOf(node: MockupNode, fallback: string): string {
    for (const key of ['label', 'text', 'title'] as const) {
      const value = node.properties[key];
      if (typeof value === 'string' && value.trim()) return value;
    }
    return fallback;
  }
}
