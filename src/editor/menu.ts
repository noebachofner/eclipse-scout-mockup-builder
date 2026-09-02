import {div, h, span} from '../render/dom';
import {editorIcon, shortcutLabel} from './icons';

export interface MenuEntry {
  label: string;
  description?: string;
  icon?: string;
  /** Displayed right-aligned, e.g. `Ctrl+S`. */
  shortcut?: string;
  disabled?: boolean;
  separatorBefore?: boolean;
  action(): void;
}

/**
 * A small dropdown menu with the keyboard behaviour people expect: arrows move
 * through the entries, Home/End jump, Enter activates, Escape closes and
 * returns the focus to the button, and Tab or an outside click dismisses it.
 */
export class DropdownMenu {
  readonly element: HTMLElement;
  readonly button: HTMLButtonElement;
  private readonly list: HTMLElement;
  private closeListener: ((event: MouseEvent) => void) | null = null;

  constructor(label: string, options: {icon?: string; title?: string; entries: () => MenuEntry[]}) {
    this.element = div('es-menu-button');
    this.button = h('button', 'es-button with-caret');
    this.button.type = 'button';
    this.button.setAttribute('aria-haspopup', 'menu');
    this.button.setAttribute('aria-expanded', 'false');
    if (options.title) this.button.title = options.title;
    if (options.icon) this.button.appendChild(editorIcon(options.icon));
    this.button.appendChild(span('es-button-label', label));
    this.button.addEventListener('click', () => this.toggle(options.entries));
    this.button.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (!this.isOpen) this.open(options.entries);
        this.focusItem(0);
      }
    });
    this.element.appendChild(this.button);

    this.list = div('es-dropdown');
    this.list.setAttribute('role', 'menu');
    this.element.appendChild(this.list);
  }

  get isOpen(): boolean {
    return this.element.classList.contains('open');
  }

  toggle(entries: () => MenuEntry[]): void {
    if (this.isOpen) this.close();
    else this.open(entries);
  }

  open(entries: () => MenuEntry[]): void {
    // Only one menu at a time.
    document.querySelectorAll('.es-menu-button.open').forEach(el => el.classList.remove('open'));
    this.render(entries());
    this.element.classList.add('open');
    this.button.setAttribute('aria-expanded', 'true');
    this.closeListener = (event: MouseEvent) => {
      if (!this.element.contains(event.target as Node)) this.close();
    };
    document.addEventListener('mousedown', this.closeListener);
  }

  close(focusButton = false): void {
    this.element.classList.remove('open');
    this.button.setAttribute('aria-expanded', 'false');
    if (this.closeListener) {
      document.removeEventListener('mousedown', this.closeListener);
      this.closeListener = null;
    }
    if (focusButton) this.button.focus();
  }

  private render(entries: MenuEntry[]): void {
    this.list.replaceChildren();
    for (const entry of entries) {
      if (entry.separatorBefore) this.list.appendChild(div('es-dropdown-separator'));
      const item = h('button', 'es-dropdown-item');
      item.type = 'button';
      item.setAttribute('role', 'menuitem');
      item.disabled = !!entry.disabled;

      const icon = div('es-dropdown-icon');
      if (entry.icon) icon.appendChild(editorIcon(entry.icon));
      item.appendChild(icon);

      const text = div('es-dropdown-text');
      text.appendChild(span('es-dropdown-label', entry.label));
      if (entry.description) text.appendChild(span('es-dropdown-description', entry.description));
      item.appendChild(text);

      if (entry.shortcut) item.appendChild(span('es-dropdown-shortcut', shortcutLabel(entry.shortcut)));

      item.addEventListener('click', () => {
        this.close();
        entry.action();
      });
      item.addEventListener('keydown', event => this.onItemKeyDown(event));
      this.list.appendChild(item);
    }
  }

  private get items(): HTMLButtonElement[] {
    return [...this.list.querySelectorAll<HTMLButtonElement>('.es-dropdown-item:not(:disabled)')];
  }

  private focusItem(index: number): void {
    const items = this.items;
    if (!items.length) return;
    const clamped = (index + items.length) % items.length;
    items[clamped].focus();
  }

  private onItemKeyDown(event: KeyboardEvent): void {
    const items = this.items;
    const index = items.indexOf(event.target as HTMLButtonElement);
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusItem(index + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusItem(index - 1);
        break;
      case 'Home':
        event.preventDefault();
        this.focusItem(0);
        break;
      case 'End':
        event.preventDefault();
        this.focusItem(items.length - 1);
        break;
      case 'Escape':
        event.preventDefault();
        this.close(true);
        break;
      case 'Tab':
        this.close();
        break;
      default:
        break;
    }
  }
}
