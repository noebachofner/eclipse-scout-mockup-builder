import {div, h, span} from '../render/dom';
import {shortcutLabel} from './icons';
import {trapFocus} from './focusTrap';

interface ShortcutGroup {
  title: string;
  items: [string, string][];
}

const GROUPS: ShortcutGroup[] = [
  {
    title: 'File',
    items: [
      ['Ctrl+O', 'Open an .esmockup file'],
      ['Ctrl+S', 'Save the mockup'],
      ['Ctrl+E', 'Export as standalone HTML'],
      ['Ctrl+Shift+E', 'Export as PNG (2×)'],
      ['Ctrl+J', 'Export the selected form as Scout Java']
    ]
  },
  {
    title: 'Edit',
    items: [
      ['Ctrl+Z', 'Undo'],
      ['Ctrl+Shift+Z', 'Redo'],
      ['Ctrl+D', 'Duplicate the selection'],
      ['Delete', 'Remove the selection'],
      ['Escape', 'Select the desktop']
    ]
  },
  {
    title: 'Canvas',
    items: [
      ['Ctrl+ +  /  Ctrl+ −', 'Zoom in and out'],
      ['Ctrl+0', 'Zoom to 100 %'],
      ['Ctrl+1', 'Fit the mockup into the window'],
      ['/', 'Jump to the widget search'],
      ['Ctrl+B', 'Show or hide the element palette'],
      ['Ctrl+Shift+B', 'Show or hide the property panel'],
      ['Ctrl+G', "Show Scout's logical grid over the mockup"],
      ['Ctrl+M', 'Place review callouts'],
      ['Right click', 'Widget menu: add, duplicate, reorder, remove'],
      ['Drag a splitter', 'Resize a side panel (double click resets it)']
    ]
  },
  {
    title: 'Free placement',
    items: [
      ['Drag a handle', 'Resize from any corner or edge'],
      ['Drag the widget', 'Move it'],
      ['Alt while dragging', 'Disable the 5 px snapping'],
      ['Arrow keys', 'Move by 5 px (Alt: 1 px)'],
      ['Shift + arrows', 'Resize by 5 px (Alt: 1 px)']
    ]
  },
  {
    title: 'Without a mouse',
    items: [
      ['Tab', 'Move between toolbar, palette, structure tree and properties'],
      ['Arrows on the canvas', 'Walk the widget tree: siblings, parent, first child'],
      ['↑ ↓ in the palette', 'Walk the widget list, Enter adds the focused one'],
      ['↑ ↓ in the structure', 'Walk the widget tree, Enter selects'],
      ['← → in the structure', 'Collapse or expand, or step to parent and child'],
      ['Menu key', 'Open the widget menu on the focused row']
    ]
  },
  {
    title: 'Adding widgets',
    items: [
      ['Click in Elements', 'Add to the current selection'],
      ['Drag onto the canvas', 'Add to the container under the pointer'],
      ['Drop a file on the window', 'Open that .esmockup']
    ]
  }
];

export function showShortcutsDialog(): void {
  document.querySelector('.es-modal-backdrop')?.remove();

  const backdrop = div('es-modal-backdrop');
  const dialog = div('es-modal');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', 'Keyboard shortcuts');

  const header = div('es-modal-header');
  header.appendChild(span('es-modal-title', 'Keyboard shortcuts'));
  const closeButton = h('button', 'es-modal-close');
  closeButton.type = 'button';
  closeButton.textContent = '✕';
  closeButton.title = 'Close (Esc)';
  header.appendChild(closeButton);
  dialog.appendChild(header);

  const body = div('es-modal-body');
  for (const group of GROUPS) {
    const section = div('es-shortcut-group');
    section.appendChild(div('es-shortcut-group-title', group.title));
    for (const [keys, what] of group.items) {
      const row = div('es-shortcut');
      row.appendChild(span('es-shortcut-keys', shortcutLabel(keys)));
      row.appendChild(span('es-shortcut-text', what));
      section.appendChild(row);
    }
    body.appendChild(section);
  }
  dialog.appendChild(body);
  backdrop.appendChild(dialog);
  document.body.appendChild(backdrop);

  const release = trapFocus(dialog);
  const close = (): void => {
    backdrop.remove();
    document.removeEventListener('keydown', onKeyDown, true);
    release();
  };
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  };
  document.addEventListener('keydown', onKeyDown, true);
  closeButton.addEventListener('click', close);
  backdrop.addEventListener('mousedown', event => {
    if (event.target === backdrop) close();
  });
  closeButton.focus();
}
