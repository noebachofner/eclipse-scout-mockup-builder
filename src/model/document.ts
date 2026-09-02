import {
  MOCKUP_FORMAT,
  MOCKUP_FORMAT_VERSION,
  type MockupDocument,
  type Annotation,
  type MockupNode,
  type PropertyValue
} from './types';
import {newId} from './ids';
import {getWidget} from './catalog/registry';
import {SCOUT_VERSION} from './scoutColors.generated';

export interface NodeSpec {
  objectType: string;
  slot?: string;
  properties?: Record<string, PropertyValue>;
  children?: NodeSpec[];
}

/** Builds a node tree from a compact literal, assigning fresh ids. */
export function node(spec: NodeSpec): MockupNode {
  return {
    id: newId(),
    objectType: spec.objectType,
    ...(spec.slot ? {slot: spec.slot} : {}),
    properties: {...(spec.properties ?? {})},
    children: (spec.children ?? []).map(node)
  };
}

/** Creates a widget with the catalog defaults that make sense to persist. */
export function createNode(objectType: string, overrides: Record<string, PropertyValue> = {}): MockupNode {
  const def = getWidget(objectType);
  const properties: Record<string, PropertyValue> = {};
  if (def) {
    // Persist only what the user is likely to tweak; the rest stays implicit so
    // saved files remain small and readable.
    for (const key of ['label', 'text', 'title'] as const) {
      if (def.defaults[key] !== undefined) properties[key] = def.defaults[key];
    }
    if (def.defaultGridH && def.defaultGridH > 1) properties['gridDataHints.h'] = def.defaultGridH;
    const defaultW = def.defaults['gridDataHints.w'];
    if (typeof defaultW === 'number' && defaultW > 1) properties['gridDataHints.w'] = defaultW;
  }
  return {
    id: newId(),
    objectType,
    properties: {...properties, ...overrides},
    children: []
  };
}

export function cloneNode(source: MockupNode): MockupNode {
  return {
    id: newId(),
    objectType: source.objectType,
    ...(source.slot ? {slot: source.slot} : {}),
    properties: {...source.properties},
    children: source.children.map(cloneNode)
  };
}

export function findNode(root: MockupNode, id: string): MockupNode | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

export function findParent(root: MockupNode, id: string): MockupNode | null {
  for (const child of root.children) {
    if (child.id === id) return root;
    const found = findParent(child, id);
    if (found) return found;
  }
  return null;
}

export function pathTo(root: MockupNode, id: string): MockupNode[] {
  if (root.id === id) return [root];
  for (const child of root.children) {
    const sub = pathTo(child, id);
    if (sub.length) return [root, ...sub];
  }
  return [];
}

export function walk(root: MockupNode, visit: (node: MockupNode, parent: MockupNode | null) => void, parent: MockupNode | null = null): void {
  visit(root, parent);
  root.children.forEach(child => walk(child, visit, root));
}

/** True when `candidate` is `node` or one of its descendants (drop-target guard). */
export function containsNode(node: MockupNode, candidateId: string): boolean {
  return !!findNode(node, candidateId);
}

export function createDocument(root: MockupNode, name = 'Untitled mockup'): MockupDocument {
  const now = new Date().toISOString();
  return {
    format: MOCKUP_FORMAT,
    formatVersion: MOCKUP_FORMAT_VERSION,
    meta: {
      name,
      description: '',
      author: '',
      createdAt: now,
      modifiedAt: now,
      generator: 'ES Mockup',
      scoutVersion: SCOUT_VERSION
    },
    theme: {
      base: 'default',
      colors: {},
      dense: false,
      responsive: true,
      fontFamily: 'Arial, sans-serif'
    },
    canvas: {
      width: 1440,
      height: 900,
      browserFrame: false,
      zoom: 1,
      annotationsVisible: true
    },
    root,
    annotations: []
  };
}

export class DocumentFormatError extends Error {}

/**
 * Parses a `.esmockup` file. Unknown future versions are rejected rather than
 * silently mis-rendered; unknown widget types survive a round trip so a file
 * written by a newer catalog is not destroyed by an older build.
 */
export function parseDocument(json: string): MockupDocument {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch (e) {
    throw new DocumentFormatError(`Not a valid JSON file: ${(e as Error).message}`);
  }
  if (!raw || typeof raw !== 'object') throw new DocumentFormatError('Empty document.');
  const doc = raw as Partial<MockupDocument>;
  if (doc.format !== MOCKUP_FORMAT) {
    throw new DocumentFormatError(`Not an ES Mockup file (format: ${String(doc.format)}).`);
  }
  if (typeof doc.formatVersion !== 'number' || doc.formatVersion > MOCKUP_FORMAT_VERSION) {
    throw new DocumentFormatError(
      `This file was written by a newer version of ES Mockup (format version ${String(doc.formatVersion)}).`
    );
  }
  if (!doc.root || typeof doc.root !== 'object') throw new DocumentFormatError('Document has no root widget.');

  const base = createDocument(normalizeNode(doc.root as MockupNode), doc.meta?.name ?? 'Untitled mockup');
  return {
    ...base,
    meta: {...base.meta, ...doc.meta, name: doc.meta?.name ?? base.meta.name},
    theme: {...base.theme, ...doc.theme, colors: {...(doc.theme?.colors ?? {})}},
    canvas: {...base.canvas, ...doc.canvas},
    annotations: Array.isArray(doc.annotations) ? doc.annotations.map(normalizeAnnotation) : []
  };
}

function normalizeAnnotation(raw: Annotation): Annotation {
  return {
    id: typeof raw?.id === 'string' && raw.id ? raw.id : newId(),
    x: Number(raw?.x) || 0,
    y: Number(raw?.y) || 0,
    text: String(raw?.text ?? '')
  };
}

function normalizeNode(raw: MockupNode): MockupNode {
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : newId(),
    objectType: String(raw.objectType ?? 'GroupBox'),
    ...(raw.slot ? {slot: String(raw.slot)} : {}),
    properties: raw.properties && typeof raw.properties === 'object' ? {...raw.properties} : {},
    children: Array.isArray(raw.children) ? raw.children.map(normalizeNode) : []
  };
}

export function serializeDocument(doc: MockupDocument): string {
  const out: MockupDocument = {
    ...doc,
    meta: {...doc.meta, modifiedAt: new Date().toISOString()}
  };
  return JSON.stringify(out, null, 2);
}
