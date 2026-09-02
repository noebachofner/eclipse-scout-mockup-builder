export type PropertyValue = string | number | boolean | string[] | string[][] | null;

export interface MockupNode {
  id: string;
  objectType: string;
  slot?: string;
  properties: Record<string, PropertyValue>;
  children: MockupNode[];
}

export type ColorOverrides = Record<string, string>;

export interface ThemeSettings {
  base: 'default' | 'dark';
  colors: ColorOverrides;
  dense: boolean;
  responsive: boolean;
  fontFamily: string;
}

export interface CanvasSettings {
  width: number;
  height: number;
  browserFrame: boolean;
  zoom: number;
  annotationsVisible: boolean;
}

export interface Annotation {
  id: string;
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
  scoutVersion: string;
}

export const MOCKUP_FORMAT = 'es-mockup';
export const MOCKUP_FORMAT_VERSION = 1;

export interface MockupDocument {
  format: typeof MOCKUP_FORMAT;
  formatVersion: number;
  meta: DocumentMeta;
  theme: ThemeSettings;
  canvas: CanvasSettings;
  root: MockupNode;
  annotations: Annotation[];
}

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
