import type {MockupNode} from '../model/types';
import {createRenderContext, renderDocument} from '../render/render';
import {renderAnnotations} from '../render/annotations';
import {getWidget, type RenderContext} from '../model/catalog/registry';
import {containsNode, findNode, findParent, pathTo} from '../model/document';
import {createNode} from '../model/document';
import {applyTheme} from './theme';
import type {Store} from './store';
import {describeRefusal, findSlot, resolveDropTarget} from './dropTarget';
import {div} from '../render/dom';
import {showContextMenu} from './contextMenu';
import {buildWidgetMenu} from './widgetMenu';
import {renderGridInspector} from './gridInspector';
import {computeSnap, type Rect} from './alignment';
import {reapplyPlacement} from '../render/layout';

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
  private marquee: {startX: number; startY: number; band: HTMLElement} | null = null;
  /** Bounds of the other selected widgets when a group drag started. */
  private groupDrag: Array<{id: string; el: HTMLElement; origin: FreeBounds}> = [];
  private readonly annotationLayer: HTMLElement;
  private readonly gridLayer: HTMLElement;
  private readonly guideLayer: HTMLElement;
  /** Draws Scout's logical grid on top of the mockup. */
  private gridInspector = false;
  /** While on, a click on the canvas drops a numbered review callout. */
  private annotateMode = false;
  private annotationDrag: {id: string; offsetX: number; offsetY: number} | null = null;
  private context: RenderContext | null = null;

  constructor(private store: Store) {
    this.element = div('es-canvas');
    this.viewport = div('es-canvas-viewport');
    this.page = div('es-canvas-page');
    this.host = div('es-canvas-host');
    this.overlay = div('es-canvas-overlay');
    this.hint = div('es-drop-hint');
    this.annotationLayer = div('es-annotation-layer');
    this.gridLayer = div('es-grid-layer');
    this.guideLayer = div('es-guide-layer');
    this.page.appendChild(this.host);
    this.page.appendChild(this.gridLayer);
    this.page.appendChild(this.guideLayer);
    this.page.appendChild(this.annotationLayer);
    this.page.appendChild(this.overlay);
    this.viewport.appendChild(this.page);
    this.element.appendChild(this.viewport);
    this.element.appendChild(this.hint);

    this.attachEvents();
    store.subscribe((_, reason, changedIds) => this.render(reason === 'document' ? changedIds : undefined));
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
    window.addEventListener('pointerup', e => this.onPointerUp(e));
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

  /**
   * Redraws the canvas.
   *
   * `changedIds` names the widgets whose own properties changed. Only the
   * container around each of them is rebuilt, because a container is where a
   * child's grid hints are turned into a placement - that makes it the smallest
   * unit that is still correct. Anything structural redraws the document.
   */
  render(changedIds?: string[]): void {
    if (changedIds?.length && this.renderPartial(changedIds)) {
      this.renderAnnotationLayer();
      this.renderGridLayer();
      this.updateSelection();
      return;
    }

    const doc = this.store.doc;
    this.nodeElements.clear();
    this.host.replaceChildren();

    this.context = createRenderContext(doc, {
      onNode: (el, node) => {
        this.nodeElements.set(node.id, el);
        el.classList.add('es-node');
      }
    });
    const rendered = renderDocument(doc, {context: this.context});
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
   * Rebuilds the container of every changed widget. Returns false when that is
   * not possible - no context yet, the root itself changed, or a container that
   * is not on screen - in which case the caller falls back to a full render.
   */
  private renderPartial(changedIds: string[]): boolean {
    const ctx = this.context;
    if (!ctx || ctx.doc !== this.store.doc) return false;

    const containers: MockupNode[] = [];
    for (const id of changedIds) {
      const chain = pathTo(this.store.doc.root, id);
      const parent = chain[chain.length - 2];
      if (!parent || !this.nodeElements.has(parent.id)) return false;
      if (!containers.some(known => known.id === parent.id)) containers.push(parent);
    }
    // A container nested inside another one on the list is rebuilt with it.
    const outermost = containers.filter(candidate =>
      !containers.some(other => other !== candidate && containsNode(other, candidate.id)));

    for (const container of outermost) {
      const chain = pathTo(this.store.doc.root, container.id);
      const parent = chain[chain.length - 2] ?? null;
      const oldElement = this.nodeElements.get(container.id);
      if (!oldElement) return false;
      const element = ctx.renderNode(container, parent);
      if (parent) reapplyPlacement(ctx, parent, container, element);
      oldElement.replaceWith(element);
    }
    return true;
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
    const ids = this.store.selectedIds;
    if (!ids.length) return;

    const primary = this.store.selectedId;
    for (const id of ids) {
      const el = this.nodeElements.get(id);
      const node = findNode(this.store.doc.root, id);
      if (!el || !node) continue;
      el.classList.add('es-selected');
      this.overlay.appendChild(this.selectionBox(el, node, id === primary, ids.length > 1));
    }
  }

  private selectionBox(el: HTMLElement, node: MockupNode, primary: boolean, multiple: boolean): HTMLElement {
    const pageRect = this.page.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    const zoom = this.store.doc.canvas.zoom || 1;
    const box = div(`es-selection-box${primary ? '' : ' secondary'}`);
    box.dataset.nodeId = node.id;
    box.style.left = `${(rect.left - pageRect.left) / zoom}px`;
    box.style.top = `${(rect.top - pageRect.top) / zoom}px`;
    box.style.width = `${rect.width / zoom}px`;
    box.style.height = `${rect.height / zoom}px`;

    const def = getWidget(node.objectType);
    if (primary) {
      const label = div('es-selection-label', multiple
        ? `${def?.label ?? node.objectType} +${this.store.selectedIds.length - 1}`
        : def?.label ?? node.objectType);
      box.appendChild(label);
    }

    if (this.isFreeFormChild(node)) {
      box.classList.add('free-form');
      // Resize handles belong to the primary widget only: resizing a whole
      // selection at once would need a different, and much less predictable,
      // set of rules.
      if (primary && !multiple) {
        for (const handle of RESIZE_HANDLES) {
          const el = div(`es-resize-handle es-handle-${handle}`);
          el.dataset.handle = handle;
          box.appendChild(el);
        }
        box.appendChild(div('es-size-badge', `${Math.round(rect.width / zoom)} × ${Math.round(rect.height / zoom)}`));
      }
    }
    return box;
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
    // Right-clicking inside an existing selection keeps it, so the align and
    // distribute entries stay reachable; anywhere else it selects that widget.
    if (!this.store.isSelected(node.id)) this.store.select(node.id);
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
      this.startMarquee(event);
      return;
    }
    // Pressing on a container selects it and, if the pointer then moves, pulls
    // a rubber band. A container fills its whole area, so without this the band
    // could only ever be started outside the mockup.
    if (!this.isFreeFormChild(node)) {
      this.store.select(node.id);
      this.startMarquee(event);
      return;
    }
    if (event.shiftKey && this.isFreeFormChild(node)) {
      event.preventDefault();
      this.store.toggleSelection(node.id);
      return;
    }
    // Dragging one widget of a selection moves the whole selection, the way it
    // works in every drawing tool.
    if (!this.store.isSelected(node.id)) this.store.select(node.id);
    if (this.isFreeFormChild(node)) this.startFreeDrag(node, 'move', event);
  }

  /**
   * Rubber band selection. Only free-form widgets can be selected this way -
   * a widget in a logical grid has no position of its own to act on.
   */
  private startMarquee(event: PointerEvent): void {
    const start = this.pagePoint(event);
    const band = div('es-marquee');
    this.overlay.appendChild(band);
    this.marquee = {startX: start.x, startY: start.y, band};
    this.element.style.cursor = 'crosshair';
  }

  private updateMarquee(event: PointerEvent): void {
    if (!this.marquee) return;
    const {x, y} = this.pagePoint(event);
    const left = Math.min(x, this.marquee.startX);
    const top = Math.min(y, this.marquee.startY);
    this.marquee.band.style.left = `${left}px`;
    this.marquee.band.style.top = `${top}px`;
    this.marquee.band.style.width = `${Math.abs(x - this.marquee.startX)}px`;
    this.marquee.band.style.height = `${Math.abs(y - this.marquee.startY)}px`;
  }

  private finishMarquee(event: PointerEvent): void {
    if (!this.marquee) return;
    const {x, y} = this.pagePoint(event);
    const band = {
      left: Math.min(x, this.marquee.startX),
      top: Math.min(y, this.marquee.startY),
      right: Math.max(x, this.marquee.startX),
      bottom: Math.max(y, this.marquee.startY)
    };
    this.marquee.band.remove();
    this.marquee = null;
    this.element.style.cursor = '';
    if (band.right - band.left < 4 && band.bottom - band.top < 4) return;

    const pageRect = this.page.getBoundingClientRect();
    const zoom = this.store.doc.canvas.zoom || 1;
    const hits: string[] = [];
    for (const [id, el] of this.nodeElements) {
      const node = findNode(this.store.doc.root, id);
      if (!node || !this.isFreeFormChild(node)) continue;
      const rect = el.getBoundingClientRect();
      const left = (rect.left - pageRect.left) / zoom;
      const top = (rect.top - pageRect.top) / zoom;
      // Fully enclosed, not merely touched: a band that grabs everything it
      // brushes past is impossible to aim.
      if (left >= band.left && top >= band.top
        && left + rect.width / zoom <= band.right
        && top + rect.height / zoom <= band.bottom) {
        hits.push(id);
      }
    }
    if (hits.length) this.store.setSelection(hits);
  }

  private startFreeDrag(node: MockupNode, mode: FreeDragMode, event: PointerEvent): void {
    const el = this.nodeElements.get(node.id);
    if (!el) return;
    event.preventDefault();

    // A move carries the rest of the selection along; a resize never does.
    this.groupDrag = mode !== 'move' ? [] : this.store.selectedIds
      .filter(id => id !== node.id)
      .map(id => ({id, el: this.nodeElements.get(id), node: findNode(this.store.doc.root, id)}))
      .filter((entry): entry is {id: string; el: HTMLElement; node: MockupNode} => !!entry.el && !!entry.node && this.isFreeFormChild(entry.node))
      .map(entry => ({
        id: entry.id,
        el: entry.el,
        origin: {
          x: Number(entry.node.properties['bounds.x'] ?? entry.el.offsetLeft),
          y: Number(entry.node.properties['bounds.y'] ?? entry.el.offsetTop),
          width: Number(entry.node.properties['bounds.width'] ?? entry.el.offsetWidth),
          height: Number(entry.node.properties['bounds.height'] ?? entry.el.offsetHeight)
        }
      }));

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
    if (this.marquee) {
      this.updateMarquee(event);
      return;
    }
    if (!this.freeDrag) return;
    const el = this.nodeElements.get(this.freeDrag.nodeId);
    if (!el) return;
    let bounds = this.computeDragBounds(event);

    // Snap the dragged widget onto its neighbours, unless Alt asks for exact
    // pixels. A group drag snaps on the widget under the pointer and the rest
    // follows by the same offset, so their relative positions never change.
    this.guideLayer.replaceChildren();
    if (!event.altKey) {
      const snap = computeSnap(bounds, this.siblingRects(this.freeDrag.nodeId), this.containerSize(this.freeDrag.nodeId));
      if (this.freeDrag.mode === 'move') {
        bounds = {...bounds, x: bounds.x + snap.dx, y: bounds.y + snap.dy};
      } else {
        bounds = {...bounds, width: bounds.width + snap.dx, height: bounds.height + snap.dy};
      }
      this.drawGuides(this.freeDrag.nodeId, snap.verticals, snap.horizontals);
    }

    el.style.left = `${bounds.x}px`;
    el.style.top = `${bounds.y}px`;
    el.style.width = `${bounds.width}px`;
    el.style.height = `${bounds.height}px`;

    const dx = bounds.x - this.freeDrag.origin.x;
    const dy = bounds.y - this.freeDrag.origin.y;
    for (const entry of this.groupDrag) {
      entry.el.style.left = `${Math.max(0, entry.origin.x + dx)}px`;
      entry.el.style.top = `${Math.max(0, entry.origin.y + dy)}px`;
    }
    this.updateSelectionBoxes(bounds);
  }

  /** Bounds of the free-form siblings of `nodeId`, in container coordinates. */
  private siblingRects(nodeId: string): Rect[] {
    const parent = findParent(this.store.doc.root, nodeId);
    if (!parent) return [];
    const moving = new Set([nodeId, ...this.groupDrag.map(entry => entry.id)]);
    return parent.children
      .filter(child => !moving.has(child.id))
      .map(child => {
        const el = this.nodeElements.get(child.id);
        return {
          x: Number(child.properties['bounds.x'] ?? el?.offsetLeft ?? 0),
          y: Number(child.properties['bounds.y'] ?? el?.offsetTop ?? 0),
          width: Number(child.properties['bounds.width'] ?? el?.offsetWidth ?? 0),
          height: Number(child.properties['bounds.height'] ?? el?.offsetHeight ?? 0)
        };
      });
  }

  private containerSize(nodeId: string): {width: number; height: number} {
    const parent = findParent(this.store.doc.root, nodeId);
    const el = parent ? this.nodeElements.get(parent.id) : null;
    const body = el?.querySelector<HTMLElement>('.free-form') ?? el;
    return {width: body?.clientWidth ?? 0, height: body?.clientHeight ?? 0};
  }

  /** Guide lines are drawn in page coordinates, over the container. */
  private drawGuides(nodeId: string, verticals: number[], horizontals: number[]): void {
    if (!verticals.length && !horizontals.length) return;
    const parent = findParent(this.store.doc.root, nodeId);
    const container = parent ? this.nodeElements.get(parent.id) : null;
    const body = container?.querySelector<HTMLElement>('.free-form') ?? container;
    if (!body) return;
    const pageRect = this.page.getBoundingClientRect();
    const rect = body.getBoundingClientRect();
    const zoom = this.store.doc.canvas.zoom || 1;
    const left = (rect.left - pageRect.left) / zoom;
    const top = (rect.top - pageRect.top) / zoom;

    for (const x of verticals) {
      const line = div('es-guide vertical');
      line.style.left = `${left + x}px`;
      line.style.top = `${top}px`;
      line.style.height = `${rect.height / zoom}px`;
      this.guideLayer.appendChild(line);
    }
    for (const y of horizontals) {
      const line = div('es-guide horizontal');
      line.style.top = `${top + y}px`;
      line.style.left = `${left}px`;
      line.style.width = `${rect.width / zoom}px`;
      this.guideLayer.appendChild(line);
    }
  }

  /** Re-measures every selection box after a drag moved the elements. */
  private updateSelectionBoxes(bounds?: FreeBounds): void {
    const pageRect = this.page.getBoundingClientRect();
    const zoom = this.store.doc.canvas.zoom || 1;
    this.overlay.querySelectorAll<HTMLElement>('.es-selection-box').forEach(box => {
      const el = box.dataset.nodeId ? this.nodeElements.get(box.dataset.nodeId) : null;
      if (!el) return;
      const rect = el.getBoundingClientRect();
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
    });
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

  private onPointerUp(event?: PointerEvent): void {
    if (this.marquee) {
      if (event) this.finishMarquee(event);
      return;
    }
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
    this.guideLayer.replaceChildren();
    document.body.classList.remove('es-dragging');
    this.element.style.cursor = '';
    if (!el) return;
    const bounds = {
      'bounds.x': parseInt(el.style.left, 10) || 0,
      'bounds.y': parseInt(el.style.top, 10) || 0,
      'bounds.width': parseInt(el.style.width, 10) || FREE_MIN_WIDTH,
      'bounds.height': parseInt(el.style.height, 10) || FREE_MIN_HEIGHT
    };
    // One gesture, one undo step - including every other widget a group move
    // carried along. A pure move must not touch the size, and vice versa, so
    // that a stray pixel from the measured layout never sneaks into the
    // document.
    const changes: Record<string, Record<string, number>> = {
      [nodeId]: mode === 'move'
        ? {'bounds.x': bounds['bounds.x'], 'bounds.y': bounds['bounds.y']}
        : bounds
    };
    for (const entry of this.groupDrag) {
      changes[entry.id] = {
        'bounds.x': parseInt(entry.el.style.left, 10) || 0,
        'bounds.y': parseInt(entry.el.style.top, 10) || 0
      };
    }
    this.groupDrag = [];
    this.store.setPropertiesForNodes(changes);
  }

  /**
   * Walks the widget tree from the canvas: left and right to the previous and
   * next sibling, up to the parent, down to the first child. Only reached when
   * the arrows had nothing to nudge, so free placement keeps them for moving.
   */
  navigateSelection(key: string): boolean {
    const id = this.store.selectedId;
    if (!id) return false;
    const chain = pathTo(this.store.doc.root, id);
    const node = chain[chain.length - 1];
    const parent = chain[chain.length - 2];
    if (!node) return false;

    const siblings = parent?.children ?? [];
    const index = siblings.indexOf(node);
    let next: MockupNode | undefined;
    switch (key) {
      case 'ArrowUp':
        next = parent;
        break;
      case 'ArrowDown':
        next = node.children[0];
        break;
      case 'ArrowLeft':
        next = siblings[index - 1];
        break;
      case 'ArrowRight':
        next = siblings[index + 1];
        break;
      default:
        return false;
    }
    if (!next) return true;
    this.store.select(next.id);
    this.nodeElements.get(next.id)?.scrollIntoView({block: 'nearest', inline: 'nearest'});
    return true;
  }

  /**
   * Arrow keys nudge the selected free-form widget, Shift+arrows resize it.
   * Returns true when the key was consumed.
   */
  nudgeSelection(key: string, resize: boolean, coarse: boolean): boolean {
    const ids = this.store.selectedIds.filter(id => {
      const node = findNode(this.store.doc.root, id);
      return !!node && this.isFreeFormChild(node);
    });
    if (!ids.length) return false;

    const step = coarse ? 5 : 1;
    const dx = key === 'ArrowLeft' ? -step : key === 'ArrowRight' ? step : 0;
    const dy = key === 'ArrowUp' ? -step : key === 'ArrowDown' ? step : 0;
    if (!dx && !dy) return false;

    const changes: Record<string, Record<string, number>> = {};
    for (const id of ids) {
      const node = findNode(this.store.doc.root, id);
      const el = this.nodeElements.get(id);
      if (!node || !el) continue;
      const x = Number(node.properties['bounds.x'] ?? el.offsetLeft);
      const y = Number(node.properties['bounds.y'] ?? el.offsetTop);
      const width = Number(node.properties['bounds.width'] ?? el.offsetWidth);
      const height = Number(node.properties['bounds.height'] ?? el.offsetHeight);
      // Shift resizes instead of moving; a selection is resized as a set of
      // individual widgets, which is the only reading that keeps them apart.
      changes[id] = resize
        ? {'bounds.width': Math.max(FREE_MIN_WIDTH, width + dx), 'bounds.height': Math.max(FREE_MIN_HEIGHT, height + dy)}
        : {'bounds.x': Math.max(0, x + dx), 'bounds.y': Math.max(0, y + dy)};
    }
    this.store.setPropertiesForNodes(changes);
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
