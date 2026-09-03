import type {MockupNode} from '../model/types';
import {getWidget, type RenderContext} from '../model/catalog/registry';
import {pathTo} from '../model/document';

export interface GridCell {
  node: MockupNode;
  x: number;
  y: number;
  w: number;
  h: number;
  weightX: number;
  weightY: number;
}

export interface GridPlacement {
  cells: GridCell[];
  columnCount: number;
  rowCount: number;
}

function num(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  return Number.isFinite(n) ? n : fallback;
}

export const FULL_WIDTH = 0;

export const INHERIT_COLUMN_COUNT = -1;

const FALLBACK_COLUMN_COUNT = 2;

export type PropReader = (node: MockupNode, name: string, fallback: number) => number;

export function resolveColumnCount(ctx: RenderContext, container: MockupNode): number {
  const chain = pathTo(ctx.doc.root, container.id);
  for (let i = chain.length - 1; i >= 0; i--) {
    const ancestor = chain[i];
    if (getWidget(ancestor.objectType)?.defaults.gridColumnCount === undefined) continue;
    const count = Number(ctx.prop<number>(ancestor, 'gridColumnCount', INHERIT_COLUMN_COUNT));
    if (count >= 0) return count;
  }
  return FALLBACK_COLUMN_COUNT;
}

const readOwnProperty: PropReader = (node, name, fallback) => num(node.properties[name], fallback);

export type FlagReader = (node: MockupNode, name: string, fallback: boolean) => boolean;

const readOwnFlag: FlagReader = (node, name, fallback) => {
  const value = node.properties[name];
  return value === undefined ? fallback : value === true;
};

export function isProcessButton(node: MockupNode, readFlag: FlagReader = readOwnFlag): boolean {
  return node.objectType === 'Button' && readFlag(node, 'processButton', true);
}

export interface FieldPartition {
  controls: MockupNode[];
  processButtons: MockupNode[];
}

export function partitionFields(nodes: MockupNode[], readFlag: FlagReader = readOwnFlag): FieldPartition {
  const controls: MockupNode[] = [];
  const processButtons: MockupNode[] = [];
  for (const node of nodes) {
    if (isProcessButton(node, readFlag)) processButtons.push(node);
    else controls.push(node);
  }
  return {controls, processButtons};
}

interface Hints {
  node: MockupNode;
  x: number;
  y: number;
  w: number;
  h: number;
  weightX: number;
  weightY: number;
}

function readHints(nodes: MockupNode[], read: PropReader): Hints[] {
  return nodes.map(node => ({
    node,
    x: read(node, 'gridDataHints.x', -1),
    y: read(node, 'gridDataHints.y', -1),
    w: read(node, 'gridDataHints.w', 1),
    h: Math.max(1, read(node, 'gridDataHints.h', 1)),
    weightX: read(node, 'gridDataHints.weightX', -1),
    weightY: read(node, 'gridDataHints.weightY', -1)
  }));
}

function toCell(hints: Hints, x: number, y: number, w: number): GridCell {
  return {
    node: hints.node,
    x,
    y,
    w,
    h: hints.h,
    weightX: hints.weightX < 0 ? Math.max(1, w) : hints.weightX,
    weightY: hints.weightY < 0 ? (hints.h >= 2 ? hints.h : 0) : hints.weightY
  };
}

function placeStatic(hints: Hints[]): GridPlacement {
  let columnCount = 1;
  let rowCount = 0;
  for (const entry of hints) {
    const w = entry.w === FULL_WIDTH ? 1 : Math.max(1, entry.w);
    columnCount = Math.max(columnCount, entry.x + w);
    rowCount = Math.max(rowCount, entry.y + entry.h);
  }
  const cells = hints.map(entry =>
    toCell(entry, entry.x, entry.y, entry.w === FULL_WIDTH ? columnCount : Math.max(1, entry.w))
  );
  return {cells, columnCount, rowCount};
}

function placeDynamic(hints: Hints[], columns: number): GridPlacement {
  const occupied = new Set<string>();
  const key = (x: number, y: number): string => `${x}:${y}`;

  const isFree = (x: number, y: number, w: number, h: number): boolean => {
    if (x + w > columns) return false;
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        if (occupied.has(key(x + dx, y + dy))) return false;
      }
    }
    return true;
  };

  const cells: GridCell[] = [];
  let cursorX = -1;
  let cursorY = 0;
  let rowCount = 0;

  for (const entry of hints) {
    const w = entry.w === FULL_WIDTH ? columns : Math.max(1, Math.min(columns, entry.w));
    do {
      cursorX++;
      if (cursorX >= columns) {
        cursorX = 0;
        cursorY++;
      }
    } while (!isFree(cursorX, cursorY, w, entry.h));

    for (let dy = 0; dy < entry.h; dy++) {
      for (let dx = 0; dx < w; dx++) occupied.add(key(cursorX + dx, cursorY + dy));
    }
    cells.push(toCell(entry, cursorX, cursorY, w));
    rowCount = cursorY + entry.h;
  }

  return {cells, columnCount: columns, rowCount};
}

export function placeInGrid(nodes: MockupNode[], columnCount: number, read: PropReader = readOwnProperty): GridPlacement {
  const columns = Math.max(1, Math.min(12, Math.round(columnCount)));
  const hints = readHints(nodes, read);
  const pinned = hints.every(entry => entry.x >= 0 && entry.y >= 0);
  return hints.length && pinned ? placeStatic(hints) : placeDynamic(hints, columns);
}

export interface GridTemplate {
  columns: string;
  rows: string;
  stretchRows: boolean;
}

export function gridTemplate(placement: GridPlacement, rowHeight: string): GridTemplate {
  const {cells, columnCount, rowCount} = placement;

  const colWeights = new Array<number>(columnCount).fill(0);
  for (const cell of cells) {
    const share = cell.weightX / cell.w;
    for (let i = 0; i < cell.w; i++) {
      colWeights[cell.x + i] = Math.max(colWeights[cell.x + i], share);
    }
  }
  const columns = colWeights
    .map(weight => (weight > 0 ? `minmax(0, ${round(weight)}fr)` : 'max-content'))
    .join(' ');

  const rowTotal = Math.max(rowCount, 1);
  const growing = new Array<boolean>(rowTotal).fill(false);
  const used = new Array<boolean>(rowTotal).fill(false);
  for (const cell of cells) {
    for (let i = 0; i < cell.h; i++) {
      used[cell.y + i] = true;
      if (cell.weightY > 0) growing[cell.y + i] = true;
    }
  }

  const rows = growing
    .map((grows, index) => {
      if (!used[index]) return rowHeight;
      return grows ? 'auto' : 'minmax(auto, max-content)';
    })
    .join(' ');

  return {columns, rows: rows || rowHeight, stretchRows: growing.some(Boolean)};
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function renderLogicalGrid(
  ctx: RenderContext,
  container: HTMLElement,
  parent: MockupNode,
  nodes: MockupNode[],
  columnCount: number
): GridPlacement {
  const read: PropReader = (child, name, fallback) => Number(ctx.prop(child, name, fallback));
  const placement = placeInGrid(nodes, columnCount, read);
  const rowHeight = logicalRowHeight(ctx);
  const template = gridTemplate(placement, rowHeight);

  container.classList.add('logical-grid');
  container.dataset.columns = String(placement.columnCount);
  container.style.gridTemplateColumns = template.columns;
  container.style.gridTemplateRows = template.rows;
  container.style.alignContent = template.stretchRows ? 'stretch' : 'start';

  for (const cell of placement.cells) {
    const el = ctx.renderNode(cell.node, parent);
    applyGridCell(ctx, el, cell, rowHeight, read);
    container.appendChild(el);
  }
  return placement;
}

export function logicalRowHeight(ctx: RenderContext): string {
  return ctx.dense
    ? 'var(--scout-logical-grid-row-height-dense)'
    : 'var(--scout-logical-grid-row-height)';
}

export function applyGridCell(
  ctx: RenderContext,
  el: HTMLElement,
  cell: GridCell,
  rowHeight: string,
  read: PropReader
): void {
  el.style.gridColumn = `${cell.x + 1} / span ${cell.w}`;
  el.style.gridRow = `${cell.y + 1} / span ${cell.h}`;
  if (!ctx.exportMode) {
    el.dataset.gridCell = `${cell.x},${cell.y},${cell.w},${cell.h},${round(cell.weightX)},${round(cell.weightY)}`;
  }
  if (cell.h > 1) {
    const target = el.querySelector<HTMLElement>(':scope > .field') ?? el;
    target.style.minHeight = `calc(${cell.h} * ${rowHeight} + ${cell.h - 1} * var(--es-grid-row-gap))`;
  }
  if (!ctx.prop<boolean>(cell.node, 'gridDataHints.fillVertical', false)) {
    const valign = read(cell.node, 'gridDataHints.verticalAlignment', -1);
    el.style.alignSelf = valign === 0 ? 'center' : valign === 1 ? 'end' : 'start';
  }
  if (!ctx.prop<boolean>(cell.node, 'gridDataHints.fillHorizontal', true)) {
    const halign = read(cell.node, 'gridDataHints.horizontalAlignment', -1);
    el.style.justifySelf = halign === 0 ? 'center' : halign === 1 ? 'end' : 'start';
  }
}

export function applyFreeBounds(el: HTMLElement, node: MockupNode, index: number): void {
  el.style.position = 'absolute';
  el.style.left = `${num(node.properties['bounds.x'], 20)}px`;
  el.style.top = `${num(node.properties['bounds.y'], 20 + index * 40)}px`;
  el.style.width = `${num(node.properties['bounds.width'], 320)}px`;
  el.style.height = `${num(node.properties['bounds.height'], 30)}px`;
  el.style.alignSelf = 'auto';
}

export function reapplyPlacement(ctx: RenderContext, parent: MockupNode, node: MockupNode, el: HTMLElement): void {
  const children = ctx.childrenOf(parent, 'fields');
  const index = children.indexOf(node);
  if (index < 0) return;

  if (ctx.prop<string>(parent, 'layoutMode', 'grid') === 'free') {
    applyFreeBounds(el, node, index);
    return;
  }
  const read: PropReader = (child, name, fallback) => Number(ctx.prop(child, name, fallback));
  const {controls} = partitionFields(children, (child, name, fallback) => ctx.prop<boolean>(child, name, fallback));
  const placement = placeInGrid(controls, resolveColumnCount(ctx, parent), read);
  const cell = placement.cells.find(entry => entry.node === node);
  if (cell) applyGridCell(ctx, el, cell, logicalRowHeight(ctx), read);
}

export function renderFreeForm(
  ctx: RenderContext,
  container: HTMLElement,
  parent: MockupNode,
  nodes: MockupNode[]
): void {
  container.classList.add('free-form');
  nodes.forEach((node, index) => {
    const el = ctx.renderNode(node, parent);
    applyFreeBounds(el, node, index);
    container.appendChild(el);
  });

  const bottom = nodes.reduce((max, node, index) => Math.max(
    max,
    num(node.properties['bounds.y'], 20 + index * 40) + num(node.properties['bounds.height'], 30)
  ), 0);
  container.style.minHeight = `${Math.max(120, bottom + 20)}px`;
}
