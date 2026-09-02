import {div, h, span} from '../render/dom';
import {renderRowsEditor} from './rowsEditor';
import type {MockupNode, PropertyValue} from '../model/types';

export interface TableEditorHost {
  /** Reads a tabular property with the widget default as the fallback. */
  read(node: MockupNode, name: string): string[][];
  /** Writes both properties in one undo step. */
  write(node: MockupNode, values: Record<string, PropertyValue>): void;
}

interface Column {
  text: string;
  align: 'left' | 'center' | 'right';
  width: number;
}

const ALIGNMENTS: Column['align'][] = ['left', 'center', 'right'];

/** Columns are stored as `[header, alignment, width]` triples. */
function parseColumns(raw: string[][]): Column[] {
  return raw.map(([text = '', align = 'left', width = '']) => ({
    text,
    align: (ALIGNMENTS as string[]).includes(align) ? (align as Column['align']) : 'left',
    width: Number(width) > 0 ? Number(width) : 0
  }));
}

const serializeColumns = (columns: Column[]): string[][] =>
  columns.map(column => [column.text, column.align, column.width ? String(column.width) : '']);

/**
 * Structured editor for a table's columns and its sample rows.
 *
 * Both are stored as arrays of arrays, so a cell can contain any character -
 * they used to be one string per row with `|` between the cells, which meant
 * the editor had to strip that character out of whatever was typed. The editor
 * also keeps the two in step: adding, removing or moving a column does the same
 * to every row, so the cell count can never drift away from the header count.
 */
export function renderTableEditor(node: MockupNode, host: TableEditorHost): HTMLElement {
  const wrapper = div('es-table-editor');
  let columns = parseColumns(host.read(node, 'columns'));
  let rows = host.read(node, 'rows').map(row => [...row]);

  const commit = (): void => {
    // Every row carries exactly one cell per column, padded or trimmed.
    const normalized = rows.map(row => columns.map((_, index) => row[index] ?? ''));
    host.write(node, {columns: serializeColumns(columns), rows: normalized});
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
      column.text = text.value.trim();
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
  wrapper.appendChild(renderRowsEditor({
    headers: columns.map(column => column.text || '—'),
    value: rows,
    onChange: next => {
      rows = next;
      commit();
    }
  }));

  return wrapper;
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
