import {registerWidgets, type WidgetDef} from './registry';
import {formFieldDefaults, formFieldProps, GROUP_CONTENT, GROUP_LAYOUT, GROUP_STYLE} from './common';
import {div, span} from '../../render/dom';
import {checkBox, lines, rows} from '../../render/parts';
import {renderIcon} from '../../render/icons';
import type {RenderContext} from './registry';
import type {MockupNode, PropertyValue} from '../types';

const DEFAULT_COLUMNS: string[][] = [
  ['Name', 'left', '200'],
  ['City', 'left', '140'],
  ['Amount', 'right', '100']
];
const DEFAULT_ROWS: string[][] = [
  ['Ada Lovelace', 'London', "1 250.00"],
  ['Alan Turing', 'Manchester', '980.50'],
  ['Grace Hopper', 'New York', "3 400.00"]
];

interface ColumnSpec {
  text: string;
  align: 'left' | 'center' | 'right';
  width: number;
}

function cellGrid(raw: unknown, fallback: string[][]): string[][] {
  if (!Array.isArray(raw)) return fallback;
  return raw.filter(Array.isArray).map(row => row.map(cell => String(cell ?? '')));
}

function parseColumns(raw: unknown): ColumnSpec[] {
  return cellGrid(raw, DEFAULT_COLUMNS).map(([text = '', align = 'left', width = '']) => ({
    text,
    align: align === 'right' || align === 'center' ? align : 'left',
    width: Number(width) > 0 ? Number(width) : 0
  }));
}

function renderTable(ctx: RenderContext, node: MockupNode): HTMLElement {
  const columns = parseColumns(ctx.prop<string[][]>(node, 'columns', DEFAULT_COLUMNS));
  const rows = cellGrid(ctx.prop<string[][]>(node, 'rows', DEFAULT_ROWS), DEFAULT_ROWS);
  const checkable = ctx.prop<boolean>(node, 'checkable', false);
  const checkedRows = new Set(lines(ctx.prop<string>(node, 'checkedRows', ''), []).map(Number));
  const selectedRow = Number(ctx.prop<number>(node, 'selectedRow', -1));
  const headerVisible = ctx.prop<boolean>(node, 'headerVisible', true);
  const footerVisible = ctx.prop<boolean>(node, 'footerVisible', false);
  const groupedColumn = Number(ctx.prop<number>(node, 'sortedColumn', -1));
  const multilineText = ctx.prop<boolean>(node, 'multilineText', false);
  const rowIconVisible = ctx.prop<boolean>(node, 'rowIconVisible', false);
  const checkableStyle = ctx.prop<string>(node, 'checkableStyle', 'checkbox');
  const showCheckColumn = checkable && checkableStyle !== 'table_row';

  const root = div('table');
  if (ctx.prop<boolean>(node, 'compact', false)) root.classList.add('compact');
  const menus = ctx.prop<boolean>(node, 'menuBarVisible', true) ? ctx.renderSlot(node, 'menus') : [];
  if (menus.length) {
    const bar = div('menubar menubar-top');
    const box = div('menubar-box');
    menus.forEach(m => box.appendChild(m));
    bar.appendChild(box);
    root.appendChild(bar);
  }

  const grid = div('table-grid');
  const hasFlexible = columns.some(c => !c.width);
  const template = [
    showCheckColumn ? '34px' : '',
    ...columns.map(c => (c.width ? `${c.width}px` : 'minmax(0, 1fr)')),
    hasFlexible ? '' : 'minmax(0, 1fr)'
  ].filter(Boolean).join(' ');
  grid.style.gridTemplateColumns = template;

  if (headerVisible) {
    const header = div('table-header');
    if (!ctx.prop<boolean>(node, 'headerEnabled', true)) header.classList.add('disabled');
    header.style.gridTemplateColumns = template;
    if (showCheckColumn) header.appendChild(div('table-header-item check'));
    columns.forEach((column, i) => {
      const item = div(`table-header-item halign-${column.align}`);
      item.appendChild(span('text', column.text));
      if (i === groupedColumn) {
        const icon = renderIcon('long-arrow-up', 'sort-icon');
        if (icon) item.appendChild(icon);
        item.classList.add('sorted');
      }
      header.appendChild(item);
    });
    if (!hasFlexible) header.appendChild(div('table-header-item filler'));
    root.appendChild(header);
  }

  rows.forEach((row, rowIndex) => {
    const tr = div('table-row');
    tr.style.gridTemplateColumns = template;
    if (rowIndex === selectedRow) tr.classList.add('selected');
    if (checkable && checkedRows.has(rowIndex) && checkableStyle !== 'checkbox') tr.classList.add('checked');
    if (showCheckColumn) {
      const cell = div('table-cell check');
      cell.appendChild(checkBox(checkedRows.has(rowIndex)));
      tr.appendChild(cell);
    }
    columns.forEach((column, colIndex) => {
      const cell = div(`table-cell halign-${column.align}`, row[colIndex] ?? '');
      if (multilineText) cell.classList.add('multiline');
      if (colIndex === 0 && rowIconVisible) {
        const icon = renderIcon('file', 'row-icon');
        if (icon) cell.insertBefore(icon, cell.firstChild);
        cell.classList.add('has-row-icon');
      }
      tr.appendChild(cell);
    });
    if (!hasFlexible) tr.appendChild(div('table-cell filler'));
    grid.appendChild(tr);
  });
  if (!rows.length) grid.appendChild(div('table-empty', 'No data'));

  const aggregate = ctx.prop<string[]>(node, 'aggregateRow', []);
  if (Array.isArray(aggregate) && aggregate.some(cell => String(cell).trim())) {
    const aggregateRow = div('table-aggregate-row');
    aggregateRow.style.gridTemplateColumns = template;
    if (showCheckColumn) aggregateRow.appendChild(div('table-cell'));
    const values = Array.isArray(aggregate) ? aggregate.map(cell => String(cell)) : [];
    columns.forEach((column, i) => aggregateRow.appendChild(div(`table-cell halign-${column.align}`, values[i] ?? '')));
    if (!hasFlexible) aggregateRow.appendChild(div('table-cell filler'));
    if (ctx.prop<string>(node, 'groupingStyle', 'bottom') === 'top') {
      grid.insertBefore(aggregateRow, grid.firstChild);
    } else {
      grid.appendChild(aggregateRow);
    }
  }
  root.appendChild(grid);

  if (ctx.prop<boolean>(node, 'textFilterEnabled', false)) {
    const filter = div('filter-field table-filter-field');
    const icon = renderIcon('search');
    if (icon) filter.appendChild(icon);
    filter.appendChild(span('filter-field-text', 'Filter'));
    root.appendChild(filter);
  }

  if (footerVisible) {
    const footer = div('table-footer');
    const info = div('table-info');
    info.appendChild(span('table-info-item', `${rows.length} rows`));
    footer.appendChild(info);
    const control = div('table-control');
    const icon = renderIcon('chart');
    if (icon) control.appendChild(icon);
    footer.appendChild(control);
    root.appendChild(footer);
  }
  return root;
}

const TABLE_PROPS = [
  {name: 'columns', label: 'Columns and rows', type: 'columns' as const, group: GROUP_CONTENT},
  {name: 'selectedRow', label: 'Selected row index', type: 'number' as const, group: GROUP_CONTENT, min: -1},
  {name: 'sortedColumn', label: 'Sorted column index', type: 'number' as const, group: GROUP_CONTENT, min: -1},
  {name: 'checkable', label: 'Checkable', type: 'boolean' as const, group: GROUP_CONTENT},
  {name: 'checkedRows', label: 'Checked row indexes (one per line)', type: 'lines' as const, group: GROUP_CONTENT, visibleWhen: (p: Record<string, PropertyValue>) => p.checkable === true},
  {name: 'checkableStyle', label: 'Checkable style', type: 'enum' as const, group: GROUP_CONTENT, options: [
    {value: 'checkbox', label: 'CHECKBOX'},
    {value: 'checkbox_table_row', label: 'CHECKBOX_TABLE_ROW'},
    {value: 'table_row', label: 'TABLE_ROW'}
  ], visibleWhen: (p: Record<string, PropertyValue>) => p.checkable === true},
  {name: 'multiSelect', label: 'Multi select', type: 'boolean' as const, group: GROUP_CONTENT},
  {name: 'multilineText', label: 'Multiline text', type: 'boolean' as const, group: GROUP_CONTENT},
  {name: 'headerVisible', label: 'Header visible', type: 'boolean' as const, group: GROUP_STYLE},
  {name: 'headerEnabled', label: 'Header enabled', type: 'boolean' as const, group: GROUP_STYLE},
  {name: 'footerVisible', label: 'Footer visible', type: 'boolean' as const, group: GROUP_STYLE},
  {name: 'menuBarVisible', label: 'Menu bar visible', type: 'boolean' as const, group: GROUP_STYLE},
  {name: 'rowIconVisible', label: 'Row icon visible', type: 'boolean' as const, group: GROUP_STYLE},
  {name: 'compact', label: 'Compact', type: 'boolean' as const, group: GROUP_STYLE, description: 'Scout collapses all columns into one cell per row - the layout used on small screens.'},
  {name: 'textFilterEnabled', label: 'Text filter enabled', type: 'boolean' as const, group: GROUP_CONTENT},
  {name: 'groupingStyle', label: 'Grouping style', type: 'enum' as const, group: GROUP_STYLE, options: [
    {value: 'bottom', label: 'BOTTOM'},
    {value: 'top', label: 'TOP'}
  ]},
  {name: 'aggregateRow', label: 'Aggregate row (one cell per line)', type: 'lines' as const, group: GROUP_CONTENT,
    description: 'Shown as the aggregate row of the grouped column.'}
];

const TABLE_DEFAULTS = {
  columns: DEFAULT_COLUMNS,
  rows: DEFAULT_ROWS,
  selectedRow: -1,
  sortedColumn: -1,
  checkable: false,
  checkableStyle: 'checkbox',
  multiSelect: true,
  multilineText: false,
  headerVisible: true,
  headerEnabled: true,
  footerVisible: false,
  menuBarVisible: true,
  rowIconVisible: false,
  compact: false,
  textFilterEnabled: false,
  groupingStyle: 'bottom'
};

function parseTreeNodes(raw: unknown): {level: number; text: string; expanded: boolean}[] {
  const text = String(raw ?? '');
  return text.split(/\r?\n/).filter(l => l.trim()).map(line => {
    const indent = line.length - line.trimStart().length;
    const body = line.trim();
    return {
      level: Math.floor(indent / 2),
      text: body.replace(/^[-+]\s*/, ''),
      expanded: !body.startsWith('+')
    };
  });
}

const DEFAULT_TREE = 'Documents\n  Invoices\n  Contracts\n+ Archive\nSettings';

const defs: WidgetDef[] = [
  {
    objectType: 'TableField',
    label: 'Table field',
    category: 'Tables & Trees',
    icon: 'list',
    description: 'Form field containing a Scout table.',
    javaClass: 'org.eclipse.scout.rt.client.ui.form.fields.tablefield.AbstractTableField',
    jsClass: 'TableField',
    isFormField: true,
    defaults: formFieldDefaults({
      'gridDataHints.weightY': 1,
      label: 'Table',
      labelVisible: false,
      'gridDataHints.w': 2,
      'gridDataHints.h': 3,
      ...TABLE_DEFAULTS
    }),
    props: formFieldProps(...TABLE_PROPS),
    slots: [{name: 'menus', label: 'Menus', accepts: ['Menu'], layout: 'inline'}],
    defaultGridH: 3,
    render: renderTable
  },
  {
    objectType: 'Table',
    label: 'Table',
    category: 'Tables & Trees',
    icon: 'list',
    description: 'Standalone table, e.g. as the detail table of an outline page.',
    javaClass: 'org.eclipse.scout.rt.client.ui.basic.table.AbstractTable',
    jsClass: 'Table',
    isFormField: false,
    defaults: {visible: true, enabled: true, ...TABLE_DEFAULTS},
    props: [...TABLE_PROPS],
    slots: [{name: 'menus', label: 'Menus', accepts: ['Menu'], layout: 'inline'}],
    render: renderTable
  },
  {
    objectType: 'TreeField',
    label: 'Tree field',
    category: 'Tables & Trees',
    icon: 'folder',
    description: 'Form field containing a Scout tree.',
    javaClass: 'org.eclipse.scout.rt.client.ui.form.fields.treefield.AbstractTreeField',
    jsClass: 'TreeField',
    isFormField: true,
    defaults: formFieldDefaults({
      'gridDataHints.weightY': 1,
      label: 'Tree',
      labelVisible: false,
      'gridDataHints.h': 3,
      nodes: DEFAULT_TREE,
      selectedNode: 1,
      checkable: false
    }),
    props: formFieldProps(
      {name: 'nodes', label: 'Nodes (two spaces per level, "+" = collapsed)', type: 'lines', group: GROUP_CONTENT},
      {name: 'selectedNode', label: 'Selected node index', type: 'number', group: GROUP_CONTENT, min: -1},
      {name: 'checkable', label: 'Checkable', type: 'boolean', group: GROUP_CONTENT},
      {name: 'multiCheck', label: 'Multi check', type: 'boolean', group: GROUP_CONTENT, visibleWhen: (p: Record<string, PropertyValue>) => p.checkable === true},
      {name: 'autoCheckChildren', label: 'Auto check children', type: 'boolean', group: GROUP_CONTENT, visibleWhen: (p: Record<string, PropertyValue>) => p.checkable === true},
      {name: 'checkableStyle', label: 'Checkable style', type: 'enum', group: GROUP_CONTENT, options: [
        {value: 'checkbox', label: 'CHECKBOX'},
        {value: 'checkbox_tree_node', label: 'CHECKBOX_TREE_NODE'}
      ], visibleWhen: (p: Record<string, PropertyValue>) => p.checkable === true},
      {name: 'textFilterEnabled', label: 'Text filter enabled', type: 'boolean', group: GROUP_CONTENT}
    ),
    slots: [{name: 'menus', label: 'Menus', accepts: ['Menu'], layout: 'inline'}],
    defaultGridH: 3,
    render(ctx, node) {
      const nodes = parseTreeNodes(ctx.prop<string>(node, 'nodes', DEFAULT_TREE));
      const selected = Number(ctx.prop<number>(node, 'selectedNode', 1));
      const checkable = ctx.prop<boolean>(node, 'checkable', false);
      const root = div('tree');
      const data = div('tree-data');
      nodes.forEach((entry, i) => {
        const row = div('tree-node');
        row.style.paddingLeft = `${28 + entry.level * 17}px`;
        const hasChildren = nodes[i + 1] ? nodes[i + 1].level > entry.level : false;
        const control = span('tree-node-control');
        control.classList.toggle('expanded', hasChildren && entry.expanded);
        control.classList.toggle('empty', !hasChildren);
        row.appendChild(control);
        if (checkable) row.appendChild(checkBox(i === selected));
        row.appendChild(span('text', entry.text));
        if (i === selected) row.classList.add('selected');
        data.appendChild(row);
      });
      root.appendChild(data);
      return root;
    }
  },
  {
    objectType: 'CalendarField',
    label: 'Calendar field',
    category: 'Tables & Trees',
    icon: 'calendar',
    description: 'Form field containing a Scout calendar.',
    javaClass: 'org.eclipse.scout.rt.client.ui.form.fields.calendarfield.AbstractCalendarField',
    jsClass: 'CalendarField',
    isFormField: true,
    defaults: formFieldDefaults({
      'gridDataHints.weightY': 1,
      label: 'Calendar',
      labelVisible: false,
      'gridDataHints.w': 2,
      'gridDataHints.h': 9,
      displayMode: 'week',
      title: 'September 2026',
      appointments: [
        ['Mon', '09:00', 'Sprint planning'],
        ['Tue', '14:00', 'Design review'],
        ['Thu', '11:30', 'Customer call']
      ]
    }),
    props: formFieldProps(
      {name: 'title', label: 'Title', type: 'string', group: GROUP_CONTENT},
      {name: 'displayMode', label: 'Display mode', type: 'enum', group: GROUP_LAYOUT, options: [
        {value: 'day', label: 'DAY'},
        {value: 'week', label: 'WEEK'},
        {value: 'workWeek', label: 'WORK_WEEK'},
        {value: 'month', label: 'MONTH'}
      ]},
      {name: 'appointments', label: 'Appointments', type: 'rows', group: GROUP_CONTENT, columns: ['Day', 'Time', 'Title']}
    ),
    slots: [],
    defaultGridH: 9,
    render(ctx, node) {
      const mode = ctx.prop<string>(node, 'displayMode', 'week');
      const dayNames = mode === 'workWeek'
        ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
        : mode === 'day'
          ? ['Mon']
          : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const root = div('calendar');
      const header = div('calendar-header');
      header.appendChild(div('calendar-title', ctx.prop<string>(node, 'title', '')));
      const modeSelector = div('mode-selector');
      for (const m of ['Day', 'Week', 'Work week', 'Month']) {
        const item = div('mode', m);
        if (m.toLowerCase().replace(/\s/g, '') === mode.toLowerCase()) item.classList.add('selected');
        modeSelector.appendChild(item);
      }
      header.appendChild(modeSelector);
      root.appendChild(header);

      if (mode === 'month') {
        const grid = div('calendar-month-grid');
        for (let i = 0; i < 35; i++) {
          const cell = div('calendar-month-day');
          cell.appendChild(span('calendar-day-number', String(((i + 30) % 31) + 1)));
          if (i % 7 >= 5) cell.classList.add('weekend');
          grid.appendChild(cell);
        }
        root.appendChild(grid);
        return root;
      }

      const body = div('calendar-week');
      body.style.gridTemplateColumns = `48px repeat(${dayNames.length}, minmax(0, 1fr))`;
      body.appendChild(div('calendar-corner'));
      dayNames.forEach(name => body.appendChild(div('calendar-day-head', name)));
      for (let hour = 8; hour <= 17; hour++) {
        body.appendChild(div('calendar-hour', `${String(hour).padStart(2, '0')}:00`));
        dayNames.forEach(name => {
          const cell = div('calendar-slot');
          cell.dataset.day = name;
          cell.dataset.hour = String(hour);
          body.appendChild(cell);
        });
      }
      root.appendChild(body);

      for (const [day, time, title] of rows(ctx.prop<string[][]>(node, 'appointments', []))) {
        const hour = parseInt(time ?? '', 10);
        const slot = body.querySelector<HTMLElement>(`.calendar-slot[data-day="${day}"][data-hour="${hour}"]`);
        if (slot) {
          const item = div('calendar-component');
          item.appendChild(span('calendar-component-time', time ?? ''));
          item.appendChild(span('calendar-component-title', title ?? ''));
          slot.appendChild(item);
        }
      }
      return root;
    }
  },
  {
    objectType: 'PlannerField',
    label: 'Planner field',
    category: 'Tables & Trees',
    icon: 'chart',
    description: 'Resource/time planner with activities on a timeline.',
    javaClass: 'org.eclipse.scout.rt.client.ui.form.fields.plannerfield.AbstractPlannerField',
    jsClass: 'PlannerField',
    isFormField: true,
    defaults: formFieldDefaults({
      label: 'Planner',
      labelVisible: false,
      'gridDataHints.w': 2,
      'gridDataHints.h': 6,
      resources: [
        ['Team A', '2', '4', 'Kick-off'],
        ['Team B', '5', '3', 'Implementation'],
        ['Team C', '1', '2', 'Analysis']
      ],
      columnCount: 12
    }),
    props: formFieldProps(
      {name: 'resources', label: 'Resources', type: 'rows', group: GROUP_CONTENT, columns: ['Name', 'Start', 'Length', 'Activity']},
      {name: 'columnCount', label: 'Timeline columns', type: 'number', group: GROUP_LAYOUT, min: 4, max: 40}
    ),
    slots: [],
    defaultGridH: 6,
    render(ctx, node) {
      const columnCount = Math.max(4, Number(ctx.prop<number>(node, 'columnCount', 12)));
      const root = div('planner');
      const scale = div('planner-scale');
      scale.style.gridTemplateColumns = `160px repeat(${columnCount}, minmax(0, 1fr))`;
      scale.appendChild(div('planner-corner', 'Resource'));
      for (let i = 1; i <= columnCount; i++) scale.appendChild(div('planner-scale-item', String(i)));
      root.appendChild(scale);

      for (const [name, start, length, activity] of rows(ctx.prop<string[][]>(node, 'resources', []))) {
        const row = div('planner-row');
        row.style.gridTemplateColumns = `160px repeat(${columnCount}, minmax(0, 1fr))`;
        row.appendChild(div('planner-resource', name ?? ''));
        for (let i = 1; i <= columnCount; i++) row.appendChild(div('planner-cell'));
        const bar = div('planner-activity', activity ?? '');
        const startIndex = Math.max(1, Number(start) || 1);
        const len = Math.max(1, Number(length) || 1);
        bar.style.gridColumn = `${startIndex + 1} / span ${len}`;
        bar.style.gridRow = '1';
        row.appendChild(bar);
        root.appendChild(row);
      }
      return root;
    }
  }
];

registerWidgets(defs);
