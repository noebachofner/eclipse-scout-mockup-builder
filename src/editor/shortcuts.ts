import {div, h, span} from '../render/dom';
import {shortcutLabel} from './icons';

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
      ['Ctrl+Shift+E', 'Export as PNG (2×)']
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
      ['[', 'Show or hide the element palette'],
      [']', 'Show or hide the property panel'],
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
    title: 'Adding widgets',
    items: [
      ['Click in Elements', 'Add to the current selection'],
      ['Drag onto the canvas', 'Add to the container under the pointer'],
      ['Drop a file on the window', 'Open that .esmockup']
    ]
  }
];

/** Modal overlay listing every shortcut and interaction of the editor. */
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

  const close = (): void => {
    backdrop.remove();
    document.removeEventListener('keydown', onKeyDown, true);
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
