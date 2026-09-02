import type {MockupNode} from '../model/types';
import {allWidgets, CATEGORY_ORDER, getWidget} from '../model/catalog/registry';
import {createNode, findNode, pathTo} from '../model/document';
import {alignRects, distributeRects, type AlignMode, type Rect} from './alignment';
import {findSlot} from './dropTarget';
import type {ContextMenuEntry} from './contextMenu';
import type {Store} from './store';

/**
 * The entries the right-click menu offers for one widget. Shared by the canvas
 * and the structure tree so both offer the same actions in the same order.
 */
export function buildWidgetMenu(store: Store, node: MockupNode, parent: MockupNode | null): ContextMenuEntry[] {
  const isRoot = node.id === store.doc.root.id;
  const def = getWidget(node.objectType);
  const entries: ContextMenuEntry[] = [];

  entries.push({
    label: def?.label ?? node.objectType,
    disabled: true
  });

  if (parent) {
    entries.push({
      label: `Select ${labelOf(parent)}`,
      icon: 'up',
      separatorBefore: true,
      action: () => store.select(parent.id)
    });
  }

  entries.push({
    label: 'Duplicate',
    icon: 'copy',
    shortcut: 'Ctrl+D',
    disabled: isRoot,
    separatorBefore: !parent,
    action: () => store.duplicate(node.id)
  });
  entries.push({
    label: 'Copy',
    icon: 'copy',
    disabled: isRoot,
    action: () => store.copyToClipboard(node.id)
  });

  const clipboardType = store.clipboardType;
  const pasteTarget = clipboardType ? resolveInsertTarget(pathTo(store.doc.root, node.id), clipboardType) : null;
  entries.push({
    label: clipboardType ? `Paste ${getWidget(clipboardType)?.label ?? clipboardType}` : 'Paste',
    icon: 'file',
    disabled: !pasteTarget,
    action: () => {
      if (pasteTarget) {
        const id = store.pasteInto(pasteTarget.parent.id, pasteTarget.slot);
        if (id) store.select(id);
      }
    }
  });

  entries.push({
    label: 'Move up',
    icon: 'up',
    disabled: isRoot,
    separatorBefore: true,
    action: () => store.reorder(node.id, -1)
  });
  entries.push({
    label: 'Move down',
    icon: 'down',
    disabled: isRoot,
    action: () => store.reorder(node.id, 1)
  });

  const alignment = buildAlignMenu(store);
  if (alignment.length) {
    entries.push({label: `Align ${store.selectedIds.length} widgets`, icon: 'grid', separatorBefore: true, submenu: alignment});
  }

  const insert = buildInsertMenu(store, node);
  if (insert.length) {
    entries.push({label: 'Add widget', icon: 'file', separatorBefore: true, submenu: insert});
  }

  entries.push({
    label: 'Remove',
    icon: 'trash',
    shortcut: 'Delete',
    disabled: isRoot,
    separatorBefore: true,
    action: () => store.remove(node.id)
  });
  return entries;
}

/**
 * `Add widget` lists what can be added *here*, which is not the same as what
 * the clicked widget accepts: right-clicking a table field should still offer a
 * string field, which then lands in the group box around it. So every widget is
 * matched against the nearest ancestor that takes it - the rule paste and drag
 * & drop already use - and anything nothing accepts is left out.
 */
function buildInsertMenu(store: Store, node: MockupNode): ContextMenuEntry[] {
  const chain = pathTo(store.doc.root, node.id);
  if (!chain.length) return [];

  const groups: ContextMenuEntry[] = [];
  for (const category of CATEGORY_ORDER) {
    const usable: Array<{label: string; objectType: string; target: InsertTarget}> = [];
    for (const def of allWidgets()) {
      if (def.category !== category) continue;
      const target = resolveInsertTarget(chain, def.objectType);
      if (target) usable.push({label: def.label, objectType: def.objectType, target});
    }
    if (!usable.length) continue;
    groups.push({
      label: category,
      submenu: usable.map(({label, objectType, target}) => ({
        label,
        // Naming the container makes it obvious where the widget will land.
        shortcut: target.parent.id === node.id ? '' : `in ${labelOf(target.parent)}`,
        action: () => {
          const child = createNode(objectType);
          store.insert(target.parent.id, child, target.slot);
          store.select(child.id);
        }
      }))
    });
  }
  return groups;
}

/**
 * Align and distribute, offered only for a free-form multi selection: inside a
 * logical grid the position is Scout's to decide, not the user's.
 */
function buildAlignMenu(store: Store): ContextMenuEntry[] {
  const ids = store.selectedIds.filter(id => isFreeFormChild(store, id));
  if (ids.length < 2) return [];

  const rectsOf = (): Rect[] => ids.map(id => {
    const node = findNode(store.doc.root, id);
    return {
      x: Number(node?.properties['bounds.x'] ?? 0),
      y: Number(node?.properties['bounds.y'] ?? 0),
      width: Number(node?.properties['bounds.width'] ?? 0),
      height: Number(node?.properties['bounds.height'] ?? 0)
    };
  });
  // Aligning is one action, so it is one undo step.
  const apply = (positions: Array<{x: number; y: number}>): void => {
    const changes: Record<string, Record<string, number>> = {};
    positions.forEach((position, index) => {
      changes[ids[index]] = {'bounds.x': position.x, 'bounds.y': position.y};
    });
    store.setPropertiesForNodes(changes);
  };

  const modes: Array<[string, AlignMode]> = [
    ['Left edges', 'left'],
    ['Horizontal centres', 'centerX'],
    ['Right edges', 'right'],
    ['Top edges', 'top'],
    ['Vertical centres', 'centerY'],
    ['Bottom edges', 'bottom']
  ];
  const entries: ContextMenuEntry[] = modes.map(([label, mode], index) => ({
    label,
    separatorBefore: index === 3,
    action: () => apply(alignRects(rectsOf(), mode))
  }));

  if (ids.length >= 3) {
    entries.push({label: 'Distribute horizontally', separatorBefore: true, action: () => apply(distributeRects(rectsOf(), 'x'))});
    entries.push({label: 'Distribute vertically', action: () => apply(distributeRects(rectsOf(), 'y'))});
  }
  return entries;
}

function isFreeFormChild(store: Store, id: string): boolean {
  const chain = pathTo(store.doc.root, id);
  const parent = chain[chain.length - 2];
  return !!parent && parent.properties.layoutMode === 'free';
}

interface InsertTarget {
  parent: MockupNode;
  slot: string;
}

/** The nearest widget in `chain` that has a slot accepting `objectType`. */
function resolveInsertTarget(chain: MockupNode[], objectType: string): InsertTarget | null {
  for (let i = chain.length - 1; i >= 0; i--) {
    const slot = findSlot(chain[i], objectType);
    if (slot) return {parent: chain[i], slot: slot.name};
  }
  return null;
}

function labelOf(node: MockupNode): string {
  for (const key of ['label', 'text', 'title'] as const) {
    const value = node.properties[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return getWidget(node.objectType)?.label ?? node.objectType;
}
