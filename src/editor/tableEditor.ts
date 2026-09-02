import {div, h, span} from '../render/dom';
import type {MockupNode, PropertyValue} from '../model/types';
import {getWidget} from '../model/catalog';

export interface TableEditorHost {
  /** Reads a property with the widget default as the fallback. */
  read(node: MockupNode, name: string): string;
  /** Writes both properties in one undo step. */
  write(node: MockupNode, values: Record<string, PropertyValue>): void;
}

interface Column {
  text: string;
  align: 'left' | 'center' | 'right';
  width: number;
}

const ALIGNMENTS: Column['align'][] = ['left', 'center', 'right'];

function parseColumns(raw: string): Column[] {
  return raw.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
    const [text = '', align = 'left', width = ''] = line.split('|').map(part => part.trim());
    return {
      text,
      align: (ALIGNMENTS as string[]).includes(align) ? (align as Column['align']) : 'left',
      width: Number(width) > 0 ? Number(width) : 0
    };
  });
}

const serializeColumns = (columns: Column[]): string =>
  columns.map(column => `${column.text}|${column.align}|${column.width || ''}`).join('\n');

const parseRows = (raw: string): string[][] =>
  raw.split('\n').map(line => line.trim()).filter(Boolean).map(line => line.split('|').map(cell => cell.trim()));

const serializeRows = (rows: string[][]): string => rows.map(row => row.join('|')).join('\n');

/**
 * Structured editor for a table's columns and its sample rows.
 *
 * The two are stored as text (`Header|align|width` per line, cells separated by
 * `|`), which is compact in the file but painful to edit by hand and silently
 * wrong as soon as the number of cells stops matching the number of columns.
 * This editor keeps them in step: adding, removing or moving a column does the
 * same to every row.
 */
export function renderTableEditor(node: MockupNode, host: TableEditorHost): HTMLElement {
  const wrapper = div('es-table-editor');
  const defaults = getWidget(node.objectType)?.defaults ?? {};
  let columns = parseColumns(host.read(node, 'columns') || String(defaults.columns ?? ''));
  let rows = parseRows(host.read(node, 'rows') || String(defaults.rows ?? ''));

  const commit = (): void => {
    // Every row carries exactly one cell per column, padded or trimmed.
    const normalized = rows.map(row => columns.map((_, index) => row[index] ?? ''));
    host.write(node, {columns: serializeColumns(columns), rows: serializeRows(normalized)});
  };

  // --- columns --------------------------------------------------------------
  wrapper.appendChild(span('es-table-editor-title', 'Columns'));
  const columnList = div('es-table-columns');
  columns.forEach((column, index) => {
    const row = div('es-table-column');

    const text = h('input', 'es-input es-table-column-text') as HTMLInputElement;
    text.value = column.text;
    text.placeholder = 'Header';
    text.addEventListener('change', () => {
      column.text = stripPipes(text);
      commit();
    });
    row.appendChild(text);

    const align = h('select', 'es-input es-table-column-align') as HTMLSelectElement;
    ALIGNMENTS.forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      align.appendChild(option);
    });
    align.value = column.align;
    align.addEventListener('change', () => {
      column.align = align.value as Column['align'];
      commit();
    });
    row.appendChild(align);

    const width = h('input', 'es-input es-table-column-width') as HTMLInputElement;
    width.type = 'number';
    width.min = '0';
    width.placeholder = 'auto';
    width.value = column.width ? String(column.width) : '';
    width.title = 'Width in pixels. Empty means the column takes the remaining space.';
    width.addEventListener('change', () => {
      column.width = Number(width.value) > 0 ? Number(width.value) : 0;
      commit();
    });
    row.appendChild(width);

    row.appendChild(iconButton('↑', 'Move up', index > 0, () => {
      [columns[index - 1], columns[index]] = [columns[index], columns[index - 1]];
      rows = rows.map(cells => {
        const copy = [...cells];
        [copy[index - 1], copy[index]] = [copy[index] ?? '', copy[index - 1] ?? ''];
        return copy;
      });
      commit();
    }));
    row.appendChild(iconButton('↓', 'Move down', index < columns.length - 1, () => {
      [columns[index + 1], columns[index]] = [columns[index], columns[index + 1]];
      rows = rows.map(cells => {
        const copy = [...cells];
        [copy[index + 1], copy[index]] = [copy[index] ?? '', copy[index + 1] ?? ''];
        return copy;
      });
      commit();
    }));
    row.appendChild(iconButton('✕', 'Remove the column', columns.length > 1, () => {
      columns.splice(index, 1);
      rows = rows.map(cells => cells.filter((_, i) => i !== index));
      commit();
    }));

    columnList.appendChild(row);
  });
  wrapper.appendChild(columnList);

  const addColumn = h('button', 'es-mini-button');
  addColumn.type = 'button';
  addColumn.textContent = '+ Column';
  addColumn.addEventListener('click', () => {
    columns.push({text: `Column ${columns.length + 1}`, align: 'left', width: 0});
    commit();
  });
  wrapper.appendChild(addColumn);

  // --- rows -----------------------------------------------------------------
  wrapper.appendChild(span('es-table-editor-title', 'Rows'));
  const grid = div('es-table-rows');
  const scroller = div('es-table-rows-scroll');
  const headerRow = div('es-table-row header');
  columns.forEach(column => headerRow.appendChild(span('es-table-cell-head', column.text || '—')));
  headerRow.appendChild(span('es-table-cell-head', ''));
  scroller.appendChild(headerRow);

  rows.forEach((cells, rowIndex) => {
    const row = div('es-table-row');
    columns.forEach((_, columnIndex) => {
      const input = h('input', 'es-input es-table-cell') as HTMLInputElement;
      input.value = cells[columnIndex] ?? '';
      input.addEventListener('change', () => {
        rows[rowIndex][columnIndex] = stripPipes(input);
        commit();
      });
      row.appendChild(input);
    });
    row.appendChild(iconButton('✕', 'Remove the row', true, () => {
      rows.splice(rowIndex, 1);
      commit();
    }));
    scroller.appendChild(row);
  });
  grid.appendChild(scroller);
  wrapper.appendChild(grid);

  const addRow = h('button', 'es-mini-button');
  addRow.type = 'button';
  addRow.textContent = '+ Row';
  addRow.addEventListener('click', () => {
    rows.push(columns.map(() => ''));
    commit();
  });
  wrapper.appendChild(addRow);

  return wrapper;
}

/** `|` separates the stored cells, so it cannot appear inside one. */
function stripPipes(input: HTMLInputElement): string {
  const cleaned = input.value.replace(/\|/g, '/').trim();
  if (cleaned !== input.value.trim()) input.value = cleaned;
  return cleaned;
}

function iconButton(glyph: string, title: string, enabled: boolean, action: () => void): HTMLButtonElement {
  const button = h('button', 'es-table-icon');
  button.type = 'button';
  button.textContent = glyph;
  button.title = title;
  button.disabled = !enabled;
  button.addEventListener('click', action);
  return button;
}
