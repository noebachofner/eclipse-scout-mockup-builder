import type {Annotation, MockupDocument, MockupNode, PropertyValue} from '../model/types';
import {cloneNode, findNode, findParent, parseDocument, serializeDocument} from '../model/document';
import {newId} from '../model/ids';

export interface StoreState {
  doc: MockupDocument;
  selectedId: string | null;
  selectedIds: string[];
  fileName: string;
  dirty: boolean;
}

type Listener = (state: StoreState, reason: ChangeReason, changedIds?: string[]) => void;

export type ChangeReason = 'document' | 'selection' | 'meta';

const UNDO_LIMIT = 100;
const UNDO_BYTE_LIMIT = 24 * 1024 * 1024;

export class Store {
  private state: StoreState;
  private listeners = new Set<Listener>();
  private undoStack: string[] = [];
  private redoStack: string[] = [];

  constructor(doc: MockupDocument, fileName = 'mockup.esmockup') {
    this.state = {doc, selectedId: doc.root.id, selectedIds: [doc.root.id], fileName, dirty: false};
  }

  get doc(): MockupDocument {
    return this.state.doc;
  }

  get selectedId(): string | null {
    return this.state.selectedId;
  }

  get selectedNode(): MockupNode | null {
    return this.state.selectedId ? findNode(this.state.doc.root, this.state.selectedId) : null;
  }

  get fileName(): string {
    return this.state.fileName;
  }

  get dirty(): boolean {
    return this.state.dirty;
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(reason: ChangeReason, changedIds?: string[]): void {
    for (const listener of this.listeners) listener(this.state, reason, changedIds);
  }

  update(mutator: (doc: MockupDocument) => void, changedIds?: string[]): void {
    this.undoStack.push(JSON.stringify(this.state.doc));
    this.trimUndoStack();
    this.redoStack.length = 0;
    mutator(this.state.doc);
    this.state.dirty = true;
    this.emit('document', changedIds);
  }

  private trimUndoStack(): void {
    while (this.undoStack.length > UNDO_LIMIT) this.undoStack.shift();
    let bytes = this.undoStack.reduce((sum, snapshot) => sum + snapshot.length, 0);
    while (this.undoStack.length > 1 && bytes > UNDO_BYTE_LIMIT) {
      bytes -= this.undoStack.shift()?.length ?? 0;
    }
  }

  replace(doc: MockupDocument, fileName = this.state.fileName): void {
    this.undoStack.push(JSON.stringify(this.state.doc));
    this.redoStack.length = 0;
    this.state.doc = doc;
    this.state.fileName = fileName;
    this.state.selectedId = doc.root.id;
    this.state.selectedIds = [doc.root.id];
    this.state.dirty = false;
    this.emit('document');
  }

  undo(): void {
    const snapshot = this.undoStack.pop();
    if (!snapshot) return;
    this.redoStack.push(JSON.stringify(this.state.doc));
    this.state.doc = parseDocument(snapshot);
    this.state.dirty = true;
    this.pruneSelection();
    this.emit('document');
  }

  redo(): void {
    const snapshot = this.redoStack.pop();
    if (!snapshot) return;
    this.undoStack.push(JSON.stringify(this.state.doc));
    this.state.doc = parseDocument(snapshot);
    this.state.dirty = true;
    this.pruneSelection();
    this.emit('document');
  }

  private clipboard: MockupNode | null = null;

  copyToClipboard(nodeId: string): boolean {
    const node = findNode(this.state.doc.root, nodeId);
    if (!node) return false;
    this.clipboard = cloneNode(node);
    return true;
  }

  get clipboardType(): string | null {
    return this.clipboard?.objectType ?? null;
  }

  pasteInto(parentId: string, slot: string): string | null {
    if (!this.clipboard) return null;
    const copy = cloneNode(this.clipboard);
    this.insert(parentId, copy, slot);
    return copy.id;
  }

  addAnnotation(x: number, y: number): string {
    const id = newId();
    this.update(doc => {
      doc.annotations.push({id, x: Math.round(x), y: Math.round(y), text: ''});
      doc.canvas.annotationsVisible = true;
    });
    return id;
  }

  updateAnnotation(id: string, patch: Partial<Omit<Annotation, 'id'>>): void {
    this.update(doc => {
      const target = doc.annotations.find(annotation => annotation.id === id);
      if (target) Object.assign(target, patch);
    });
  }

  removeAnnotation(id: string): void {
    this.update(doc => {
      doc.annotations = doc.annotations.filter(annotation => annotation.id !== id);
    });
  }

  get selectedIds(): string[] {
    return [...this.state.selectedIds];
  }

  isSelected(id: string): boolean {
    return this.state.selectedIds.includes(id);
  }

  private pruneSelection(): void {
    this.state.selectedIds = this.state.selectedIds.filter(id => !!findNode(this.state.doc.root, id));
    if (!this.state.selectedIds.length) this.state.selectedIds = [this.state.doc.root.id];
    if (!this.state.selectedId || !findNode(this.state.doc.root, this.state.selectedId)) {
      this.state.selectedId = this.state.selectedIds[this.state.selectedIds.length - 1];
    }
  }

  select(id: string | null): void {
    if (this.state.selectedId === id && this.state.selectedIds.length <= 1) return;
    this.state.selectedId = id;
    this.state.selectedIds = id ? [id] : [];
    this.emit('selection');
  }

  toggleSelection(id: string): void {
    const ids = this.state.selectedIds.filter(current => current !== id);
    if (ids.length === this.state.selectedIds.length) ids.push(id);
    this.state.selectedIds = ids;
    this.state.selectedId = ids[ids.length - 1] ?? null;
    this.emit('selection');
  }

  setSelection(ids: string[]): void {
    this.state.selectedIds = [...new Set(ids)];
    this.state.selectedId = this.state.selectedIds[this.state.selectedIds.length - 1] ?? null;
    this.emit('selection');
  }

  setProperty(nodeId: string, name: string, value: PropertyValue): void {
    this.update(doc => {
      const target = findNode(doc.root, nodeId);
      if (!target) return;
      if (value === null || value === '') {
        delete target.properties[name];
      } else {
        target.properties[name] = value;
      }
    }, [nodeId]);
  }

  setPropertyWithChildren(nodeId: string, name: string, value: PropertyValue, children: Record<string, Record<string, PropertyValue>>): void {
    this.update(doc => {
      const target = findNode(doc.root, nodeId);
      if (target) target.properties[name] = value;
      for (const [childId, props] of Object.entries(children)) {
        const child = findNode(doc.root, childId);
        if (child) Object.assign(child.properties, props);
      }
    });
  }

  setPropertiesForNodes(changes: Record<string, Record<string, PropertyValue>>): void {
    const ids = Object.keys(changes);
    if (!ids.length) return;
    this.update(doc => {
      for (const id of ids) {
        const target = findNode(doc.root, id);
        if (!target) continue;
        for (const [name, value] of Object.entries(changes[id])) {
          if (value === null || value === '') delete target.properties[name];
          else target.properties[name] = value;
        }
      }
    }, ids);
  }

  setProperties(nodeId: string, values: Record<string, PropertyValue>): void {
    this.update(doc => {
      const target = findNode(doc.root, nodeId);
      if (!target) return;
      Object.assign(target.properties, values);
    }, [nodeId]);
  }

  insert(parentId: string, child: MockupNode, slot: string, index = -1): void {
    this.update(doc => {
      const parent = findNode(doc.root, parentId);
      if (!parent) return;
      child.slot = slot;
      if (index < 0 || index >= parent.children.length) {
        parent.children.push(child);
      } else {
        parent.children.splice(index, 0, child);
      }
    });
    this.select(child.id);
  }

  remove(nodeId: string): void {
    if (nodeId === this.state.doc.root.id) return;
    const parent = findParent(this.state.doc.root, nodeId);
    this.update(doc => {
      const p = findParent(doc.root, nodeId);
      if (!p) return;
      const index = p.children.findIndex(c => c.id === nodeId);
      if (index >= 0) p.children.splice(index, 1);
    });
    this.select(parent ? parent.id : this.state.doc.root.id);
  }

  duplicate(nodeId: string): void {
    const parent = findParent(this.state.doc.root, nodeId);
    const source = findNode(this.state.doc.root, nodeId);
    if (!parent || !source) return;
    const copy = cloneNode(source);
    this.update(doc => {
      const p = findNode(doc.root, parent.id);
      if (!p) return;
      const index = p.children.findIndex(c => c.id === nodeId);
      p.children.splice(index + 1, 0, copy);
    });
    this.select(copy.id);
  }

  move(nodeId: string, targetParentId: string, slot: string, index: number): void {
    this.update(doc => {
      const parent = findParent(doc.root, nodeId);
      const target = findNode(doc.root, targetParentId);
      if (!parent || !target) return;
      const currentIndex = parent.children.findIndex(c => c.id === nodeId);
      if (currentIndex < 0) return;
      const [moved] = parent.children.splice(currentIndex, 1);
      moved.slot = slot;
      let insertAt = index;
      if (parent === target && currentIndex < index) insertAt = index - 1;
      if (insertAt < 0 || insertAt > target.children.length) insertAt = target.children.length;
      target.children.splice(insertAt, 0, moved);
    });
    this.select(nodeId);
  }

  reorder(nodeId: string, delta: number): void {
    const parent = findParent(this.state.doc.root, nodeId);
    if (!parent) return;
    this.update(doc => {
      const p = findNode(doc.root, parent.id);
      if (!p) return;
      const index = p.children.findIndex(c => c.id === nodeId);
      const next = index + delta;
      if (index < 0 || next < 0 || next >= p.children.length) return;
      const [moved] = p.children.splice(index, 1);
      p.children.splice(next, 0, moved);
    });
  }

  updateMeta(patch: Partial<MockupDocument['meta']>): void {
    this.update(doc => Object.assign(doc.meta, patch));
  }

  updateTheme(patch: Partial<MockupDocument['theme']>): void {
    this.update(doc => Object.assign(doc.theme, patch));
  }

  updateCanvas(patch: Partial<MockupDocument['canvas']>): void {
    this.update(doc => Object.assign(doc.canvas, patch));
  }

  markSaved(fileName?: string): void {
    this.state.dirty = false;
    if (fileName) this.state.fileName = fileName;
    this.emit('meta');
  }

  serialize(): string {
    return serializeDocument(this.state.doc);
  }
}
