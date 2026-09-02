import type {MockupNode} from '../model/types';
import {allWidgets, CATEGORY_ORDER, getWidget} from '../model/catalog/registry';
import {createNode, pathTo} from '../model/document';
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
