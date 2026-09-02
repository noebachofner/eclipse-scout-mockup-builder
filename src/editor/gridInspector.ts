import {div, span} from '../render/dom';
import {pageBoxOf, placeOver} from './geometry';

export function renderGridInspector(host: HTMLElement, page: HTMLElement, zoom: number): HTMLElement {
  const layer = div('es-grid-inspector');

  host.querySelectorAll<HTMLElement>('.logical-grid').forEach(grid => {
    const box = div('es-grid-box');
    placeOver(box, pageBoxOf(grid, page, zoom));

    const style = getComputedStyle(grid);
    const columns = trackSizes(style.gridTemplateColumns);
    const rows = trackSizes(style.gridTemplateRows);
    const columnGap = parseFloat(style.columnGap) || 0;
    const rowGap = parseFloat(style.rowGap) || 0;

    let offset = parseFloat(style.paddingLeft) || 0;
    columns.forEach((width, index) => {
      offset += width;
      if (index < columns.length - 1) {
        const line = div('es-grid-line vertical');
        line.style.left = `${offset + columnGap / 2}px`;
        box.appendChild(line);
        offset += columnGap;
      }
    });
    offset = parseFloat(style.paddingTop) || 0;
    rows.forEach((height, index) => {
      offset += height;
      if (index < rows.length - 1) {
        const line = div('es-grid-line horizontal');
        line.style.top = `${offset + rowGap / 2}px`;
        box.appendChild(line);
        offset += rowGap;
      }
    });

    const caption = div('es-grid-caption', `${columns.length} × ${rows.length}`);
    caption.title = `${columns.length} logical columns, ${rows.length} rows`;
    box.appendChild(caption);
    layer.appendChild(box);
  });

  host.querySelectorAll<HTMLElement>('[data-grid-cell]').forEach(el => {
    const [x, y, w, h, weightX, weightY] = (el.dataset.gridCell ?? '').split(',');
    const cellBox = pageBoxOf(el, page, zoom);
    const badge = div('es-grid-badge');
    badge.style.left = `${cellBox.left}px`;
    badge.style.top = `${cellBox.top}px`;
    badge.appendChild(span('es-grid-badge-pos', `${x},${y}`));
    badge.appendChild(span('es-grid-badge-size', `${w}×${h}`));
    badge.title = `gridX ${x}, gridY ${y}, w ${w}, h ${h}\nweightX ${weightX}, weightY ${weightY}`;
    if (Number(weightY) > 0) badge.appendChild(span('es-grid-badge-weight', `↕${weightY}`));
    layer.appendChild(badge);
  });

  return layer;
}

function trackSizes(value: string): number[] {
  if (!value || value === 'none') return [];
  return value.split(' ').map(parseFloat).filter(size => Number.isFinite(size));
}
