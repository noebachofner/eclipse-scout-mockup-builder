import {div, h, span} from '../render/dom';
import type {Store} from './store';
import {TEMPLATES} from '../model/templates';
import type {MockupDocument} from '../model/types';
import {saveProject, openProject, listAutosaves, restoreAutosave} from '../io/project';
import {buildShareUrl, COMFORTABLE_URL_LENGTH} from '../io/share';
import {buildHtmlExport} from '../io/exportHtml';
import {exportPng} from '../io/exportPng';
import {downloadBlob, downloadText, sanitizeFileName} from '../io/files';
import {DropdownMenu, type MenuEntry} from './menu';
import {editorIcon, shortcutLabel} from './icons';
import type {PanelSide, Workspace} from './panels';
import {showJavaExportDialog} from './javaDialog';
import {showCheckDialog} from './checkDialog';

export interface ToolbarCallbacks {
  notify(message: string, kind?: 'info' | 'error'): void;
  /** Zoom factor at which the whole canvas fits into the visible area. */
  fitZoom(): number;
  showShortcuts(): void;
  /** Id of the form the current selection belongs to, if any. */
  selectedFormId(): string | undefined;
  /** Replaces the document and starts a fresh autosave slot. */
  newDocument(doc: MockupDocument): void;
  /** Replaces the document and keeps writing into `slotId`. */
  openDocument(doc: MockupDocument, slotId: string): void;
  /** Autosave slot the session is currently writing to. */
  currentSlotId(): string;
  /** Turns callout placement on the canvas on or off. */
  toggleAnnotateMode(): void;
}

/** `Autosaved 4 minutes ago` - relative while it is recent, absolute after. */
function formatWhen(iso: string): string {
  const then = new Date(iso).getTime();
  const minutes = Math.round((Date.now() - then) / 60_000);
  if (!Number.isFinite(minutes)) return 'earlier';
  if (minutes < 1) return 'moments ago';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleString();
}

const ZOOM_STEPS = [0.25, 0.5, 0.67, 0.75, 0.9, 1, 1.25, 1.5, 2];

export class Toolbar {
  readonly element: HTMLElement;
  private readonly status: HTMLElement;
  private readonly undoButton: HTMLButtonElement;
  private readonly redoButton: HTMLButtonElement;
  private readonly zoomLabel: HTMLElement;
  private readonly panelButtons: Record<PanelSide, HTMLButtonElement>;
  private readonly annotateButton: HTMLButtonElement;

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

    // --- panels -------------------------------------------------------------
    this.panelButtons = {
      left: this.toggleButton('panelLeft', 'Element palette', 'Ctrl+B'),
      right: this.toggleButton('panelRight', 'Property panel', 'Ctrl+Shift+B')
    };
    this.annotateButton = this.toggleButton('annotate', 'Add review callouts', 'Ctrl+M');
    this.annotateButton.addEventListener('click', () => this.callbacks.toggleAnnotateMode());
    this.element.appendChild(this.group([this.annotateButton, this.panelButtons.left, this.panelButtons.right]));

    // --- right hand side ----------------------------------------------------
    this.status = div('es-status');
    this.element.appendChild(this.status);
    this.element.appendChild(this.group([
      this.iconButton('help', 'Keyboard shortcuts and help', '?', () => this.callbacks.showShortcuts())
    ]));

    store.subscribe(() => this.update());
    this.update();
  }

  /** Copies a link that carries the document in its fragment. */
  async copyShareLink(): Promise<void> {
    try {
      const url = await buildShareUrl(this.store.doc);
      await navigator.clipboard.writeText(url);
      if (url.length > COMFORTABLE_URL_LENGTH) {
        this.callbacks.notify(`Link copied, but it is ${Math.round(url.length / 1024)} KB long - some chat and mail clients cut links that long. Send the .esmockup file instead if it does not open.`);
      } else {
        this.callbacks.notify(`Share link copied (${url.length} characters).`);
      }
    } catch (e) {
      this.callbacks.notify(`Could not copy the link: ${(e as Error).message}`, 'error');
    }
  }

  /** Opens the Java dialog, preselecting the form the selection sits in. */
  exportJava(): void {
    showJavaExportDialog(
      this.store.doc.root,
      (message, kind) => this.callbacks.notify(message, kind),
      this.callbacks.selectedFormId()
    );
  }

  /** Reflects the canvas annotate mode on the toolbar button. */
  setAnnotateMode(on: boolean): void {
    this.annotateButton.classList.toggle('active', on);
    this.annotateButton.setAttribute('aria-pressed', String(on));
    this.annotateButton.title = on
      ? 'Stop placing callouts (Ctrl+M)'
      : 'Click the canvas to place a numbered review callout (Ctrl+M)';
  }

  private group(children: HTMLElement[]): HTMLElement {
    const group = div('es-toolbar-group');
    children.forEach(child => group.appendChild(child));
    return group;
  }

  /** Lets the workspace drive (and be driven by) the two panel buttons. */
  bindPanelToggles(workspace: Workspace): void {
    workspace.bindToggle('left', this.panelButtons.left);
    workspace.bindToggle('right', this.panelButtons.right);
  }

  private toggleButton(icon: string, title: string, shortcut: string): HTMLButtonElement {
    const button = h('button', 'es-button icon-only es-toggle');
    button.type = 'button';
    button.title = `${title} (${shortcutLabel(shortcut)})`;
    button.setAttribute('aria-label', title);
    button.appendChild(editorIcon(icon));
    return button;
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
        // The current mockup stays in its autosave slot and is reachable
        // through "Recent", so this no longer needs a confirmation.
        this.callbacks.newDocument(template.create());
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
    const recent = listAutosaves().filter(slot => slot.id !== this.callbacks.currentSlotId());
    recent.slice(0, 5).forEach((slot, index) => {
      entries.push({
        label: `Recent: ${slot.name}`,
        description: `Autosaved ${formatWhen(slot.savedAt)}.`,
        icon: 'undo',
        separatorBefore: index === 0,
        action: () => {
          const doc = restoreAutosave(slot.id);
          if (!doc) {
            this.callbacks.notify('That autosave could no longer be read.', 'error');
            return;
          }
          this.callbacks.openDocument(doc, slot.id);
          this.callbacks.notify(`Restored "${slot.name}".`);
        }
      });
    });

    entries.push({
      label: 'Copy share link',
      description: 'Puts the whole mockup into a URL. Nothing is uploaded - the document travels in the link itself.',
      icon: 'copy',
      separatorBefore: true,
      action: () => void this.copyShareLink()
    });
    entries.push({
      label: 'Check mockup…',
      description: 'Lists layout that standard Scout cannot reproduce, and settings that would break an export.',
      icon: 'help',
      separatorBefore: true,
      action: () => showCheckDialog(this.store.doc, id => this.store.select(id))
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
        label: 'Scout Java form…',
        description: 'One AbstractForm class to paste into your project. No form data, no service, no outline.',
        icon: 'code',
        shortcut: 'Ctrl+J',
        separatorBefore: true,
        action: () => this.exportJava()
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
