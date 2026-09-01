import {div, span} from '../render/dom';
import {Store} from './store';
import {Canvas} from './canvas';
import {Palette} from './palette';
import {StructureTree} from './structure';
import {PropertyPanel} from './properties';
import {Toolbar} from './toolbar';
import {defaultDesktopTemplate} from '../model/templates';
import {readAutosave, readProjectFile, writeAutosave} from '../io/project';

export class App {
  readonly store: Store;
  private readonly toast: HTMLElement;
  private toastTimer = 0;

  constructor(private root: HTMLElement) {
    const restored = readAutosave();
    this.store = new Store(restored ?? defaultDesktopTemplate());

    const canvas = new Canvas(this.store);
    const toolbar = new Toolbar(this.store, {
      notify: (message, kind) => this.notify(message, kind),
      fitZoom: () => canvas.fitZoom()
    });
    const palette = new Palette(this.store, canvas);
    const structure = new StructureTree(this.store, canvas);
    const properties = new PropertyPanel(this.store);

    const left = div('es-side es-side-left');
    left.appendChild(palette.element);
    left.appendChild(structure.element);

    const main = div('es-main');
    main.appendChild(left);
    main.appendChild(canvas.element);
    main.appendChild(properties.element);

    const layout = div('es-app');
    layout.appendChild(toolbar.element);
    layout.appendChild(main);

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

      if (meta && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) this.store.redo();
        else this.store.undo();
        return;
      }
      if (meta && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        this.store.redo();
        return;
      }
      if (typing) return;

      if (meta && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        if (this.store.selectedId) this.store.duplicate(this.store.selectedId);
        return;
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (!this.store.selectedId) return;
        event.preventDefault();
        this.store.remove(this.store.selectedId);
        return;
      }
      if (event.key === 'Escape') {
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
