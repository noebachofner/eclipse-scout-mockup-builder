/**
 * Inline SVG icons for the editor chrome.
 *
 * The Scout icon font is reserved for the mockup itself; the editor around it
 * uses its own set so a themed mockup can never change the look of the tool.
 * All icons share a 16x16 box and inherit `currentColor`.
 */
const PATHS: Record<string, string> = {
  file: 'M4 1.5h5L12.5 5v9.5h-9zM9 1.5V5h3.5',
  folderOpen: 'M1.5 12.5V3.5h4l1.5 2h6.5v2M1.5 12.5l2-5h11l-2 5z',
  save: 'M2.5 2.5h8l3 3v8h-11zM5 2.5v4h5v-4M5 13.5v-4h6v4',
  undo: 'M3 7.5h6.5a3 3 0 1 1 0 6H6M3 7.5l3-3M3 7.5l3 3',
  redo: 'M13 7.5H6.5a3 3 0 1 0 0 6H10M13 7.5l-3-3M13 7.5l-3 3',
  export: 'M8 10.5v-9M8 1.5 5 4.5M8 1.5l3 3M2.5 9.5v4h11v-4',
  image: 'M1.5 3.5h13v9h-13zM1.5 10l3.5-3 3 2.5L11 6l3.5 3.5M5 6.2a.8.8 0 1 0 0-.1',
  code: 'M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5',
  zoomIn: 'M7 12.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11ZM11 11l3.5 3.5M4.8 7h4.4M7 4.8v4.4',
  zoomOut: 'M7 12.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11ZM11 11l3.5 3.5M4.8 7h4.4',
  fit: 'M2 5.5v-3h3M14 5.5v-3h-3M2 10.5v3h3M14 10.5v3h-3',
  help: 'M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM6.2 6.2a1.9 1.9 0 1 1 2.4 2.2c-.4.2-.6.6-.6 1v.4M8 12.1v.01',
  trash: 'M2.5 4.5h11M6 4.5V2.5h4v2M4 4.5l.7 9.5h6.6l.7-9.5M6.5 7v4.5M9.5 7v4.5',
  copy: 'M5.5 5.5h8v8h-8zM2.5 10.5v-8h8',
  up: 'M8 12.5v-9M4.5 7 8 3.5 11.5 7',
  down: 'M8 3.5v9M4.5 9 8 12.5 11.5 9',
  search: 'M7 12.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11ZM11 11l3.5 3.5',
  reset: 'M13 8a5 5 0 1 1-1.6-3.6M13 1.5V5h-3.5',
  panelLeft: 'M1.5 2.5h13v11h-13zM6.5 2.5v11M3 6h2M3 8.5h2',
  panelRight: 'M1.5 2.5h13v11h-13zM9.5 2.5v11M11 6h2M11 8.5h2',
  annotate: 'M8 1.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13ZM6.3 6.1a1.8 1.8 0 1 1 2.3 2.1c-.4.2-.6.5-.6.9v.3M8 11.9v.01',
  grid: 'M1.5 1.5h13v13h-13zM6 1.5v13M10 1.5v13M1.5 6h13M1.5 10h13',
  chevronDown: 'M4 6.5 8 10.5l4-4',
  chevronRight: 'M6.5 4 10.5 8l-4 4'
};

export function editorIcon(name: keyof typeof PATHS | string, className = ''): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.3');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  if (className) svg.setAttribute('class', className);
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', PATHS[name] ?? PATHS.file);
  svg.appendChild(path);
  return svg;
}

/** Platform-aware shortcut label, e.g. `⌘Z` on a Mac and `Ctrl+Z` elsewhere. */
export function shortcutLabel(keys: string): string {
  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  if (!mac) return keys;
  return keys
    .replace(/Ctrl\+/g, '⌘')
    .replace(/Shift\+/g, '⇧')
    .replace(/Alt\+/g, '⌥');
}
