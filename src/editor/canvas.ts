import type {MockupNode} from '../model/types';
import {renderDocument} from '../render/render';
import {getWidget} from '../model/catalog/registry';
import {findNode, pathTo} from '../model/document';
import {createNode} from '../model/document';
import {applyTheme} from './theme';
import type {Store} from './store';
import {describeRefusal, findSlot, resolveDropTarget} from './dropTarget';
import {div} from '../render/dom';

export const DRAG_MIME = 'application/x-es-mockup-widget';

interface DragPayload {
  objectType: string;
  /** Set when an existing node is being moved rather than a new one created. */
  nodeId?: string;
}

/**
 * The mockup canvas: renders the document, handles selection, drag & drop from
 * the toolbox, in-canvas moving and (in free placement mode) dragging/resizing.
 */
export class Canvas {
  readonly element: HTMLElement;
  private readonly viewport: HTMLElement;
  private readonly page: HTMLElement;
  private readonly host: HTMLElement;
  private readonly overlay: HTMLElement;
  private readonly hint: HTMLElement;
  private nodeElements = new Map<string, HTMLElement>();
  private dragPayload: DragPayload | null = null;
  private freeDrag: {nodeId: string; mode: 'move' | 'resize'; startX: number; startY: number; origin: {x: number; y: number; width: number; height: number}} | null = null;

  constructor(private store: Store) {
    this.element = div('es-canvas');
    this.viewport = div('es-canvas-viewport');
    this.page = div('es-canvas-page');
    this.host = div('es-canvas-host');
    this.overlay = div('es-canvas-overlay');
    this.hint = div('es-drop-hint');
    this.page.appendChild(this.host);
    this.page.appendChild(this.overlay);
    this.viewport.appendChild(this.page);
    this.element.appendChild(this.viewport);
    this.element.appendChild(this.hint);

    this.attachEvents();
    store.subscribe(() => this.render());
    this.render();
  }

  private attachEvents(): void {
    this.host.addEventListener('pointerdown', e => this.onPointerDown(e));
    this.element.addEventListener('dragover', e => this.onDragOver(e));
    this.element.addEventListener('dragleave', e => this.onDragLeave(e));
    this.element.addEventListener('drop', e => this.onDrop(e));
    window.addEventListener('pointermove', e => this.onPointerMove(e));
    window.addEventListener('pointerup', () => this.onPointerUp());
  }

  /** Called by the toolbox so the canvas knows what is being dragged. */
  setDragPayload(payload: DragPayload | null): void {
    this.dragPayload = payload;
  }

  render(): void {
    const doc = this.store.doc;
    this.nodeElements.clear();
    this.host.replaceChildren();

    const rendered = renderDocument(doc, {
      onNode: (el, node) => {
        this.nodeElements.set(node.id, el);
        el.classList.add('es-node');
      }
    });
    applyTheme(rendered, doc.theme);
    this.host.appendChild(rendered);

    this.page.style.width = `${doc.canvas.width}px`;
    this.page.style.height = `${doc.canvas.height}px`;
    this.page.classList.toggle('browser-frame', doc.canvas.browserFrame);
    this.page.style.transform = `scale(${doc.canvas.zoom})`;
    this.viewport.style.width = `${doc.canvas.width * doc.canvas.zoom}px`;
    this.viewport.style.height = `${doc.canvas.height * doc.canvas.zoom}px`;

    this.updateSelection();
  }

  private updateSelection(): void {
    this.overlay.replaceChildren();
    for (const el of this.nodeElements.values()) el.classList.remove('es-selected');
    const id = this.store.selectedId;
    if (!id) return;
    const el = this.nodeElements.get(id);
    const node = findNode(this.store.doc.root, id);
    if (!el || !node) return;
    el.classList.add('es-selected');

    const pageRect = this.page.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    const zoom = this.store.doc.canvas.zoom || 1;
    const box = div('es-selection-box');
    box.style.left = `${(rect.left - pageRect.left) / zoom}px`;
    box.style.top = `${(rect.top - pageRect.top) / zoom}px`;
    box.style.width = `${rect.width / zoom}px`;
    box.style.height = `${rect.height / zoom}px`;

    const def = getWidget(node.objectType);
    const label = div('es-selection-label', def?.label ?? node.objectType);
    box.appendChild(label);

    if (this.isFreeFormChild(node)) {
      box.classList.add('free-form');
      box.appendChild(div('es-resize-handle'));
    }
    this.overlay.appendChild(box);
  }

  private isFreeFormChild(node: MockupNode): boolean {
    const chain = pathTo(this.store.doc.root, node.id);
    const parent = chain[chain.length - 2];
    return !!parent && parent.properties.layoutMode === 'free';
  }

  private nodeChainAt(target: EventTarget | null): MockupNode[] {
    const el = target instanceof HTMLElement ? target.closest<HTMLElement>('[data-node-id]') : null;
    if (!el) return [];
    const id = el.dataset.nodeId;
    if (!id) return [];
    return pathTo(this.store.doc.root, id);
  }

  private onPointerDown(event: PointerEvent): void {
    const handle = event.target instanceof HTMLElement ? event.target.closest('.es-resize-handle') : null;
    const chain = this.nodeChainAt(event.target);
    const node = chain[chain.length - 1];

    if (handle && this.store.selectedId) {
      const selected = findNode(this.store.doc.root, this.store.selectedId);
      if (selected) this.startFreeDrag(selected, 'resize', event);
      return;
    }
    if (!node) {
      this.store.select(this.store.doc.root.id);
      return;
    }
    this.store.select(node.id);
    if (this.isFreeFormChild(node)) this.startFreeDrag(node, 'move', event);
  }

  private startFreeDrag(node: MockupNode, mode: 'move' | 'resize', event: PointerEvent): void {
    const el = this.nodeElements.get(node.id);
    if (!el) return;
    event.preventDefault();
    this.freeDrag = {
      nodeId: node.id,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      origin: {
        x: Number(node.properties['bounds.x'] ?? el.offsetLeft),
        y: Number(node.properties['bounds.y'] ?? el.offsetTop),
        width: Number(node.properties['bounds.width'] ?? el.offsetWidth),
        height: Number(node.properties['bounds.height'] ?? el.offsetHeight)
      }
    };
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.freeDrag) return;
    const zoom = this.store.doc.canvas.zoom || 1;
    const dx = (event.clientX - this.freeDrag.startX) / zoom;
    const dy = (event.clientY - this.freeDrag.startY) / zoom;
    const el = this.nodeElements.get(this.freeDrag.nodeId);
    if (!el) return;
    const {origin, mode} = this.freeDrag;
    if (mode === 'move') {
      el.style.left = `${Math.round(origin.x + dx)}px`;
      el.style.top = `${Math.round(origin.y + dy)}px`;
    } else {
      el.style.width = `${Math.max(40, Math.round(origin.width + dx))}px`;
      el.style.height = `${Math.max(24, Math.round(origin.height + dy))}px`;
    }
    this.updateSelectionBoxFrom(el);
  }

  private updateSelectionBoxFrom(el: HTMLElement): void {
    const box = this.overlay.querySelector<HTMLElement>('.es-selection-box');
    if (!box) return;
    const pageRect = this.page.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    const zoom = this.store.doc.canvas.zoom || 1;
    box.style.left = `${(rect.left - pageRect.left) / zoom}px`;
    box.style.top = `${(rect.top - pageRect.top) / zoom}px`;
    box.style.width = `${rect.width / zoom}px`;
    box.style.height = `${rect.height / zoom}px`;
  }

  private onPointerUp(): void {
    if (!this.freeDrag) return;
    const {nodeId, mode} = this.freeDrag;
    const el = this.nodeElements.get(nodeId);
    this.freeDrag = null;
    if (!el) return;
    if (mode === 'move') {
      this.store.setProperties(nodeId, {
        'bounds.x': parseInt(el.style.left, 10) || 0,
        'bounds.y': parseInt(el.style.top, 10) || 0
      });
    } else {
      this.store.setProperties(nodeId, {
        'bounds.width': parseInt(el.style.width, 10) || 200,
        'bounds.height': parseInt(el.style.height, 10) || 30
      });
    }
  }

  private clearDropHighlight(): void {
    this.host.querySelectorAll('.es-drop-target').forEach(el => el.classList.remove('es-drop-target'));
    this.host.querySelectorAll('.es-drop-refused').forEach(el => el.classList.remove('es-drop-refused'));
    this.hint.classList.remove('visible', 'refused');
  }

  private onDragOver(event: DragEvent): void {
    const payload = this.dragPayload;
    if (!payload) return;
    event.preventDefault();
    this.clearDropHighlight();

    const chain = this.nodeChainAt(event.target);
    const target = resolveDropTarget(this.store.doc.root, chain, payload.objectType, payload.nodeId);
    if (!target) {
      const deepest = chain[chain.length - 1];
      this.hint.textContent = deepest ? describeRefusal(deepest, payload.objectType) : 'Drop inside the desktop.';
      this.hint.classList.add('visible', 'refused');
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'none';
      return;
    }
    if (event.dataTransfer) event.dataTransfer.dropEffect = payload.nodeId ? 'move' : 'copy';
    const parentEl = this.nodeElements.get(target.parent.id);
    if (parentEl) parentEl.classList.add('es-drop-target');
    const parentDef = getWidget(target.parent.objectType);
    this.hint.textContent = `${parentDef?.label ?? target.parent.objectType} → ${target.slot.label}`;
    this.hint.classList.add('visible');
  }

  private onDragLeave(event: DragEvent): void {
    if (event.relatedTarget && this.element.contains(event.relatedTarget as Node)) return;
    this.clearDropHighlight();
  }

  private onDrop(event: DragEvent): void {
    const payload = this.dragPayload;
    this.clearDropHighlight();
    if (!payload) return;
    event.preventDefault();

    const chain = this.nodeChainAt(event.target);
    const target = resolveDropTarget(this.store.doc.root, chain, payload.objectType, payload.nodeId);
    if (!target) return;

    const index = this.dropIndex(target.parent, target.slot.name, event);
    if (payload.nodeId) {
      this.store.move(payload.nodeId, target.parent.id, target.slot.name, index);
    } else {
      const node = createNode(payload.objectType);
      // Match the container's column count so a wide widget does not overflow.
      const def = getWidget(payload.objectType);
      if (def?.isFormField) {
        const columns = Number(target.parent.properties.gridColumnCount ?? getWidget(target.parent.objectType)?.defaults.gridColumnCount ?? 2);
        const w = Number(node.properties['gridDataHints.w'] ?? 1);
        if (w > columns) node.properties['gridDataHints.w'] = columns;
      }
      if (target.parent.properties.layoutMode === 'free') {
        const rect = this.nodeElements.get(target.parent.id)?.getBoundingClientRect();
        const zoom = this.store.doc.canvas.zoom || 1;
        node.properties['bounds.x'] = rect ? Math.max(0, Math.round((event.clientX - rect.left) / zoom)) : 20;
        node.properties['bounds.y'] = rect ? Math.max(0, Math.round((event.clientY - rect.top) / zoom)) : 20;
        node.properties['bounds.width'] = 320;
        node.properties['bounds.height'] = 30;
      }
      this.store.insert(target.parent.id, node, target.slot.name, index);
    }
    this.dragPayload = null;
  }

  /** Index in `parent.children` closest to the pointer, within the given slot. */
  private dropIndex(parent: MockupNode, slotName: string, event: DragEvent): number {
    const def = getWidget(parent.objectType);
    const defaultSlot = def?.slots[0]?.name;
    const siblings = parent.children.filter(c => (c.slot ?? defaultSlot) === slotName);
    if (!siblings.length) return parent.children.length;

    let insertBefore: MockupNode | null = null;
    let best = Number.POSITIVE_INFINITY;
    for (const sibling of siblings) {
      const el = this.nodeElements.get(sibling.id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const distance = Math.hypot(event.clientX - cx, event.clientY - cy);
      if (distance >= best) continue;
      best = distance;
      const after = event.clientY > cy || (Math.abs(event.clientY - cy) < rect.height / 2 && event.clientX > cx);
      insertBefore = after ? null : sibling;
      if (after) {
        const idx = siblings.indexOf(sibling);
        insertBefore = siblings[idx + 1] ?? null;
      }
    }
    if (!insertBefore) return parent.children.length;
    return parent.children.indexOf(insertBefore);
  }

  /** Zoom factor at which the whole mockup fits into the visible canvas area. */
  fitZoom(): number {
    const style = getComputedStyle(this.element);
    const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const availableWidth = this.element.clientWidth - padding;
    const availableHeight = this.element.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    const {width, height} = this.store.doc.canvas;
    if (!width || !height || availableWidth <= 0 || availableHeight <= 0) return 1;
    const zoom = Math.min(availableWidth / width, availableHeight / height);
    // Round down to a tidy step so the zoom label stays readable.
    return Math.max(0.1, Math.floor(zoom * 100) / 100);
  }

  /** Used by the export code so it can reuse the exact rendered tree. */
  get renderedRoot(): HTMLElement | null {
    return this.host.firstElementChild as HTMLElement | null;
  }
}

export {findSlot};
