import type {MockupNode} from '../model/types';
import {renderDocument} from '../render/render';
import {renderAnnotations} from '../render/annotations';
import {getWidget} from '../model/catalog/registry';
import {findNode, pathTo} from '../model/document';
import {createNode} from '../model/document';
import {applyTheme} from './theme';
import type {Store} from './store';
import {describeRefusal, findSlot, resolveDropTarget} from './dropTarget';
import {div} from '../render/dom';
import {showContextMenu} from './contextMenu';
import {buildWidgetMenu} from './widgetMenu';
import {renderGridInspector} from './gridInspector';

export const DRAG_MIME = 'application/x-es-mockup-widget';

/** Resize handles, named after the compass direction they sit on. */
export const RESIZE_HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const;
export type ResizeHandle = (typeof RESIZE_HANDLES)[number];
type FreeDragMode = ResizeHandle | 'move';

interface FreeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FreeDrag {
  nodeId: string;
  mode: FreeDragMode;
  startX: number;
  startY: number;
  origin: FreeBounds;
}

/** Free placement snaps to this grid unless Alt is held. */
const FREE_SNAP = 5;
const FREE_MIN_WIDTH = 40;
const FREE_MIN_HEIGHT = 24;

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
  private freeDrag: FreeDrag | null = null;
  private readonly annotationLayer: HTMLElement;
  private readonly gridLayer: HTMLElement;
  /** Draws Scout's logical grid on top of the mockup. */
  private gridInspector = false;
  /** While on, a click on the canvas drops a numbered review callout. */
  private annotateMode = false;
  private annotationDrag: {id: string; offsetX: number; offsetY: number} | null = null;

  constructor(private store: Store) {
    this.element = div('es-canvas');
    this.viewport = div('es-canvas-viewport');
    this.page = div('es-canvas-page');
    this.host = div('es-canvas-host');
    this.overlay = div('es-canvas-overlay');
    this.hint = div('es-drop-hint');
    this.annotationLayer = div('es-annotation-layer');
    this.gridLayer = div('es-grid-layer');
    this.page.appendChild(this.host);
    this.page.appendChild(this.gridLayer);
    this.page.appendChild(this.annotationLayer);
    this.page.appendChild(this.overlay);
    this.viewport.appendChild(this.page);
    this.element.appendChild(this.viewport);
    this.element.appendChild(this.hint);

    this.attachEvents();
    store.subscribe(() => this.render());
    this.render();
  }

  private attachEvents(): void {
    // Listen on the page, not on the host: the resize handles live in the
    // overlay, which is a sibling of the host.
    this.page.addEventListener('pointerdown', e => this.onPointerDown(e));
    this.page.addEventListener('contextmenu', e => this.onContextMenu(e));
    this.element.addEventListener('dragover', e => this.onDragOver(e));
    this.element.addEventListener('dragleave', e => this.onDragLeave(e));
    this.element.addEventListener('drop', e => this.onDrop(e));
    window.addEventListener('pointermove', e => this.onPointerMove(e));
    window.addEventListener('pointerup', () => this.onPointerUp());
  }

  setGridInspector(on: boolean): void {
    this.gridInspector = on;
    this.renderGridLayer();
  }

  get inspectingGrid(): boolean {
    return this.gridInspector;
  }

  private renderGridLayer(): void {
    this.gridLayer.replaceChildren();
    if (!this.gridInspector) return;
    this.gridLayer.appendChild(renderGridInspector(this.host, this.page));
  }

  /** Turns callout placement on or off. */
  setAnnotateMode(on: boolean): void {
    this.annotateMode = on;
    this.element.classList.toggle('annotating', on);
  }

  get annotating(): boolean {
    return this.annotateMode;
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

    this.renderAnnotationLayer();
    this.renderGridLayer();
    this.updateSelection();
  }

  /**
   * The callouts are drawn by the shared renderer so the editor and the exports
   * agree, then made interactive here.
   */
  private renderAnnotationLayer(): void {
    this.annotationLayer.replaceChildren();
    const layer = renderAnnotations(this.store.doc);
    if (!layer) return;
    this.annotationLayer.appendChild(layer);
    layer.querySelectorAll<HTMLElement>('.annotation-marker').forEach(marker => {
      marker.addEventListener('pointerdown', event => {
        event.preventDefault();
        event.stopPropagation();
        const id = marker.dataset.annotationId;
        const annotation = this.store.doc.annotations.find(a => a.id === id);
        if (!annotation) return;
        const zoom = this.store.doc.canvas.zoom || 1;
        const pageRect = this.page.getBoundingClientRect();
        this.annotationDrag = {
          id: annotation.id,
          offsetX: (event.clientX - pageRect.left) / zoom - annotation.x,
          offsetY: (event.clientY - pageRect.top) / zoom - annotation.y
        };
      });
    });
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
      for (const handle of RESIZE_HANDLES) {
        const el = div(`es-resize-handle es-handle-${handle}`);
        el.dataset.handle = handle;
        box.appendChild(el);
      }
      const badge = div('es-size-badge', `${Math.round(rect.width / zoom)} × ${Math.round(rect.height / zoom)}`);
      box.appendChild(badge);
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

  /**
   * The editor's own right-click menu. The browser menu offers nothing useful
   * over a mockup, so it is replaced with the actions that belong on a widget.
   */
  private onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    const chain = this.nodeChainAt(event.target);
    const node = chain[chain.length - 1] ?? this.store.doc.root;
    const parent = chain[chain.length - 2] ?? null;
    this.store.select(node.id);
    showContextMenu(buildWidgetMenu(this.store, node, parent), event.clientX, event.clientY);
  }

  /** Canvas coordinates of a pointer event, in the mockup's own pixel space. */
  private pagePoint(event: PointerEvent): {x: number; y: number} {
    const zoom = this.store.doc.canvas.zoom || 1;
    const rect = this.page.getBoundingClientRect();
    return {x: (event.clientX - rect.left) / zoom, y: (event.clientY - rect.top) / zoom};
  }

  private onPointerDown(event: PointerEvent): void {
    if (this.annotateMode && !this.annotationDrag) {
      event.preventDefault();
      const {x, y} = this.pagePoint(event);
      this.store.addAnnotation(x - 14, y - 14);
      return;
    }
    const handle = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('.es-resize-handle') : null;
    const chain = this.nodeChainAt(event.target);
    const node = chain[chain.length - 1];

    if (handle && this.store.selectedId) {
      const selected = findNode(this.store.doc.root, this.store.selectedId);
      const direction = handle.dataset.handle as ResizeHandle | undefined;
      if (selected && direction) this.startFreeDrag(selected, direction, event);
      return;
    }
    if (!node) {
      this.store.select(this.store.doc.root.id);
      return;
    }
    this.store.select(node.id);
    if (this.isFreeFormChild(node)) this.startFreeDrag(node, 'move', event);
  }

  private startFreeDrag(node: MockupNode, mode: FreeDragMode, event: PointerEvent): void {
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
    document.body.classList.add('es-dragging');
    this.element.style.cursor = mode === 'move' ? 'grabbing' : `${mode}-resize`;
  }

  private onPointerMove(event: PointerEvent): void {
    if (this.annotationDrag) {
      const {x, y} = this.pagePoint(event);
      const marker = this.annotationLayer.querySelector<HTMLElement>(`[data-annotation-id="${this.annotationDrag.id}"]`);
      if (marker) {
        marker.style.left = `${Math.round(x - this.annotationDrag.offsetX)}px`;
        marker.style.top = `${Math.round(y - this.annotationDrag.offsetY)}px`;
      }
      return;
    }
    if (!this.freeDrag) return;
    const el = this.nodeElements.get(this.freeDrag.nodeId);
    if (!el) return;
    const bounds = this.computeDragBounds(event);
    el.style.left = `${bounds.x}px`;
    el.style.top = `${bounds.y}px`;
    el.style.width = `${bounds.width}px`;
    el.style.height = `${bounds.height}px`;
    this.updateSelectionBoxFrom(el, bounds);
  }

  /**
   * Position and size while dragging. Movement snaps to a small grid so
   * free-form sketches stay tidy; holding Alt drags pixel by pixel.
   */
  private computeDragBounds(event: PointerEvent): FreeBounds {
    const drag = this.freeDrag!;
    const zoom = this.store.doc.canvas.zoom || 1;
    const step = event.altKey ? 1 : FREE_SNAP;
    const snap = (value: number): number => Math.round(value / step) * step;
    const dx = (event.clientX - drag.startX) / zoom;
    const dy = (event.clientY - drag.startY) / zoom;
    const {origin, mode} = drag;

    if (mode === 'move') {
      return {
        x: Math.max(0, snap(origin.x + dx)),
        y: Math.max(0, snap(origin.y + dy)),
        width: origin.width,
        height: origin.height
      };
    }

    let {x, y, width, height} = origin;
    if (mode.includes('e')) width = origin.width + dx;
    if (mode.includes('s')) height = origin.height + dy;
    if (mode.includes('w')) {
      width = origin.width - dx;
      x = origin.x + dx;
    }
    if (mode.includes('n')) {
      height = origin.height - dy;
      y = origin.y + dy;
    }

    // Clamp against the minimum size, keeping the opposite edge in place.
    if (width < FREE_MIN_WIDTH) {
      if (mode.includes('w')) x = origin.x + origin.width - FREE_MIN_WIDTH;
      width = FREE_MIN_WIDTH;
    }
    if (height < FREE_MIN_HEIGHT) {
      if (mode.includes('n')) y = origin.y + origin.height - FREE_MIN_HEIGHT;
      height = FREE_MIN_HEIGHT;
    }
    return {
      x: Math.max(0, snap(x)),
      y: Math.max(0, snap(y)),
      width: snap(width),
      height: snap(height)
    };
  }

  private updateSelectionBoxFrom(el: HTMLElement, bounds?: FreeBounds): void {
    const box = this.overlay.querySelector<HTMLElement>('.es-selection-box');
    if (!box) return;
    const pageRect = this.page.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    const zoom = this.store.doc.canvas.zoom || 1;
    box.style.left = `${(rect.left - pageRect.left) / zoom}px`;
    box.style.top = `${(rect.top - pageRect.top) / zoom}px`;
    box.style.width = `${rect.width / zoom}px`;
    box.style.height = `${rect.height / zoom}px`;
    const badge = box.querySelector('.es-size-badge');
    if (badge) {
      badge.textContent = bounds
        ? `${Math.round(bounds.width)} × ${Math.round(bounds.height)}`
        : `${Math.round(rect.width / zoom)} × ${Math.round(rect.height / zoom)}`;
    }
  }

  private onPointerUp(): void {
    if (this.annotationDrag) {
      const marker = this.annotationLayer.querySelector<HTMLElement>(`[data-annotation-id="${this.annotationDrag.id}"]`);
      if (marker) {
        this.store.updateAnnotation(this.annotationDrag.id, {
          x: parseFloat(marker.style.left) || 0,
          y: parseFloat(marker.style.top) || 0
        });
      }
      this.annotationDrag = null;
      return;
    }
    if (!this.freeDrag) return;
    const {nodeId, mode} = this.freeDrag;
    const el = this.nodeElements.get(nodeId);
    this.freeDrag = null;
    document.body.classList.remove('es-dragging');
    this.element.style.cursor = '';
    if (!el) return;
    const bounds = {
      'bounds.x': parseInt(el.style.left, 10) || 0,
      'bounds.y': parseInt(el.style.top, 10) || 0,
      'bounds.width': parseInt(el.style.width, 10) || FREE_MIN_WIDTH,
      'bounds.height': parseInt(el.style.height, 10) || FREE_MIN_HEIGHT
    };
    // A pure move must not touch the size, and vice versa, so that a stray
    // pixel from the measured layout never sneaks into the document.
    this.store.setProperties(nodeId, mode === 'move'
      ? {'bounds.x': bounds['bounds.x'], 'bounds.y': bounds['bounds.y']}
      : bounds);
  }

  /**
   * Arrow keys nudge the selected free-form widget, Shift+arrows resize it.
   * Returns true when the key was consumed.
   */
  nudgeSelection(key: string, resize: boolean, coarse: boolean): boolean {
    const id = this.store.selectedId;
    if (!id) return false;
    const node = findNode(this.store.doc.root, id);
    if (!node || !this.isFreeFormChild(node)) return false;
    const el = this.nodeElements.get(id);
    if (!el) return false;

    const step = coarse ? FREE_SNAP : 1;
    const dx = key === 'ArrowLeft' ? -step : key === 'ArrowRight' ? step : 0;
    const dy = key === 'ArrowUp' ? -step : key === 'ArrowDown' ? step : 0;
    if (!dx && !dy) return false;

    const x = Number(node.properties['bounds.x'] ?? el.offsetLeft);
    const y = Number(node.properties['bounds.y'] ?? el.offsetTop);
    const width = Number(node.properties['bounds.width'] ?? el.offsetWidth);
    const height = Number(node.properties['bounds.height'] ?? el.offsetHeight);

    if (resize) {
      this.store.setProperties(id, {
        'bounds.width': Math.max(FREE_MIN_WIDTH, width + dx),
        'bounds.height': Math.max(FREE_MIN_HEIGHT, height + dy)
      });
    } else {
      this.store.setProperties(id, {
        'bounds.x': Math.max(0, x + dx),
        'bounds.y': Math.max(0, y + dy)
      });
    }
    return true;
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

  /**
   * Reads the rendered position and size of every child of `parentId`, relative
   * to that parent. Used when a container is switched to free placement so the
   * children keep the position the logical grid gave them instead of all
   * collapsing onto the same default spot.
   */
  measureChildBounds(parentId: string): Record<string, Record<string, number>> {
    const parent = findNode(this.store.doc.root, parentId);
    const parentEl = this.nodeElements.get(parentId);
    if (!parent || !parentEl) return {};
    // The children sit in the container's body, not in its outer element.
    const body = parentEl.querySelector<HTMLElement>('.logical-grid, .free-form') ?? parentEl;
    const bodyRect = body.getBoundingClientRect();
    const zoom = this.store.doc.canvas.zoom || 1;
    const result: Record<string, Record<string, number>> = {};
    for (const child of parent.children) {
      const el = this.nodeElements.get(child.id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      result[child.id] = {
        'bounds.x': Math.round((rect.left - bodyRect.left) / zoom),
        'bounds.y': Math.round((rect.top - bodyRect.top) / zoom),
        'bounds.width': Math.round(rect.width / zoom),
        'bounds.height': Math.round(rect.height / zoom)
      };
    }
    return result;
  }

  /** Re-measures the selection frame after the surrounding layout moved. */
  refreshOverlay(): void {
    this.renderGridLayer();
    this.updateSelection();
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
