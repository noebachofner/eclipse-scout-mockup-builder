import {div, h, span} from '../render/dom';
import type {Store} from './store';
import {TEMPLATES} from '../model/templates';
import {saveProject, openProject, clearAutosave} from '../io/project';
import {buildHtmlExport} from '../io/exportHtml';
import {exportPng} from '../io/exportPng';
import {downloadBlob, downloadText, sanitizeFileName} from '../io/files';

export interface ToolbarCallbacks {
  notify(message: string, kind?: 'info' | 'error'): void;
  /** Zoom factor at which the whole canvas fits into the visible area. */
  fitZoom(): number;
}

const ZOOM_STEPS = [0.5, 0.67, 0.75, 0.9, 1, 1.25, 1.5];

export class Toolbar {
  readonly element: HTMLElement;
  private readonly status: HTMLElement;
  private readonly undoButton: HTMLButtonElement;
  private readonly redoButton: HTMLButtonElement;

  constructor(private store: Store, private callbacks: ToolbarCallbacks) {
    this.element = h('header', 'es-toolbar');

    const brand = div('es-brand');
    brand.appendChild(span('es-brand-mark', 'ES'));
    brand.appendChild(span('es-brand-name', 'ES Mockup'));
    brand.title = 'Mockup builder for the Eclipse Scout Framework';
    this.element.appendChild(brand);

    this.element.appendChild(this.group([
      this.menuButton('New', 'Start from a template', TEMPLATES.map(template => ({
        label: template.label,
        description: template.description,
        action: () => {
          if (this.store.dirty && !confirm('Start a new mockup? Unsaved changes are lost.')) return;
          this.store.replace(template.create());
          clearAutosave();
          this.callbacks.notify(`New mockup from "${template.label}".`);
        }
      }))),
      this.button('Open…', 'Open an .esmockup file', () => void this.open()),
      this.button('Save', 'Download the mockup as .esmockup (JSON)', () => this.save())
    ]));

    this.undoButton = this.button('Undo', 'Undo (Ctrl+Z)', () => this.store.undo());
    this.redoButton = this.button('Redo', 'Redo (Ctrl+Shift+Z)', () => this.store.redo());
    this.element.appendChild(this.group([this.undoButton, this.redoButton]));

    this.element.appendChild(this.group([
      this.menuButton('Export', 'Export the mockup', [
        {label: 'HTML file…', description: 'Standalone .html with all styles and the icon font inlined.', action: () => void this.exportHtml()},
        {label: 'PNG image (1×)…', description: 'Pixel size equals the canvas size.', action: () => void this.exportPng(1)},
        {label: 'PNG image (2×)…', description: 'Retina resolution - best for slides and documents.', action: () => void this.exportPng(2)}
      ])
    ]));

    this.element.appendChild(this.zoomControl());

    this.status = div('es-status');
    this.element.appendChild(this.status);

    store.subscribe(() => this.update());
    this.update();
  }

  private group(children: HTMLElement[]): HTMLElement {
    const group = div('es-toolbar-group');
    children.forEach(child => group.appendChild(child));
    return group;
  }

  private button(label: string, title: string, action: () => void): HTMLButtonElement {
    const button = h('button', 'es-button');
    button.type = 'button';
    button.textContent = label;
    button.title = title;
    button.addEventListener('click', action);
    return button;
  }

  private menuButton(
    label: string,
    title: string,
    entries: {label: string; description?: string; action: () => void}[]
  ): HTMLElement {
    const wrapper = div('es-menu-button');
    const button = this.button(label, title, () => {
      const open = wrapper.classList.toggle('open');
      if (open) {
        const close = (event: MouseEvent): void => {
          if (!wrapper.contains(event.target as Node)) {
            wrapper.classList.remove('open');
            document.removeEventListener('mousedown', close);
          }
        };
        document.addEventListener('mousedown', close);
      }
    });
    button.classList.add('with-caret');
    wrapper.appendChild(button);
    const menu = div('es-dropdown');
    for (const entry of entries) {
      const item = h('button', 'es-dropdown-item');
      item.type = 'button';
      item.appendChild(span('es-dropdown-label', entry.label));
      if (entry.description) item.appendChild(span('es-dropdown-description', entry.description));
      item.addEventListener('click', () => {
        wrapper.classList.remove('open');
        entry.action();
      });
      menu.appendChild(item);
    }
    wrapper.appendChild(menu);
    return wrapper;
  }

  private zoomControl(): HTMLElement {
    const group = div('es-toolbar-group es-zoom');
    group.appendChild(span('es-zoom-label', 'Zoom'));
    const select = h('select', 'es-input small');
    const fit = h('option');
    fit.value = 'fit';
    fit.textContent = 'Fit';
    select.appendChild(fit);
    for (const zoom of ZOOM_STEPS) {
      const option = h('option');
      option.value = String(zoom);
      option.textContent = `${Math.round(zoom * 100)}%`;
      select.appendChild(option);
    }
    const sync = (): void => {
      const value = String(this.store.doc.canvas.zoom);
      if (select.value !== value) select.value = ZOOM_STEPS.includes(this.store.doc.canvas.zoom) ? value : 'fit';
    };
    select.value = String(this.store.doc.canvas.zoom);
    select.addEventListener('change', () => {
      this.store.updateCanvas({zoom: select.value === 'fit' ? this.callbacks.fitZoom() : Number(select.value)});
    });
    this.store.subscribe(sync);
    sync();
    group.appendChild(select);
    return group;
  }

  private update(): void {
    this.undoButton.disabled = !this.store.canUndo;
    this.redoButton.disabled = !this.store.canRedo;
    this.status.textContent = `${this.store.doc.meta.name}${this.store.dirty ? ' •' : ''}`;
    this.status.title = this.store.dirty ? 'Unsaved changes' : 'All changes saved locally';
  }

  private save(): void {
    const fileName = saveProject(this.store.doc);
    this.store.markSaved(fileName);
    this.callbacks.notify(`Saved as ${fileName}.`);
  }

  private async open(): Promise<void> {
    try {
      const result = await openProject();
      if (!result) return;
      this.store.replace(result.doc, result.fileName);
      this.callbacks.notify(`Opened ${result.fileName}.`);
    } catch (e) {
      this.callbacks.notify(`Could not open the file: ${(e as Error).message}`, 'error');
    }
  }

  private async exportHtml(): Promise<void> {
    try {
      const html = await buildHtmlExport(this.store.doc);
      const fileName = sanitizeFileName(this.store.doc.meta.name, 'html');
      downloadText(html, fileName, 'text/html');
      this.callbacks.notify(`Exported ${fileName}.`);
    } catch (e) {
      this.callbacks.notify(`HTML export failed: ${(e as Error).message}`, 'error');
    }
  }

  private async exportPng(scale: number): Promise<void> {
    this.callbacks.notify('Rendering PNG…');
    try {
      const blob = await exportPng(this.store.doc, {scale});
      const fileName = sanitizeFileName(this.store.doc.meta.name, 'png');
      downloadBlob(blob, fileName);
      this.callbacks.notify(`Exported ${fileName} (${scale}×).`);
    } catch (e) {
      this.callbacks.notify(`PNG export failed: ${(e as Error).message}`, 'error');
    }
  }
}
