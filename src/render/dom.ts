export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

export function div(className?: string, text?: string): HTMLDivElement {
  return h('div', className, text);
}

export function span(className?: string, text?: string): HTMLSpanElement {
  return h('span', className, text);
}

export function append<T extends HTMLElement>(parent: T, ...children: (Node | null | undefined)[]): T {
  for (const child of children) {
    if (child) parent.appendChild(child);
  }
  return parent;
}

export function css(el: HTMLElement, styles: Record<string, string | number | null | undefined>): void {
  for (const [key, value] of Object.entries(styles)) {
    if (value === null || value === undefined || value === '') continue;
    el.style.setProperty(key, String(value));
  }
}

export function clear(el: HTMLElement): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}
