import {registerWidgets, type WidgetDef} from './registry';
import {formFieldDefaults, formFieldProps, GROUP_CONTENT, GROUP_LAYOUT, GROUP_STYLE} from './common';
import {div, span} from '../../render/dom';
import {checkBox, lines, radioCircle} from '../../render/parts';
import {renderIcon} from '../../render/icons';

const defs: WidgetDef[] = [
  {
    objectType: 'CheckBoxField',
    label: 'Check box',
    category: 'Selection fields',
    icon: 'checked-bold',
    description: 'Boolean field rendered as a check box with a text on its right.',
    javaClass: 'org.eclipse.scout.rt.client.ui.form.fields.booleanfield.AbstractBooleanField',
    jsClass: 'CheckBoxField',
    isFormField: true,
    defaults: formFieldDefaults({label: '', text: 'Check box', value: false, labelVisible: false, triStateEnabled: false}),
    props: formFieldProps(
      {name: 'text', label: 'Text', type: 'string', group: GROUP_CONTENT},
      {name: 'value', label: 'Checked', type: 'boolean', group: GROUP_CONTENT},
      {name: 'triStateEnabled', label: 'Tri-state', type: 'boolean', group: GROUP_CONTENT},
      {name: 'undefinedValue', label: 'Undefined state', type: 'boolean', group: GROUP_CONTENT, visibleWhen: p => p.triStateEnabled === true}
    ),
    slots: [],
    render(ctx, node) {
      const enabled = ctx.prop<boolean>(node, 'enabled', true);
      const wrapper = div('check-box-field-box');
      const box = checkBox(ctx.prop<boolean>(node, 'value', false), !enabled);
      if (ctx.prop<boolean>(node, 'triStateEnabled', false) && ctx.prop<boolean>(node, 'undefinedValue', false)) {
        box.classList.remove('checked');
        box.classList.add('undefined');
      }
      wrapper.appendChild(box);
      wrapper.appendChild(span('check-box-label', ctx.prop<string>(node, 'text', '')));
      return wrapper;
    }
  },
  {
    objectType: 'RadioButtonGroup',
    label: 'Radio button group',
    category: 'Selection fields',
    icon: 'circle-solid',
    description: 'Group of mutually exclusive radio buttons laid out in a logical grid.',
    javaClass: 'org.eclipse.scout.rt.client.ui.form.fields.radiobuttongroup.AbstractRadioButtonGroup',
    jsClass: 'RadioButtonGroup',
    isFormField: true,
    defaults: formFieldDefaults({label: 'Radio group', options: 'First choice\nSecond choice\nThird choice', selectedIndex: 0, gridColumnCount: 1, layoutHorizontal: false}),
    props: formFieldProps(
      {name: 'options', label: 'Buttons (one per line)', type: 'lines', group: GROUP_CONTENT},
      {name: 'selectedIndex', label: 'Selected index', type: 'number', group: GROUP_CONTENT, min: -1},
      {name: 'gridColumnCount', label: 'Grid column count', type: 'number', group: GROUP_LAYOUT, min: 1, max: 6},
      {name: 'layoutHorizontal', label: 'Layout horizontally', type: 'boolean', group: GROUP_LAYOUT}
    ),
    slots: [],
    render(ctx, node) {
      const items = lines(ctx.prop<string>(node, 'options', ''), ['First choice', 'Second choice', 'Third choice']);
      const selected = Number(ctx.prop<number>(node, 'selectedIndex', 0));
      const enabled = ctx.prop<boolean>(node, 'enabled', true);
      const box = div('radio-button-group-box');
      const columns = ctx.prop<boolean>(node, 'layoutHorizontal', false)
        ? items.length
        : Math.max(1, Number(ctx.prop<number>(node, 'gridColumnCount', 1)));
      box.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
      items.forEach((text, i) => {
        const button = div('radio-button');
        button.appendChild(radioCircle(i === selected, !enabled));
        button.appendChild(span('radio-button-label', text));
        box.appendChild(button);
      });
      return box;
    }
  },
  {
    objectType: 'ListBox',
    label: 'List box',
    category: 'Selection fields',
    icon: 'list',
    description: 'Multi-select list backed by a lookup call.',
    javaClass: 'org.eclipse.scout.rt.client.ui.form.fields.listbox.AbstractListBox',
    jsClass: 'ListBox',
    isFormField: true,
    defaults: formFieldDefaults({label: 'List box', 'gridDataHints.h': 4, options: 'Austria\nBelgium\nSwitzerland\nGermany', checkedIndexes: '0\n2', filterField: false}),
    props: formFieldProps(
      {name: 'options', label: 'Entries (one per line)', type: 'lines', group: GROUP_CONTENT},
      {name: 'checkedIndexes', label: 'Checked indexes (one per line)', type: 'lines', group: GROUP_CONTENT},
      {name: 'filterField', label: 'Show filter field', type: 'boolean', group: GROUP_CONTENT}
    ),
    slots: [],
    defaultGridH: 4,
    render(ctx, node) {
      const items = lines(ctx.prop<string>(node, 'options', ''), ['Austria', 'Belgium', 'Switzerland', 'Germany']);
      const checked = new Set(lines(ctx.prop<string>(node, 'checkedIndexes', ''), ['0', '2']).map(Number));
      const box = div('list-box-body');
      items.forEach((text, i) => {
        const row = div('list-box-row');
        row.appendChild(checkBox(checked.has(i)));
        row.appendChild(span('list-box-text', text));
        box.appendChild(row);
      });
      if (ctx.prop<boolean>(node, 'filterField', false)) {
        const filter = div('filter-field');
        const icon = renderIcon('search');
        if (icon) filter.appendChild(icon);
        filter.appendChild(span('filter-field-text', 'Filter'));
        box.appendChild(filter);
      }
      return box;
    }
  },
  {
    objectType: 'TreeBox',
    label: 'Tree box',
    category: 'Selection fields',
    icon: 'folder',
    description: 'Hierarchical multi-select box.',
    javaClass: 'org.eclipse.scout.rt.client.ui.form.fields.treebox.AbstractTreeBox',
    jsClass: 'TreeBox',
    isFormField: true,
    defaults: formFieldDefaults({
      label: 'Tree box',
      'gridDataHints.h': 5,
      options: 'Europe\n  Switzerland\n  Austria\nAsia\n  Japan',
      checkedIndexes: '1'
    }),
    props: formFieldProps(
      {name: 'options', label: 'Nodes (two spaces per level)', type: 'lines', group: GROUP_CONTENT},
      {name: 'checkedIndexes', label: 'Checked indexes (one per line)', type: 'lines', group: GROUP_CONTENT}
    ),
    slots: [],
    defaultGridH: 5,
    render(ctx, node) {
      const raw = ctx.prop<string>(node, 'options', 'Europe\n  Switzerland\n  Austria\nAsia\n  Japan');
      const checked = new Set(lines(ctx.prop<string>(node, 'checkedIndexes', '1'), ['1']).map(Number));
      const box = div('tree-box-body');
      const entries = raw.split(/\r?\n/).filter(l => l.trim()).map(line => ({
        level: Math.floor((line.length - line.trimStart().length) / 2),
        text: line.trim()
      }));
      entries.forEach((entry, i) => {
        const row = div('tree-node');
        row.style.paddingLeft = `${29 + entry.level * 17}px`;
        const hasChildren = entries[i + 1] ? entries[i + 1].level > entry.level : false;
        const control = span('tree-node-control');
        control.classList.toggle('expanded', hasChildren);
        control.classList.toggle('empty', !hasChildren);
        row.appendChild(control);
        row.appendChild(checkBox(checked.has(i)));
        row.appendChild(span('text', entry.text));
        box.appendChild(row);
      });
      return box;
    }
  },
  {
    objectType: 'ModeSelectorField',
    label: 'Mode selector',
    category: 'Selection fields',
    icon: 'list',
    description: 'Segmented control for choosing one of a few modes.',
    jsClass: 'ModeSelectorField',
    isFormField: true,
    defaults: formFieldDefaults({label: 'Mode', options: 'Day\nWeek\nMonth', selectedIndex: 1, 'gridDataHints.fillHorizontal': false}),
    props: formFieldProps(
      {name: 'options', label: 'Modes (one per line)', type: 'lines', group: GROUP_CONTENT},
      {name: 'selectedIndex', label: 'Selected index', type: 'number', group: GROUP_CONTENT, min: 0}
    ),
    slots: [],
    render(ctx, node) {
      const items = lines(ctx.prop<string>(node, 'options', ''), ['Day', 'Week', 'Month']);
      const selected = Number(ctx.prop<number>(node, 'selectedIndex', 1));
      const wrapper = div('mode-selector-container');
      const box = div('mode-selector');
      items.forEach((text, i) => {
        const mode = div('mode', text);
        if (i === selected) mode.classList.add('selected');
        box.appendChild(mode);
      });
      wrapper.appendChild(box);
      return wrapper;
    }
  },
  {
    objectType: 'SwitchField',
    label: 'Switch',
    category: 'Selection fields',
    icon: 'checked-bold',
    description: 'On/off switch with optional labels.',
    jsClass: 'Switch',
    isFormField: true,
    defaults: formFieldDefaults({label: 'Switch', value: true, activated: true, labelVisible: true}),
    props: formFieldProps(
      {name: 'value', label: 'On', type: 'boolean', group: GROUP_CONTENT},
      {name: 'displayStyle', label: 'Display style', type: 'enum', group: GROUP_STYLE, options: [
        {value: 'default', label: 'DEFAULT'},
        {value: 'slider', label: 'SLIDER'}
      ]}
    ),
    slots: [],
    render(ctx, node) {
      const on = ctx.prop<boolean>(node, 'value', true);
      const box = div('switch');
      if (on) box.classList.add('activated');
      box.appendChild(div('switch-slider'));
      return box;
    }
  }
];

registerWidgets(defs);
