/**
 * Scout's logical grid, expressed with CSS grid.
 *
 * Scout lays a GroupBox body out with `LogicalGridLayout`: fields are placed
 * left-to-right into `gridColumnCount` columns, wrapping when a field does not
 * fit; every field occupies `w` columns and `h` rows. Column and row growth is
 * driven by `weightX` / `weightY`, which default to "inherit":
 *
 *   weightX < 0  ->  max(1, w)                 (LogicalGridData.validate)
 *   weightY < 0  ->  h >= 2 ? h : 0            (LogicalGridData._inheritWeightY)
 *
 * The same rules are applied here, then translated into `grid-template-columns`
 * / `grid-template-rows`, which reproduces Scout's result for the layouts a
 * mockup can express while keeping the DOM simple enough to export.
 */
import type {MockupNode} from '../model/types';
import type {RenderContext} from '../model/catalog/registry';

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

/**
 * Places nodes into the logical grid the way Scout's `HorizontalGroupBoxBodyGrid`
 * does: sequential fill, wrapping to the next row when the field does not fit.
 * Fields may pin themselves with an explicit `gridDataHints.x/y`.
 */
export type PropReader = (node: MockupNode, name: string, fallback: number) => number;

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
    const w = Math.max(1, Math.min(columns, read(node, 'gridDataHints.w', 1)));
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
      // LogicalGridData.validate()
      weightX: rawWeightX < 0 ? Math.max(1, w) : rawWeightX,
      // LogicalGridData._inheritWeightY() base case
      weightY: rawWeightY < 0 ? (h >= 2 ? h : 0) : rawWeightY
    });
  }

  const rowCount = cells.reduce((max, c) => Math.max(max, c.y + c.h), 0);
  return {cells, columnCount: columns, rowCount};
}

export interface GridTemplate {
  columns: string;
  rows: string;
  /** True when at least one row should absorb the surplus height. */
  stretchRows: boolean;
}

/**
 * Turns a placement into `grid-template-columns` / `grid-template-rows`.
 *
 * Rows are content sized so a widget can never be crushed into an overlapping
 * neighbour. Rows that Scout would let grow (`weightY > 0`, i.e. anything
 * spanning two or more logical rows) are left `auto`, and the container is set
 * to `align-content: stretch`, which makes CSS hand the surplus height to
 * exactly those tracks. Rows that must not grow are capped with `max-content`
 * so the stretch skips them.
 *
 * `fr` units are deliberately not used: an item spanning several `fr` rows is
 * not guaranteed to contribute its minimum height to them, which shows up as
 * content spilling out of its cell.
 */
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

  const growing = new Array<boolean>(Math.max(rowCount, 1)).fill(false);
  for (const cell of cells) {
    if (cell.weightY <= 0) continue;
    for (let i = 0; i < cell.h; i++) growing[cell.y + i] = true;
  }
  const rows = growing
    .map(grows => (grows ? `minmax(${rowHeight}, auto)` : `minmax(${rowHeight}, max-content)`))
    .join(' ');

  return {columns, rows: rows || rowHeight, stretchRows: growing.some(Boolean)};
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/**
 * Renders `nodes` into `container` using the logical grid. Returns the placement
 * so callers (the editor) can map pointer positions back onto grid cells.
 */
export function renderLogicalGrid(
  ctx: RenderContext,
  container: HTMLElement,
  parent: MockupNode,
  nodes: MockupNode[],
  columnCount: number
): GridPlacement {
  // Grid hints fall back to the widget's catalog defaults, so e.g. a button
  // keeps `fillHorizontal: false` without the property having to be persisted.
  const read: PropReader = (child, name, fallback) => Number(ctx.prop(child, name, fallback));
  const placement = placeInGrid(nodes, columnCount, read);
  const rowHeight = ctx.dense
    ? 'var(--scout-logical-grid-row-height-dense)'
    : 'var(--scout-logical-grid-row-height)';
  const template = gridTemplate(placement, rowHeight);

  container.classList.add('logical-grid');
  // Drives the responsive container queries in scout-render.css: Scout's
  // ResponsiveManager switches a group box to CONDENSED (labels on top) as soon
  // as a logical column is narrower than formColumnWidth (420px).
  container.dataset.columns = String(placement.columnCount);
  container.style.gridTemplateColumns = template.columns;
  container.style.gridTemplateRows = template.rows;
  container.style.alignContent = template.stretchRows ? 'stretch' : 'start';

  for (const cell of placement.cells) {
    const el = ctx.renderNode(cell.node, parent);
    el.style.gridColumn = `${cell.x + 1} / span ${cell.w}`;
    el.style.gridRow = `${cell.y + 1} / span ${cell.h}`;
    if (cell.h > 1) {
      // Spanning several rows implies a minimum height. Without it the browser
      // would let a tall widget be squeezed below its logical size, which in a
      // nested grid shows up as content spilling into the next row.
      el.style.minHeight = `calc(${cell.h} * ${rowHeight} + ${cell.h - 1} * var(--es-grid-row-gap))`;
    }
    if (!ctx.prop<boolean>(cell.node, 'gridDataHints.fillVertical', false)) {
      const valign = read(cell.node, 'gridDataHints.verticalAlignment', -1);
      el.style.alignSelf = valign === 0 ? 'center' : valign === 1 ? 'end' : 'start';
    }
    if (!ctx.prop<boolean>(cell.node, 'gridDataHints.fillHorizontal', true)) {
      const halign = read(cell.node, 'gridDataHints.horizontalAlignment', -1);
      el.style.justifySelf = halign === 0 ? 'center' : halign === 1 ? 'end' : 'start';
    }
    container.appendChild(el);
  }
  return placement;
}

/** Absolute placement for containers that opted out of the logical grid. */
export function renderFreeForm(
  ctx: RenderContext,
  container: HTMLElement,
  parent: MockupNode,
  nodes: MockupNode[]
): void {
  container.classList.add('free-form');
  for (const node of nodes) {
    const el = ctx.renderNode(node, parent);
    el.style.position = 'absolute';
    el.style.left = `${num(node.properties['bounds.x'], 20)}px`;
    el.style.top = `${num(node.properties['bounds.y'], 20)}px`;
    el.style.width = `${num(node.properties['bounds.width'], 320)}px`;
    el.style.height = `${num(node.properties['bounds.height'], 30)}px`;
    el.style.alignSelf = 'auto';
    container.appendChild(el);
  }
}
