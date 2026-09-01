import {registerWidgets, type WidgetDef} from './registry';
import {formFieldDefaults, formFieldProps, GROUP_CONTENT, GROUP_LAYOUT, GROUP_STYLE, WIDGET_DEFAULTS, WIDGET_PROPS} from './common';
import {div, span} from '../../render/dom';
import {lines} from '../../render/parts';
import {renderIcon} from '../../render/icons';
import {renderBody} from './containers';

const defs: WidgetDef[] = [
  {
    objectType: 'TileField',
    label: 'Tile grid',
    category: 'Tiles & Layout',
    icon: 'group',
    description: 'Field containing a tile grid; tiles wrap into a fixed number of columns.',
    jsClass: 'TileField',
    isFormField: true,
    defaults: formFieldDefaults({
      label: 'Tiles',
      labelVisible: false,
      'gridDataHints.w': 2,
      'gridDataHints.h': 6,
      gridColumnCount: 4,
      selectable: false,
      layoutMode: 'grid'
    }),
    props: formFieldProps(
      {name: 'gridColumnCount', label: 'Tile columns', type: 'number', group: GROUP_LAYOUT, min: 1, max: 8},
      {name: 'selectable', label: 'Selectable', type: 'boolean', group: GROUP_CONTENT}
    ),
    slots: [{name: 'tiles', label: 'Tiles', accepts: ['Tile', 'FormFieldTile'], layout: 'grid'}],
    defaultGridH: 6,
    render(ctx, node) {
      const grid = div('tile-grid');
      grid.style.gridTemplateColumns = `repeat(${Math.max(1, Number(ctx.prop<number>(node, 'gridColumnCount', 4)))}, minmax(0, 1fr))`;
      const tiles = ctx.childrenOf(node, 'tiles');
      tiles.forEach(tile => grid.appendChild(ctx.renderNode(tile, node)));
      if (!tiles.length) grid.classList.add('empty-container');
      return grid;
    }
  },
  {
    objectType: 'Tile',
    label: 'Tile',
    category: 'Tiles & Layout',
    icon: 'file',
    description: 'A single tile with a title, content and optional colour scheme.',
    jsClass: 'Tile',
    isFormField: false,
    defaults: {
      ...WIDGET_DEFAULTS,
      title: 'Tile',
      content: 'Some content',
      iconId: '',
      colorScheme: 'default',
      gridSpanX: 1,
      gridSpanY: 1,
      selected: false
    },
    props: [
      ...WIDGET_PROPS,
      {name: 'title', label: 'Title', type: 'string', group: GROUP_CONTENT},
      {name: 'content', label: 'Content', type: 'text', group: GROUP_CONTENT},
      {name: 'iconId', label: 'Icon', type: 'icon', group: GROUP_CONTENT},
      {name: 'colorScheme', label: 'Color scheme', type: 'enum', group: GROUP_STYLE, options: [
        {value: 'default', label: 'DEFAULT'},
        {value: 'alternative', label: 'ALTERNATIVE'},
        {value: 'ranking', label: 'RANKING'},
        {value: 'inverted', label: 'INVERTED'}
      ]},
      {name: 'backgroundColor', label: 'Background color', type: 'color', group: GROUP_STYLE},
      {name: 'gridSpanX', label: 'Column span', type: 'number', group: GROUP_LAYOUT, min: 1, max: 8},
      {name: 'gridSpanY', label: 'Row span', type: 'number', group: GROUP_LAYOUT, min: 1, max: 8},
      {name: 'selected', label: 'Selected', type: 'boolean', group: GROUP_STYLE}
    ],
    slots: [],
    render(ctx, node) {
      const tile = div('tile');
      tile.classList.add(`color-scheme-${ctx.prop<string>(node, 'colorScheme', 'default')}`);
      if (ctx.prop<boolean>(node, 'selected', false)) tile.classList.add('selected');
      tile.style.gridColumn = `span ${Math.max(1, Number(ctx.prop<number>(node, 'gridSpanX', 1)))}`;
      tile.style.gridRow = `span ${Math.max(1, Number(ctx.prop<number>(node, 'gridSpanY', 1)))}`;
      const icon = renderIcon(ctx.prop<string>(node, 'iconId', ''));
      if (icon) tile.appendChild(icon);
      const title = ctx.prop<string>(node, 'title', '');
      if (title) tile.appendChild(div('tile-title', title));
      const content = ctx.prop<string>(node, 'content', '');
      if (content) tile.appendChild(div('tile-content', content));
      return tile;
    }
  },
  {
    objectType: 'FormFieldTile',
    label: 'Form field tile',
    category: 'Tiles & Layout',
    icon: 'group',
    description: 'Tile that hosts form fields in its own logical grid.',
    jsClass: 'FormFieldTile',
    isFormField: false,
    defaults: {...WIDGET_DEFAULTS, title: 'Form field tile', gridColumnCount: 1, layoutMode: 'grid', gridSpanX: 1, gridSpanY: 2},
    props: [
      ...WIDGET_PROPS,
      {name: 'title', label: 'Title', type: 'string', group: GROUP_CONTENT},
      {name: 'gridColumnCount', label: 'Grid column count', type: 'number', group: GROUP_LAYOUT, min: 1, max: 4},
      {name: 'gridSpanX', label: 'Column span', type: 'number', group: GROUP_LAYOUT, min: 1, max: 8},
      {name: 'gridSpanY', label: 'Row span', type: 'number', group: GROUP_LAYOUT, min: 1, max: 8}
    ],
    slots: [{name: 'fields', label: 'Fields', accepts: ['*'], layout: 'grid'}],
    render(ctx, node) {
      const tile = div('tile form-field-tile');
      tile.style.gridColumn = `span ${Math.max(1, Number(ctx.prop<number>(node, 'gridSpanX', 1)))}`;
      tile.style.gridRow = `span ${Math.max(1, Number(ctx.prop<number>(node, 'gridSpanY', 2)))}`;
      const title = ctx.prop<string>(node, 'title', '');
      if (title) tile.appendChild(div('tile-title', title));
      tile.appendChild(renderBody(ctx, node, div('group-box-body')));
      return tile;
    }
  },
  {
    objectType: 'Accordion',
    label: 'Accordion',
    category: 'Tiles & Layout',
    icon: 'list',
    description: 'Collapsible groups stacked vertically.',
    jsClass: 'Accordion',
    isFormField: false,
    defaults: {...WIDGET_DEFAULTS, exclusiveExpand: true},
    props: [
      ...WIDGET_PROPS,
      {name: 'exclusiveExpand', label: 'Exclusive expand', type: 'boolean', group: GROUP_CONTENT}
    ],
    slots: [{name: 'groups', label: 'Groups', accepts: ['Group'], layout: 'stack'}],
    render(ctx, node) {
      const accordion = div('accordion');
      const groups = ctx.childrenOf(node, 'groups');
      groups.forEach(group => accordion.appendChild(ctx.renderNode(group, node)));
      if (!groups.length) accordion.classList.add('empty-container');
      return accordion;
    }
  },
  {
    objectType: 'Group',
    label: 'Group',
    category: 'Tiles & Layout',
    icon: 'group',
    description: 'Collapsible group inside an accordion.',
    jsClass: 'Group',
    isFormField: false,
    defaults: {...WIDGET_DEFAULTS, title: 'Group', subTitle: '', collapsed: false, gridColumnCount: 2, layoutMode: 'grid'},
    props: [
      ...WIDGET_PROPS,
      {name: 'title', label: 'Title', type: 'string', group: GROUP_CONTENT},
      {name: 'subTitle', label: 'Sub title', type: 'string', group: GROUP_CONTENT},
      {name: 'collapsed', label: 'Collapsed', type: 'boolean', group: GROUP_CONTENT},
      {name: 'gridColumnCount', label: 'Grid column count', type: 'number', group: GROUP_LAYOUT, min: 1, max: 8}
    ],
    slots: [{name: 'fields', label: 'Body', accepts: ['*'], layout: 'grid'}],
    render(ctx, node) {
      const group = div('group');
      const collapsed = ctx.prop<boolean>(node, 'collapsed', false);
      if (collapsed) group.classList.add('collapsed');
      const header = div('group-header');
      const control = span('group-collapse-icon');
      control.classList.toggle('expanded', !collapsed);
      header.appendChild(control);
      const titles = div('group-titles');
      titles.appendChild(span('group-title', ctx.prop<string>(node, 'title', '')));
      const sub = ctx.prop<string>(node, 'subTitle', '');
      if (sub) titles.appendChild(span('group-sub-title', sub));
      header.appendChild(titles);
      group.appendChild(header);
      if (!collapsed) group.appendChild(renderBody(ctx, node, div('group-body')));
      return group;
    }
  },
  {
    objectType: 'BreadcrumbBarField',
    label: 'Breadcrumb bar',
    category: 'Tiles & Layout',
    icon: 'angle-right',
    description: 'Path navigation showing where the user currently is.',
    jsClass: 'BreadcrumbBarField',
    isFormField: true,
    defaults: formFieldDefaults({label: '', labelVisible: false, items: 'Home\nCustomers\nAda Lovelace', 'gridDataHints.w': 2}),
    props: formFieldProps({name: 'items', label: 'Items (one per line)', type: 'lines', group: GROUP_CONTENT}),
    slots: [],
    render(ctx, node) {
      const bar = div('breadcrumb-bar');
      const items = lines(ctx.prop<string>(node, 'items', ''), ['Home', 'Customers']);
      items.forEach((text, i) => {
        const item = div('breadcrumb-item', text);
        if (i === items.length - 1) item.classList.add('last');
        bar.appendChild(item);
        if (i < items.length - 1) {
          const sep = renderIcon('angle-right', 'breadcrumb-separator');
          if (sep) bar.appendChild(sep);
        }
      });
      return bar;
    }
  },
  {
    objectType: 'Carousel',
    label: 'Carousel',
    category: 'Tiles & Layout',
    icon: 'angle-right',
    description: 'Horizontally paged content with status dots.',
    jsClass: 'Carousel',
    isFormField: true,
    defaults: formFieldDefaults({label: '', labelVisible: false, 'gridDataHints.w': 2, 'gridDataHints.h': 4, pageCount: 4, currentPage: 0, content: 'Carousel page'}),
    props: formFieldProps(
      {name: 'pageCount', label: 'Page count', type: 'number', group: GROUP_CONTENT, min: 1, max: 12},
      {name: 'currentPage', label: 'Current page', type: 'number', group: GROUP_CONTENT, min: 0},
      {name: 'content', label: 'Page content', type: 'string', group: GROUP_CONTENT}
    ),
    slots: [],
    defaultGridH: 4,
    render(ctx, node) {
      const pages = Math.max(1, Number(ctx.prop<number>(node, 'pageCount', 4)));
      const current = Math.min(pages - 1, Math.max(0, Number(ctx.prop<number>(node, 'currentPage', 0))));
      const root = div('carousel');
      root.appendChild(div('carousel-page', `${ctx.prop<string>(node, 'content', 'Carousel page')} ${current + 1} / ${pages}`));
      const status = div('carousel-status');
      for (let i = 0; i < pages; i++) {
        const dot = span('carousel-status-item');
        if (i === current) dot.classList.add('current');
        status.appendChild(dot);
      }
      root.appendChild(status);
      return root;
    }
  }
];

registerWidgets(defs);
