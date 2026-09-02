import {div, span} from '../render/dom';
import {Store} from './store';
import {Canvas} from './canvas';
import {Palette} from './palette';
import {StructureTree} from './structure';
import {PropertyPanel} from './properties';
import {Toolbar} from './toolbar';
import {defaultDesktopTemplate} from '../model/templates';
import {readAutosave, readProjectFile, writeAutosave} from '../io/project';
import {showShortcutsDialog} from './shortcuts';
import {Workspace} from './panels';
import {pathTo} from '../model/document';

export class App {
  readonly store: Store;
  private canvas!: Canvas;
  private toolbar!: Toolbar;
  private workspace!: Workspace;
  private readonly toast: HTMLElement;
  private toastTimer = 0;

  constructor(private root: HTMLElement) {
    const restored = readAutosave();
    this.store = new Store(restored ?? defaultDesktopTemplate());

    const canvas = new Canvas(this.store);
    this.canvas = canvas;
    const toolbar = new Toolbar(this.store, {
      notify: (message, kind) => this.notify(message, kind),
      fitZoom: () => canvas.fitZoom(),
      showShortcuts: () => showShortcutsDialog(),
      selectedFormId: () => this.selectedFormId()
    });
    this.toolbar = toolbar;
    const palette = new Palette(this.store, canvas);
    const structure = new StructureTree(this.store, canvas);
    const properties = new PropertyPanel(this.store, {
      measureChildBounds: parentId => canvas.measureChildBounds(parentId),
      notify: (message, kind) => this.notify(message, kind)
    });

    const left = div('es-side es-side-left');
    left.appendChild(palette.element);
    left.appendChild(structure.element);

    const workspace = new Workspace(left, canvas.element, properties.element);
    this.workspace = workspace;
    toolbar.bindPanelToggles(workspace);
    workspace.onChange(() => canvas.refreshOverlay());

    const layout = div('es-app');
    layout.appendChild(toolbar.element);
    layout.appendChild(workspace.element);

    this.toast = div('es-toast');
    layout.appendChild(this.toast);

    this.root.replaceChildren(layout);

    this.store.subscribe(() => writeAutosave(this.store.doc));
    this.installShortcuts();
    this.installFileDrop();
    this.installUnloadGuard();

    if (restored) {
      this.notify('Restored your last mockup from this browser.');
    }
  }

  /** The innermost form the selection sits in, so the Java dialog preselects it. */
  private selectedFormId(): string | undefined {
    const id = this.store.selectedId;
    if (!id) return undefined;
    const chain = pathTo(this.store.doc.root, id);
    for (let i = chain.length - 1; i >= 0; i--) {
      if (chain[i].objectType === 'Form') return chain[i].id;
    }
    return undefined;
  }

  private notify(message: string, kind: 'info' | 'error' = 'info'): void {
    this.toast.replaceChildren(span('es-toast-text', message));
    this.toast.classList.toggle('error', kind === 'error');
    this.toast.classList.add('visible');
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toast.classList.remove('visible'), kind === 'error' ? 8000 : 3500);
  }

  private installShortcuts(): void {
    window.addEventListener('keydown', event => {
      const target = event.target as HTMLElement | null;
      const typing = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      const meta = event.ctrlKey || event.metaKey;
      const key = event.key;

      if (meta) {
        // File and view commands stay available while typing in a field.
        switch (key.toLowerCase()) {
          case 'z':
            event.preventDefault();
            if (event.shiftKey) this.store.redo();
            else this.store.undo();
            return;
          case 'y':
            event.preventDefault();
            this.store.redo();
            return;
          case 's':
            event.preventDefault();
            this.toolbar.save();
            return;
          case 'o':
            event.preventDefault();
            void this.toolbar.open();
            return;
          case 'e':
            event.preventDefault();
            if (event.shiftKey) void this.toolbar.exportPng(2);
            else void this.toolbar.exportHtml();
            return;
          case 'b':
            // Not [ and ]: both need AltGr on a Swiss or German keyboard.
            event.preventDefault();
            this.workspace.toggle(event.shiftKey ? 'right' : 'left');
            return;
          case 'j':
            event.preventDefault();
            this.toolbar.exportJava();
            return;
          case '0':
            event.preventDefault();
            this.store.updateCanvas({zoom: 1});
            return;
          case '1':
            event.preventDefault();
            this.store.updateCanvas({zoom: this.canvas.fitZoom()});
            return;
          case '+':
          case '=':
            event.preventDefault();
            this.store.updateCanvas({zoom: Math.min(2, Math.round((this.store.doc.canvas.zoom + 0.1) * 100) / 100)});
            return;
          case '-':
            event.preventDefault();
            this.store.updateCanvas({zoom: Math.max(0.25, Math.round((this.store.doc.canvas.zoom - 0.1) * 100) / 100)});
            return;
          default:
            break;
        }
      }
      if (typing) return;

      if (key === '?' || (key === '/' && event.shiftKey)) {
        event.preventDefault();
        showShortcutsDialog();
        return;
      }
      if (key === '/') {
        event.preventDefault();
        this.root.querySelector<HTMLInputElement>('.es-palette .es-search')?.focus();
        return;
      }
      if (meta && key.toLowerCase() === 'd') {
        event.preventDefault();
        if (this.store.selectedId) this.store.duplicate(this.store.selectedId);
        return;
      }
      if (key === 'Delete' || key === 'Backspace') {
        if (!this.store.selectedId) return;
        event.preventDefault();
        this.store.remove(this.store.selectedId);
        return;
      }
      if (key.startsWith('Arrow')) {
        // Free placement only: nudge or resize the selected widget.
        if (this.canvas.nudgeSelection(key, event.shiftKey, !event.altKey)) {
          event.preventDefault();
        }
        return;
      }
      if (key === 'Escape') {
        this.store.select(this.store.doc.root.id);
      }
    });
  }

  private installFileDrop(): void {
    window.addEventListener('dragover', event => {
      if (event.dataTransfer?.types.includes('Files')) event.preventDefault();
    });
    window.addEventListener('drop', async event => {
      const file = event.dataTransfer?.files?.[0];
      if (!file || !/\.(esmockup|json)$/i.test(file.name)) return;
      event.preventDefault();
      try {
        const result = await readProjectFile(file);
        this.store.replace(result.doc, result.fileName);
        this.notify(`Opened ${result.fileName}.`);
      } catch (e) {
        this.notify(`Could not open ${file.name}: ${(e as Error).message}`, 'error');
      }
    });
  }

  private installUnloadGuard(): void {
    window.addEventListener('beforeunload', event => {
      if (!this.store.dirty) return;
      event.preventDefault();
      event.returnValue = '';
    });
  }
}
