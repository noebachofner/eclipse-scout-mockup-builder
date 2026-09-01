import type {MockupNode} from '../model/types';
import {getWidget, type SlotDef} from '../model/catalog/registry';
import {containsNode} from '../model/document';

export interface DropTarget {
  parent: MockupNode;
  slot: SlotDef;
  /** Index inside `parent.children`. */
  index: number;
}

/** True when `slot` accepts a widget of `objectType`. */
export function slotAccepts(slot: SlotDef, objectType: string): boolean {
  if (slot.accepts.includes('*')) {
    // The catch-all slot takes anything that can live inside a form container.
    const def = getWidget(objectType);
    if (!def) return false;
    return def.isFormField || ['Tile', 'FormFieldTile', 'Notification', 'Table', 'Accordion', 'Group'].includes(objectType);
  }
  return slot.accepts.includes(objectType);
}

/** The first slot of `parent` that accepts `objectType`, if any. */
export function findSlot(parent: MockupNode, objectType: string): SlotDef | null {
  const def = getWidget(parent.objectType);
  if (!def) return null;
  for (const slot of def.slots) {
    if (!slotAccepts(slot, objectType)) continue;
    if (slot.max !== undefined) {
      const used = parent.children.filter(c => (c.slot ?? def.slots[0]?.name) === slot.name).length;
      if (used >= slot.max) continue;
    }
    return slot;
  }
  return null;
}

/**
 * Walks up from `node` until a container is found that accepts `objectType`.
 * `movedNodeId` guards against dropping a subtree into itself.
 */
export function resolveDropTarget(
  root: MockupNode,
  chain: MockupNode[],
  objectType: string,
  movedNodeId?: string
): DropTarget | null {
  for (let i = chain.length - 1; i >= 0; i--) {
    const candidate = chain[i];
    if (movedNodeId && containsNode(candidate, movedNodeId)) {
      // Dropping into the dragged node itself (or a descendant) is not allowed,
      // but a parent further up the chain still is.
      if (candidate.id === movedNodeId) continue;
      const slot = findSlot(candidate, objectType);
      if (slot && candidate.id !== movedNodeId) return {parent: candidate, slot, index: candidate.children.length};
      continue;
    }
    const slot = findSlot(candidate, objectType);
    if (slot) return {parent: candidate, slot, index: candidate.children.length};
  }
  void root;
  return null;
}

/** Human readable reason shown when a drop is refused. */
export function describeRefusal(parent: MockupNode, objectType: string): string {
  const def = getWidget(parent.objectType);
  const child = getWidget(objectType);
  if (!def || !child) return 'Unknown widget.';
  if (!def.slots.length) return `${def.label} cannot contain other widgets.`;
  return `${def.label} does not accept a ${child.label}.`;
}
