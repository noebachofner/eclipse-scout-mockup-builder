import {div, h, span} from '../render/dom';
import type {Store} from './store';
import {TEMPLATES} from '../model/templates';
import {saveProject, openProject, clearAutosave} from '../io/project';
import {buildHtmlExport} from '../io/exportHtml';
import {exportPng} from '../io/exportPng';
import {downloadBlob, downloadText, sanitizeFileName} from '../io/files';
import {DropdownMenu, type MenuEntry} from './menu';
import {editorIcon, shortcutLabel} from './icons';

export interface ToolbarCallbacks {
  notify(message: string, kind?: 'info' | 'error'): void;
  /** Zoom factor at which the whole canvas fits into the visible area. */
  fitZoom(): number;
  showShortcuts(): void;
}

const ZOOM_STEPS = [0.25, 0.5, 0.67, 0.75, 0.9, 1, 1.25, 1.5, 2];

export class Toolbar {
  readonly element: HTMLElement;
  private readonly status: HTMLElement;
  private readonly undoButton: HTMLButtonElement;
  private readonly redoButton: HTMLButtonElement;
  private readonly zoomLabel: HTMLElement;

  constructor(private store: Store, private callbacks: ToolbarCallbacks) {
    this.element = h('header', 'es-toolbar');
    this.element.setAttribute('role', 'toolbar');

    const brand = div('es-brand');
    brand.appendChild(span('es-brand-mark', 'ES'));
    brand.appendChild(span('es-brand-name', 'ES Mockup'));
    brand.title = 'Mockup builder for the Eclipse Scout Framework';
    this.element.appendChild(brand);

    // --- file ---------------------------------------------------------------
    const fileMenu = new DropdownMenu('File', {
      icon: 'file',
      title: 'New, open and save mockups',
      entries: () => this.fileEntries()
    });
    this.element.appendChild(this.group([fileMenu.element]));

    // --- edit ---------------------------------------------------------------
    this.undoButton = this.iconButton('undo', 'Undo', 'Ctrl+Z', () => this.store.undo());
    this.redoButton = this.iconButton('redo', 'Redo', 'Ctrl+Shift+Z', () => this.store.redo());
    this.element.appendChild(this.group([this.undoButton, this.redoButton]));

    // --- export -------------------------------------------------------------
    const exportMenu = new DropdownMenu('Export', {
      icon: 'export',
      title: 'Export the mockup as HTML or PNG',
      entries: () => this.exportEntries()
    });
    this.element.appendChild(this.group([exportMenu.element]));

    // --- zoom ---------------------------------------------------------------
    const zoomGroup = div('es-toolbar-group es-zoom');
    zoomGroup.appendChild(this.iconButton('zoomOut', 'Zoom out', '', () => this.stepZoom(-1)));
    this.zoomLabel = h('button', 'es-zoom-value');
    (this.zoomLabel as HTMLButtonElement).type = 'button';
    this.zoomLabel.title = 'Reset to 100%';
    this.zoomLabel.addEventListener('click', () => this.store.updateCanvas({zoom: 1}));
    zoomGroup.appendChild(this.zoomLabel);
    zoomGroup.appendChild(this.iconButton('zoomIn', 'Zoom in', '', () => this.stepZoom(1)));
    zoomGroup.appendChild(this.iconButton('fit', 'Fit the mockup into the window', '', () => {
      this.store.updateCanvas({zoom: this.callbacks.fitZoom()});
    }));
    this.element.appendChild(zoomGroup);

    // --- right hand side ----------------------------------------------------
    this.status = div('es-status');
    this.element.appendChild(this.status);
    this.element.appendChild(this.group([
      this.iconButton('help', 'Keyboard shortcuts and help', '?', () => this.callbacks.showShortcuts())
    ]));

    store.subscribe(() => this.update());
    this.update();
  }

  private group(children: HTMLElement[]): HTMLElement {
    const group = div('es-toolbar-group');
    children.forEach(child => group.appendChild(child));
    return group;
  }

  private iconButton(icon: string, title: string, shortcut: string, action: () => void): HTMLButtonElement {
    const button = h('button', 'es-button icon-only');
    button.type = 'button';
    button.title = shortcut ? `${title} (${shortcutLabel(shortcut)})` : title;
    button.setAttribute('aria-label', title);
    button.appendChild(editorIcon(icon));
    button.addEventListener('click', action);
    return button;
  }

  /* ------------------------------------------------------------------ menus */

  private fileEntries(): MenuEntry[] {
    const entries: MenuEntry[] = TEMPLATES.map((template, index) => ({
      label: `New: ${template.label}`,
      description: template.description,
      icon: 'file',
      separatorBefore: index === 0 ? false : undefined,
      action: () => {
        if (this.store.dirty && !confirm('Start a new mockup? Unsaved changes are lost.')) return;
        this.store.replace(template.create());
        clearAutosave();
        this.callbacks.notify(`New mockup from "${template.label}".`);
      }
    }));
    entries.push({
      label: 'Open…',
      description: 'Open an .esmockup file, or drop one on the window.',
      icon: 'folderOpen',
      shortcut: 'Ctrl+O',
      separatorBefore: true,
      action: () => void this.open()
    });
    entries.push({
      label: 'Save',
      description: 'Download the mockup as .esmockup (JSON).',
      icon: 'save',
      shortcut: 'Ctrl+S',
      action: () => this.save()
    });
    return entries;
  }

  private exportEntries(): MenuEntry[] {
    return [
      {
        label: 'HTML file…',
        description: 'Standalone .html with all styles and the icon font inlined.',
        icon: 'code',
        shortcut: 'Ctrl+E',
        action: () => void this.exportHtml()
      },
      {
        label: 'PNG image, 1×',
        description: 'Pixel size equals the canvas size.',
        icon: 'image',
        separatorBefore: true,
        action: () => void this.exportPng(1)
      },
      {
        label: 'PNG image, 2×',
        description: 'Retina resolution - best for slides and documents.',
        icon: 'image',
        shortcut: 'Ctrl+Shift+E',
        action: () => void this.exportPng(2)
      }
    ];
  }

  /* ----------------------------------------------------------------- actions */

  private stepZoom(direction: number): void {
    const current = this.store.doc.canvas.zoom;
    const index = ZOOM_STEPS.findIndex(step => step >= current - 0.001);
    const next = ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, Math.max(0, (index < 0 ? ZOOM_STEPS.length - 1 : index) + direction))];
    this.store.updateCanvas({zoom: next});
  }

  private update(): void {
    this.undoButton.disabled = !this.store.canUndo;
    this.redoButton.disabled = !this.store.canRedo;
    this.zoomLabel.textContent = `${Math.round(this.store.doc.canvas.zoom * 100)}%`;

    this.status.replaceChildren();
    const name = span('es-status-name', this.store.doc.meta.name);
    this.status.appendChild(name);
    if (this.store.dirty) {
      const dot = span('es-status-dot', '•');
      dot.title = 'Unsaved changes';
      this.status.appendChild(dot);
    }
    this.status.title = this.store.dirty
      ? 'Unsaved changes - autosaved in this browser'
      : 'All changes saved';
  }

  save(): void {
    const fileName = saveProject(this.store.doc);
    this.store.markSaved(fileName);
    this.callbacks.notify(`Saved as ${fileName}.`);
  }

  async open(): Promise<void> {
    try {
      const result = await openProject();
      if (!result) return;
      this.store.replace(result.doc, result.fileName);
      this.callbacks.notify(`Opened ${result.fileName}.`);
    } catch (e) {
      this.callbacks.notify(`Could not open the file: ${(e as Error).message}`, 'error');
    }
  }

  async exportHtml(): Promise<void> {
    try {
      const html = await buildHtmlExport(this.store.doc);
      const fileName = sanitizeFileName(this.store.doc.meta.name, 'html');
      downloadText(html, fileName, 'text/html');
      this.callbacks.notify(`Exported ${fileName}.`);
    } catch (e) {
      this.callbacks.notify(`HTML export failed: ${(e as Error).message}`, 'error');
    }
  }

  async exportPng(scale: number): Promise<void> {
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
