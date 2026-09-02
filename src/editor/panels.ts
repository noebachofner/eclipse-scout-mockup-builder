import {div, h, span} from '../render/dom';
import {editorIcon} from './icons';

export type PanelSide = 'left' | 'right';

interface PanelState {
  leftWidth: number;
  rightWidth: number;
  leftCollapsed: boolean;
  rightCollapsed: boolean;
}

const STORAGE_KEY = 'es-mockup.layout.v1';

const LIMITS: Record<PanelSide, {min: number; max: number; fallback: number}> = {
  left: {min: 190, max: 420, fallback: 260},
  right: {min: 250, max: 540, fallback: 320}
};

function readState(): PanelState {
  const fallback: PanelState = {
    leftWidth: LIMITS.left.fallback,
    rightWidth: LIMITS.right.fallback,
    leftCollapsed: false,
    rightCollapsed: false
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<PanelState>;
    return {
      leftWidth: clamp('left', Number(parsed.leftWidth) || fallback.leftWidth),
      rightWidth: clamp('right', Number(parsed.rightWidth) || fallback.rightWidth),
      leftCollapsed: !!parsed.leftCollapsed,
      rightCollapsed: !!parsed.rightCollapsed
    };
  } catch {
    // A blocked or corrupt storage must never keep the editor from starting.
    return fallback;
  }
}

function clamp(side: PanelSide, width: number): number {
  const {min, max} = LIMITS[side];
  return Math.min(max, Math.max(min, Math.round(width)));
}

/**
 * The editor's three column workspace: two side panels around the canvas, each
 * one collapsible and draggable. Widths survive a reload so everybody can keep
 * the proportions they like, and collapsing both turns the window into a plain
 * canvas for a final look at the mockup.
 */
export class Workspace {
  readonly element: HTMLElement;
  private readonly state: PanelState;
  private readonly panels: Record<PanelSide, HTMLElement>;
  private readonly splitters: Record<PanelSide, HTMLElement>;
  private readonly toggleButtons: Record<PanelSide, HTMLButtonElement[]> = {left: [], right: []};
  private readonly listeners: Array<() => void> = [];

  constructor(left: HTMLElement, canvas: HTMLElement, right: HTMLElement) {
    this.state = readState();
    this.panels = {left, right};

    this.splitters = {
      left: this.buildSplitter('left', 'Elements'),
      right: this.buildSplitter('right', 'Properties')
    };

    this.element = div('es-main');
    this.element.appendChild(left);
    this.element.appendChild(this.splitters.left);
    this.element.appendChild(canvas);
    this.element.appendChild(this.splitters.right);
    this.element.appendChild(right);

    this.apply('left');
    this.apply('right');
  }

  isCollapsed(side: PanelSide): boolean {
    return side === 'left' ? this.state.leftCollapsed : this.state.rightCollapsed;
  }

  toggle(side: PanelSide): void {
    this.setCollapsed(side, !this.isCollapsed(side));
  }

  setCollapsed(side: PanelSide, collapsed: boolean): void {
    if (side === 'left') this.state.leftCollapsed = collapsed;
    else this.state.rightCollapsed = collapsed;
    this.apply(side);
    this.persist();
  }

  /** Registers a button elsewhere in the chrome that mirrors the panel state. */
  bindToggle(side: PanelSide, button: HTMLButtonElement): void {
    this.toggleButtons[side].push(button);
    button.addEventListener('click', () => this.toggle(side));
    this.syncButtons(side);
  }

  /** Called after a resize or collapse so the canvas can re-fit its zoom. */
  onChange(listener: () => void): void {
    this.listeners.push(listener);
  }

  /* ---------------------------------------------------------------- internals */

  private buildSplitter(side: PanelSide, label: string): HTMLElement {
    const splitter = div(`es-splitter es-splitter-${side}`);
    splitter.setAttribute('role', 'separator');
    splitter.setAttribute('aria-orientation', 'vertical');

    const grip = h('button', 'es-splitter-grip');
    grip.type = 'button';
    grip.appendChild(editorIcon(side === 'left' ? 'panelLeft' : 'panelRight'));
    grip.addEventListener('click', () => this.toggle(side));
    splitter.appendChild(grip);
    splitter.appendChild(span('es-splitter-label', label));
    this.toggleButtons[side].push(grip);

    splitter.addEventListener('pointerdown', event => {
      if (this.isCollapsed(side)) return;
      if ((event.target as HTMLElement).closest('.es-splitter-grip')) return;
      event.preventDefault();
      this.startDrag(side, event);
    });
    splitter.addEventListener('dblclick', event => {
      if ((event.target as HTMLElement).closest('.es-splitter-grip')) return;
      this.resetWidth(side);
    });
    return splitter;
  }

  private startDrag(side: PanelSide, event: PointerEvent): void {
    const splitter = this.splitters[side];
    const panel = this.panels[side];
    const startX = event.clientX;
    const startWidth = panel.getBoundingClientRect().width;
    splitter.setPointerCapture(event.pointerId);
    splitter.classList.add('dragging');
    document.body.classList.add('es-resizing-columns');

    const move = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientX - startX;
      this.setWidth(side, startWidth + (side === 'left' ? delta : -delta));
    };
    const stop = () => {
      splitter.releasePointerCapture(event.pointerId);
      splitter.removeEventListener('pointermove', move);
      splitter.removeEventListener('pointerup', stop);
      splitter.removeEventListener('pointercancel', stop);
      splitter.classList.remove('dragging');
      document.body.classList.remove('es-resizing-columns');
      this.persist();
    };
    splitter.addEventListener('pointermove', move);
    splitter.addEventListener('pointerup', stop);
    splitter.addEventListener('pointercancel', stop);
  }

  private setWidth(side: PanelSide, width: number): void {
    const value = clamp(side, width);
    if (side === 'left') this.state.leftWidth = value;
    else this.state.rightWidth = value;
    this.apply(side);
  }

  private resetWidth(side: PanelSide): void {
    this.setWidth(side, LIMITS[side].fallback);
    this.persist();
  }

  private apply(side: PanelSide): void {
    const collapsed = this.isCollapsed(side);
    const panel = this.panels[side];
    const width = side === 'left' ? this.state.leftWidth : this.state.rightWidth;
    panel.style.width = `${width}px`;
    panel.hidden = collapsed;
    this.splitters[side].classList.toggle('collapsed', collapsed);
    this.splitters[side].setAttribute('aria-valuenow', collapsed ? '0' : String(width));
    this.syncButtons(side);
    this.listeners.forEach(listener => listener());
  }

  private syncButtons(side: PanelSide): void {
    const collapsed = this.isCollapsed(side);
    const name = side === 'left' ? 'element palette' : 'property panel';
    this.toggleButtons[side].forEach(button => {
      button.classList.toggle('active', !collapsed);
      button.setAttribute('aria-pressed', String(!collapsed));
      const shortcut = side === 'left' ? 'Ctrl+B' : 'Ctrl+Shift+B';
      button.title = `${collapsed ? 'Show' : 'Hide'} the ${name} (${shortcut})`;
      button.setAttribute('aria-label', button.title);
    });
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Storage is optional; the layout simply resets on the next visit.
    }
  }
}
