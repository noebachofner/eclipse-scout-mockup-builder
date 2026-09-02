import {div, h, span} from '../render/dom';

export interface RowsEditorOptions {
  headers: string[];
  value: string[][];
  onChange(rows: string[][]): void;
  addLabel?: string;
}

/**
 * A compact grid of text inputs for a `string[][]` property.
 *
 * Used wherever a widget carries a small table of sample data - a table's rows,
 * calendar appointments, planner activities, chart series. Storing these as
 * arrays rather than as one delimited string per line means no value can be
 * broken by the character that used to separate the fields.
 */
export function renderRowsEditor(options: RowsEditorOptions): HTMLElement {
  const {headers, addLabel = '+ Row'} = options;
  const rows = options.value.map(row => headers.map((_, index) => row[index] ?? ''));

  const wrapper = div('es-rows-editor');
  const scroller = div('es-rows-scroll');

  const head = div('es-rows-row header');
  headers.forEach(header => head.appendChild(span('es-rows-head', header)));
  head.appendChild(span('es-rows-head spacer', ''));
  scroller.appendChild(head);

  rows.forEach((cells, rowIndex) => {
    const row = div('es-rows-row');
    headers.forEach((_, columnIndex) => {
      const input = h('input', 'es-input es-rows-cell') as HTMLInputElement;
      input.value = cells[columnIndex] ?? '';
      input.addEventListener('change', () => {
        rows[rowIndex][columnIndex] = input.value;
        options.onChange(rows);
      });
      row.appendChild(input);
    });
    const remove = h('button', 'es-table-icon');
    remove.type = 'button';
    remove.textContent = '✕';
    remove.title = 'Remove the row';
    remove.addEventListener('click', () => {
      rows.splice(rowIndex, 1);
      options.onChange(rows);
    });
    row.appendChild(remove);
    scroller.appendChild(row);
  });

  wrapper.appendChild(scroller);

  const add = h('button', 'es-mini-button');
  add.type = 'button';
  add.textContent = addLabel;
  add.addEventListener('click', () => {
    rows.push(headers.map(() => ''));
    options.onChange(rows);
  });
  wrapper.appendChild(add);
  return wrapper;
}
