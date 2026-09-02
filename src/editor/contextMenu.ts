import {div, h, span} from '../render/dom';
import {editorIcon, shortcutLabel} from './icons';

export interface ContextMenuEntry {
  label: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  separatorBefore?: boolean;
  submenu?: ContextMenuEntry[];
  action?: () => void;
}

export function showContextMenu(entries: ContextMenuEntry[], x: number, y: number, restoreFocusTo?: HTMLElement | null): void {
  closeContextMenus();

  const menu = buildMenu(entries, close);
  document.body.appendChild(menu);
  place(menu, x, y);
  focusItem(menu, 0);

  const dismiss = (event: Event): void => {
    if (event.target instanceof Element && event.target.closest('.es-context-menu')) return;
    close();
  };
  const onEscape = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    close();
  };
  setTimeout(() => {
    document.addEventListener('mousedown', dismiss, true);
    document.addEventListener('keydown', onEscape, true);
    window.addEventListener('blur', dismiss);
  });

  function close(): void {
    document.removeEventListener('mousedown', dismiss, true);
    document.removeEventListener('keydown', onEscape, true);
    window.removeEventListener('blur', dismiss);
    closeContextMenus();
    restoreFocusTo?.focus();
  }
}

export function closeContextMenus(): void {
  document.querySelectorAll('.es-context-menu').forEach(menu => menu.remove());
}

function buildMenu(entries: ContextMenuEntry[], close: () => void, depth = 0): HTMLElement {
  const menu = div('es-context-menu');
  menu.setAttribute('role', 'menu');
  menu.dataset.depth = String(depth);

  for (const entry of entries) {
    if (entry.separatorBefore) menu.appendChild(div('es-context-menu-separator'));
    const item = h('button', 'es-context-menu-item');
    item.type = 'button';
    item.setAttribute('role', entry.submenu ? 'menuitem' : 'menuitem');
    item.disabled = !!entry.disabled;
    item.tabIndex = -1;
    if (entry.icon) item.appendChild(editorIcon(entry.icon));
    item.appendChild(span('es-context-menu-label', entry.label));
    if (entry.shortcut) item.appendChild(span('es-context-menu-shortcut', shortcutLabel(entry.shortcut)));
    if (entry.submenu) {
      item.appendChild(editorIcon('chevronRight', 'es-context-menu-caret'));
      item.setAttribute('aria-haspopup', 'menu');
      const open = (): void => openSubmenu(item, entry.submenu ?? [], close, depth + 1);
      item.addEventListener('mouseenter', open);
      item.addEventListener('click', open);
    } else {
      item.addEventListener('mouseenter', () => closeDeeperThan(depth));
      item.addEventListener('click', () => {
        close();
        entry.action?.();
      });
    }
    item.addEventListener('keydown', event => onKeyDown(event, menu, entry, close, depth, item));
    menu.appendChild(item);
  }
  return menu;
}

function openSubmenu(anchor: HTMLElement, entries: ContextMenuEntry[], close: () => void, depth: number): void {
  closeDeeperThan(depth - 1);
  const submenu = buildMenu(entries, close, depth);
  const rect = anchor.getBoundingClientRect();
  document.body.appendChild(submenu);
  place(submenu, rect.right - 4, rect.top - 4);
}

function closeDeeperThan(depth: number): void {
  document.querySelectorAll<HTMLElement>('.es-context-menu').forEach(menu => {
    if (Number(menu.dataset.depth ?? 0) > depth) menu.remove();
  });
}

function onKeyDown(
  event: KeyboardEvent,
  menu: HTMLElement,
  entry: ContextMenuEntry,
  close: () => void,
  depth: number,
  item: HTMLElement
): void {
  const items = [...menu.querySelectorAll<HTMLButtonElement>('.es-context-menu-item:not(:disabled)')];
  const index = items.indexOf(item as HTMLButtonElement);
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      items[(index + 1) % items.length]?.focus();
      return;
    case 'ArrowUp':
      event.preventDefault();
      items[(index - 1 + items.length) % items.length]?.focus();
      return;
    case 'Home':
      event.preventDefault();
      items[0]?.focus();
      return;
    case 'End':
      event.preventDefault();
      items[items.length - 1]?.focus();
      return;
    case 'ArrowRight':
      if (entry.submenu) {
        event.preventDefault();
        openSubmenu(item, entry.submenu, close, depth + 1);
        const submenu = document.querySelector<HTMLElement>(`.es-context-menu[data-depth="${depth + 1}"]`);
        if (submenu) focusItem(submenu, 0);
      }
      return;
    case 'ArrowLeft':
      if (depth > 0) {
        event.preventDefault();
        closeDeeperThan(depth - 1);
        focusItem(document.querySelector<HTMLElement>(`.es-context-menu[data-depth="${depth - 1}"]`), 0);
      }
      return;
    case 'Escape':
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    case 'Tab':
      event.preventDefault();
      close();
      return;
    default:
  }
}

function focusItem(menu: HTMLElement | null, index: number): void {
  menu?.querySelectorAll<HTMLButtonElement>('.es-context-menu-item:not(:disabled)')[index]?.focus();
}

function place(menu: HTMLElement, x: number, y: number): void {
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
  const rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth) menu.style.left = `${Math.max(4, window.innerWidth - rect.width - 8)}px`;
  if (rect.bottom > window.innerHeight) menu.style.top = `${Math.max(4, window.innerHeight - rect.height - 8)}px`;
}
