/**
 * The ES Mockup document model.
 *
 * A mockup is a tree of {@link MockupNode}s that mirrors an Eclipse Scout widget
 * tree: the root is always a `Desktop`, which holds outlines, view/tool buttons
 * and the forms shown in the bench. Every node carries the Scout properties the
 * user configured; everything else falls back to the Scout defaults declared in
 * the widget catalog.
 */

/**
 * A property value as it is stored in the document.
 *
 * `string[][]` carries tabular data - a table's columns and its rows - which
 * used to be squeezed into one string with `|` between the cells. That meant a
 * cell could never contain a `|`, and the editor had to silently replace it.
 */
export type PropertyValue = string | number | boolean | string[] | string[][] | null;

/** One widget in the mockup tree. `objectType` matches Scout's own object types. */
export interface MockupNode {
  id: string;
  objectType: string;
  /**
   * Which child slot of the parent this node belongs to (`fields`, `menus`,
   * `columns`, ...). Omitted means "the parent's default slot".
   */
  slot?: string;
  properties: Record<string, PropertyValue>;
  children: MockupNode[];
}

/** User overrides for Scout's LESS color variables, keyed without the leading `@`. */
export type ColorOverrides = Record<string, string>;

export interface ThemeSettings {
  /** `default` mirrors Scout's light theme; `dark` mirrors `colors-dark.less`. */
  base: 'default' | 'dark';
  /** Overrides applied on top of the base theme, e.g. `{'accent-color-3': '#7a1fa2'}`. */
  colors: ColorOverrides;
  /** Scout's compact display mode (`.dense`), which shrinks rows and paddings. */
  dense: boolean;
  /**
   * Mirrors Scout's ResponsiveManager: when a logical grid is narrower than the
   * group box would like to be, the labels move on top (CONDENSED state).
   */
  responsive: boolean;
  fontFamily: string;
}

export interface CanvasSettings {
  width: number;
  height: number;
  /** Draws a browser chrome around the mockup - useful for presentations. */
  browserFrame: boolean;
  zoom: number;
  /** Shows the review callouts, in the editor and in the exports alike. */
  annotationsVisible: boolean;
}

/**
 * A numbered review callout placed on top of the mockup.
 *
 * Mockups get commented on, and the comments usually end up in a separate
 * document that drifts away from the picture. These live in the mockup file
 * and travel with every export.
 */
export interface Annotation {
  id: string;
  /** Position in the mockup's own pixel space, not in screen pixels. */
  x: number;
  y: number;
  text: string;
}

export interface DocumentMeta {
  name: string;
  description: string;
  author: string;
  createdAt: string;
  modifiedAt: string;
  generator: string;
  /** Version of @eclipse-scout/core the look & feel was derived from. */
  scoutVersion: string;
}

export const MOCKUP_FORMAT = 'es-mockup';
export const MOCKUP_FORMAT_VERSION = 1;

/** The persisted `.esmockup` file (JSON). */
export interface MockupDocument {
  format: typeof MOCKUP_FORMAT;
  formatVersion: number;
  meta: DocumentMeta;
  theme: ThemeSettings;
  canvas: CanvasSettings;
  root: MockupNode;
  annotations: Annotation[];
}

/**
 * Scout's logical grid data (`GridData` / `gridDataHints`). Stored as ordinary
 * node properties named `gridDataHints.*` so the property editor can treat them
 * like any other property.
 */
export interface GridDataHints {
  x: number;
  y: number;
  w: number;
  h: number;
  weightX: number;
  weightY: number;
  useUiWidth: boolean;
  useUiHeight: boolean;
  fillHorizontal: boolean;
  fillVertical: boolean;
  horizontalAlignment: -1 | 0 | 1;
  verticalAlignment: -1 | 0 | 1;
}

export const DEFAULT_GRID_DATA_HINTS: GridDataHints = {
  x: -1,
  y: -1,
  w: 1,
  h: 1,
  weightX: -1,
  weightY: -1,
  useUiWidth: false,
  useUiHeight: false,
  fillHorizontal: true,
  fillVertical: true,
  horizontalAlignment: -1,
  verticalAlignment: -1
};

/** Absolute placement, used only when a container opts out of the logical grid. */
export interface FreeFormBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}
