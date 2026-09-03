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

export function placeInGrid(nodes: MockupNode[], columnCount: number, read: PropReader = readOwnProperty): GridPlacement {
  const columns = Math.max(1, Math.min(12, Math.round(columnCount)));
  const occupied = new Set<string>();
  const cells: GridCell[] = [];
  const key = (x: number, y: number): string => `${x}:${y}`;

  const fits = (x: number, y: number, w: number, h: number): boolean => {
    if (x + w > columns) return false;
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        if (occupied.has(key(x + dx, y + dy))) return false;
      }
    }
    return true;
  };
  const occupy = (x: number, y: number, w: number, h: number): void => {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) occupied.add(key(x + dx, y + dy));
    }
  };

  let cursorX = 0;
  let cursorY = 0;

  for (const node of nodes) {
    const requested = read(node, 'gridDataHints.w', 1);
    const w = requested === FULL_WIDTH ? columns : Math.max(1, Math.min(columns, requested));
    const h = Math.max(1, read(node, 'gridDataHints.h', 1));
    const pinnedX = read(node, 'gridDataHints.x', -1);
    const pinnedY = read(node, 'gridDataHints.y', -1);

    let x: number;
    let y: number;
    if (pinnedX >= 0 && pinnedY >= 0) {
      x = Math.min(pinnedX, columns - 1);
      y = pinnedY;
    } else {
      x = cursorX;
      y = cursorY;
      while (!fits(x, y, w, h)) {
        x++;
        if (x + w > columns) {
          x = 0;
          y++;
        }
      }
      cursorX = x + w;
      cursorY = y;
      if (cursorX >= columns) {
        cursorX = 0;
        cursorY = y + 1;
      }
    }
    occupy(x, y, w, h);

    const rawWeightX = read(node, 'gridDataHints.weightX', -1);
    const rawWeightY = read(node, 'gridDataHints.weightY', -1);
    cells.push({
      node,
      x,
      y,
      w,
      h,
      weightX: rawWeightX < 0 ? Math.max(1, w) : rawWeightX,
      weightY: rawWeightY < 0 ? (h >= 2 ? h : 0) : rawWeightY
    });
  }

  const rowCount = cells.reduce((max, c) => Math.max(max, c.y + c.h), 0);
  return {cells, columnCount: columns, rowCount};
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
  const placement = placeInGrid(children, resolveColumnCount(ctx, parent), read);
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
