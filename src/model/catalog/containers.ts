import {registerWidgets, type RenderContext, type WidgetDef} from './registry';
import {formFieldDefaults, formFieldProps, GROUP_BOX_PROPS, GROUP_CONTENT, GROUP_LAYOUT, GROUP_STYLE, WIDGET_DEFAULTS, WIDGET_PROPS} from './common';
import {div, span} from '../../render/dom';
import {FULL_WIDTH, INHERIT_COLUMN_COUNT, renderFreeForm, renderLogicalGrid, resolveColumnCount} from '../../render/layout';
import type {MockupNode} from '../types';
import {renderIcon} from '../../render/icons';

export const FIELD_TYPES = ['*'];

export const LAYOUT_MODE_OPTIONS = [
  {value: 'grid', label: 'Logical grid (Scout)'},
  {value: 'free', label: 'Free placement (sketch)'}
];

const LAYOUT_PROPS = [
  {name: 'gridColumnCount', label: 'Grid column count', type: 'number' as const, group: GROUP_LAYOUT, min: -1, max: 12, description: "Scout's GroupBox.gridColumnCount - how many logical columns the body has. -1 inherits from the nearest ancestor group box, falling back to 2."},
  {
    name: 'layoutMode',
    label: 'Layout mode',
    type: 'enum' as const,
    group: GROUP_LAYOUT,
    options: LAYOUT_MODE_OPTIONS,
    description: 'Free placement is a sketching aid only - such an arrangement cannot be reproduced with standard Scout layout configuration.'
  }
];

export function renderBody(ctx: RenderContext, node: MockupNode, body: HTMLElement, slot = 'fields'): HTMLElement {
  const children = ctx.childrenOf(node, slot);
  const responsive = ctx.prop<string>(node, 'responsive', 'inherit');
  if (responsive === 'true') body.classList.add('responsive-on');
  if (responsive === 'false') body.classList.add('responsive-off');
  if (ctx.prop<string>(node, 'layoutMode', 'grid') === 'free') {
    renderFreeForm(ctx, body, node, children);
  } else {
    renderLogicalGrid(ctx, body, node, children, resolveColumnCount(ctx, node));
  }
  if (!children.length) body.classList.add('empty-container');
  return body;
}

function renderMenuBar(ctx: RenderContext, node: MockupNode, position: 'top' | 'bottom' | 'title'): HTMLElement | null {
  if (!ctx.prop<boolean>(node, 'menuBarVisible', true)) return null;
  const menus = ctx.renderSlot(node, 'menus');
  if (!menus.length) return null;
  const bar = div(`menubar menubar-${position}`);
  const box = div('menubar-box');
  menus.forEach(menu => box.appendChild(menu));
  bar.appendChild(box);
  return bar;
}

const defs: WidgetDef[] = [
  {
    objectType: 'GroupBox',
    ownsLabel: true,
    label: 'Group box',
    category: 'Containers',
    icon: 'group',
    description: 'The main container of a Scout form. Arranges its fields in a logical grid.',
    javaClass: 'org.eclipse.scout.rt.client.ui.form.fields.groupbox.AbstractGroupBox',
    jsClass: 'GroupBox',
    isFormField: true,
    defaults: formFieldDefaults({
      'gridDataHints.useUiHeight': true,
      'gridDataHints.w': FULL_WIDTH,
      label: 'Group box',
      labelVisible: true,
      gridColumnCount: INHERIT_COLUMN_COUNT,
      layoutMode: 'grid',
      borderVisible: true,
      borderDecoration: 'auto',
      expandable: false,
      expanded: true,
      menuBarPosition: 'auto',
      menuBarVisible: true,
      menuBarEllipsisPosition: 'right',
      responsive: 'inherit',
      notificationSeverity: 'info',
      'gridDataHints.h': 1,
    }),
    props: formFieldProps(
      ...GROUP_BOX_PROPS,
      ...LAYOUT_PROPS,
      {name: 'borderVisible', label: 'Border visible', type: 'boolean', group: GROUP_STYLE},
      {name: 'borderDecoration', label: 'Border decoration', type: 'enum', group: GROUP_STYLE, options: [
        {value: 'auto', label: 'AUTO'},
        {value: 'line', label: 'LINE'},
        {value: 'empty', label: 'EMPTY'}
      ]},
      {name: 'expandable', label: 'Expandable', type: 'boolean', group: GROUP_CONTENT},
      {name: 'expanded', label: 'Expanded', type: 'boolean', group: GROUP_CONTENT, visibleWhen: p => p.expandable === true},
      {name: 'menuBarPosition', label: 'Menu bar position', type: 'enum', group: GROUP_LAYOUT, options: [
        {value: 'auto', label: 'AUTO'},
        {value: 'top', label: 'TOP'},
        {value: 'bottom', label: 'BOTTOM'},
        {value: 'title', label: 'TITLE'}
      ]},
      {name: 'menuBarEllipsisPosition', label: 'Menu bar ellipsis position', type: 'enum', group: GROUP_LAYOUT, options: [
        {value: 'right', label: 'RIGHT'},
        {value: 'left', label: 'LEFT'}
      ]},
      {name: 'scrollable', label: 'Scrollable', type: 'boolean', group: GROUP_LAYOUT},
      {name: 'notification', label: 'Notification text', type: 'string', group: GROUP_CONTENT, description: "Scout can show a notification inside a group box; leave empty for none."},
      {name: 'notificationSeverity', label: 'Notification severity', type: 'enum', group: GROUP_CONTENT, options: [
        {value: 'ok', label: 'OK'},
        {value: 'info', label: 'INFO'},
        {value: 'warning', label: 'WARNING'},
        {value: 'error', label: 'ERROR'}
      ], visibleWhen: p => !!p.notification}
    ),
    slots: [
      {name: 'fields', label: 'Fields', accepts: FIELD_TYPES, layout: 'grid'},
      {name: 'menus', label: 'Menus', accepts: ['Menu'], layout: 'inline'}
    ],
    defaultGridH: 2,
    render(ctx, node) {
      const root = div('group-box');
      const expandable = ctx.prop<boolean>(node, 'expandable', false);
      const expanded = ctx.prop<boolean>(node, 'expanded', true);
      const labelVisible = ctx.prop<boolean>(node, 'labelVisible', true);
      const title = ctx.prop<string>(node, 'label', '');
      const menuBarPosition = ctx.prop<string>(node, 'menuBarPosition', 'auto');

      if (labelVisible && (title || expandable)) {
        const header = div('group-box-header');
        if (expandable) header.classList.add('expandable');
        if (expandable) {
          const control = span('group-box-control', expanded ? '' : '');
          header.appendChild(control);
        }
        const titleEl = div('title');
        titleEl.appendChild(span('label', title));
        const subLabel = ctx.prop<string>(node, 'subLabel', '');
        if (subLabel) titleEl.appendChild(span('sub-label', subLabel));
        header.appendChild(titleEl);
        if (menuBarPosition === 'title') {
          const bar = renderMenuBar(ctx, node, 'title');
          if (bar) {
            header.classList.add('has-menubar');
            header.appendChild(bar);
          }
        }
        if (ctx.prop<boolean>(node, 'borderVisible', true)) header.appendChild(div('bottom-border'));
        root.appendChild(header);
      }

      if (menuBarPosition === 'top' || menuBarPosition === 'auto') {
        const bar = renderMenuBar(ctx, node, 'top');
        if (bar) root.appendChild(bar);
      }

      const notification = ctx.prop<string>(node, 'notification', '');
      if (notification) {
        const severity = ctx.prop<string>(node, 'notificationSeverity', 'info');
        const box = div(`notification ${severity}`);
        const badge = div('notification-icon');
        const icon = renderIcon(severity === 'ok' ? 'checked-bold' : severity === 'info' ? 'info' : 'exclamation-mark-bold');
        if (icon) badge.appendChild(icon);
        box.appendChild(badge);
        box.appendChild(div('notification-message', notification));
        const wrapper = div('group-box-notification');
        wrapper.appendChild(box);
        root.appendChild(wrapper);
      }

      if (!expandable || expanded) {
        root.appendChild(renderBody(ctx, node, div('group-box-body')));
      } else {
        root.classList.add('collapsed');
      }

      if (menuBarPosition === 'bottom') {
        const bar = renderMenuBar(ctx, node, 'bottom');
        if (bar) root.appendChild(bar);
      }
      return root;
    }
  },
  {
    objectType: 'TabBox',
    ownsLabel: true,
    label: 'Tab box',
    category: 'Containers',
    icon: 'list',
    description: 'Container with tab items; only the selected tab is shown.',
    javaClass: 'org.eclipse.scout.rt.client.ui.form.fields.tabbox.AbstractTabBox',
    jsClass: 'TabBox',
    isFormField: true,
    defaults: formFieldDefaults({
      'gridDataHints.useUiHeight': true,
      'gridDataHints.w': FULL_WIDTH,
      label: '',
      labelVisible: false,
      selectedTab: 0,
      'gridDataHints.h': 1,
    }),
    props: formFieldProps(
      {name: 'selectedTab', label: 'Selected tab index', type: 'number', group: GROUP_CONTENT, min: 0}
    ),
    slots: [
      {name: 'tabItems', label: 'Tabs', accepts: ['TabItem'], layout: 'stack'},
      {name: 'menus', label: 'Menus', accepts: ['Menu'], layout: 'inline'}
    ],
    defaultGridH: 1,
    render(ctx, node) {
      const root = div('tab-box');
      const tabs = ctx.childrenOf(node, 'tabItems');
      const selected = Math.min(Math.max(0, Number(ctx.prop<number>(node, 'selectedTab', 0))), Math.max(0, tabs.length - 1));
      const area = div('tab-area');
      tabs.forEach((tab, i) => {
        const item = div('tab-item');
        if (i === selected) item.classList.add('selected');
        if (i === 0) item.classList.add('first');
        if (tab.properties.enabled === false) item.classList.add('disabled');
        const titleEl = div('title');
        titleEl.appendChild(span('label', String(tab.properties.label ?? 'Tab')));
        if (tab.properties.subLabel) titleEl.appendChild(span('sub-label', String(tab.properties.subLabel)));
        item.appendChild(titleEl);
        item.dataset.nodeId = tab.id;
        item.dataset.tabIndex = String(i);
        area.appendChild(item);
      });
      if (!tabs.length) area.appendChild(div('tab-item empty', 'No tabs'));
      area.appendChild(div('tab-area-border'));
      root.appendChild(area);

      const content = div('tab-content');
      const active = tabs[selected];
      if (active) content.appendChild(ctx.renderNode(active, node));
      root.appendChild(content);
      return root;
    }
  },
  {
    objectType: 'TabItem',
    label: 'Tab item',
    category: 'Containers',
    icon: 'file',
    description: 'One tab of a tab box; behaves like a group box.',
    javaClass: 'org.eclipse.scout.rt.client.ui.form.fields.tabbox.AbstractTabItem',
    jsClass: 'TabItem',
    isFormField: false,
    defaults: {...WIDGET_DEFAULTS, label: 'Tab', gridColumnCount: INHERIT_COLUMN_COUNT, layoutMode: 'grid', subLabel: ''},
    props: [
      ...WIDGET_PROPS,
      {name: 'label', label: 'Title', type: 'string', group: GROUP_CONTENT},
      {name: 'subLabel', label: 'Sub title', type: 'string', group: GROUP_CONTENT},
      {name: 'marked', label: 'Marked', type: 'boolean', group: GROUP_STYLE, description: 'Scout marks a tab whose content changed with a small bar under the title.'},
      ...LAYOUT_PROPS
    ],
    slots: [{name: 'fields', label: 'Fields', accepts: FIELD_TYPES, layout: 'grid'}],
    render(ctx, node) {
      const root = div('tab-item-content group-box');
      root.appendChild(renderBody(ctx, node, div('group-box-body')));
      return root;
    }
  },
  {
    objectType: 'SequenceBox',
    label: 'Sequence box',
    category: 'Containers',
    icon: 'list',
    description: 'Places several fields side by side sharing a single label.',
    javaClass: 'org.eclipse.scout.rt.client.ui.form.fields.sequencebox.AbstractSequenceBox',
    jsClass: 'SequenceBox',
    isFormField: true,
    defaults: formFieldDefaults({label: 'From - to', autoCheckFromTo: true, 'gridDataHints.w': 2}),
    props: formFieldProps(
      {name: 'equalWidth', label: 'Equal widths', type: 'boolean', group: GROUP_LAYOUT}
    ),
    slots: [{name: 'fields', label: 'Fields', accepts: FIELD_TYPES, layout: 'inline'}],
    render(ctx, node) {
      const root = div('sequence-box-body');
      if (ctx.prop<boolean>(node, 'equalWidth', false)) root.classList.add('equal-width');
      const children = ctx.childrenOf(node, 'fields');
      children.forEach(child => {
        const el = ctx.renderNode(child, node);
        el.classList.add('sequence-box-child');
        root.appendChild(el);
      });
      if (!children.length) root.classList.add('empty-container');
      return root;
    }
  },
  {
    objectType: 'SplitBox',
    ownsLabel: true,
    label: 'Split box',
    category: 'Containers',
    icon: 'list',
    description: 'Two areas separated by a draggable splitter.',
    javaClass: 'org.eclipse.scout.rt.client.ui.form.fields.splitbox.AbstractSplitBox',
    jsClass: 'SplitBox',
    isFormField: true,
    defaults: formFieldDefaults({
      'gridDataHints.useUiHeight': true,
      'gridDataHints.w': FULL_WIDTH,
      label: '',
      labelVisible: false,
      splitHorizontal: true,
      splitterPosition: 0.5,
      'gridDataHints.h': 1,
    }),
    props: formFieldProps(
      {name: 'splitHorizontal', label: 'Split horizontally', type: 'boolean', group: GROUP_LAYOUT, description: 'Scout: true places the fields next to each other.'},
      {name: 'splitterPosition', label: 'Splitter position (0..1)', type: 'number', group: GROUP_LAYOUT, min: 0.05, max: 0.95, step: 0.05},
      {name: 'splitterEnabled', label: 'Splitter enabled', type: 'boolean', group: GROUP_LAYOUT}
    ),
    slots: [{name: 'fields', label: 'Fields', accepts: FIELD_TYPES, layout: 'stack', max: 2}],
    defaultGridH: 1,
    render(ctx, node) {
      const horizontal = ctx.prop<boolean>(node, 'splitHorizontal', true);
      const position = Math.min(0.95, Math.max(0.05, Number(ctx.prop<number>(node, 'splitterPosition', 0.5))));
      const root = div(`split-box ${horizontal ? 'horizontal' : 'vertical'}`);
      const children = ctx.childrenOf(node, 'fields').slice(0, 2);
      const first = div('split-area first');
      const second = div('split-area second');
      if (horizontal) {
        first.style.width = `calc(${position * 100}% - 4px)`;
        second.style.width = `calc(${(1 - position) * 100}% - 4px)`;
      } else {
        first.style.height = `calc(${position * 100}% - 4px)`;
        second.style.height = `calc(${(1 - position) * 100}% - 4px)`;
      }
      if (children[0]) first.appendChild(ctx.renderNode(children[0], node));
      else first.classList.add('empty-container');
      if (children[1]) second.appendChild(ctx.renderNode(children[1], node));
      else second.classList.add('empty-container');
      root.appendChild(first);
      root.appendChild(div('splitter'));
      root.appendChild(second);
      return root;
    }
  },
  {
    objectType: 'PlaceholderField',
    label: 'Placeholder',
    category: 'Containers',
    icon: 'square-solid',
    description: 'Invisible field that reserves a cell in the logical grid.',
    javaClass: 'org.eclipse.scout.rt.client.ui.form.fields.placeholder.AbstractPlaceholderField',
    jsClass: 'PlaceholderField',
    isFormField: true,
    defaults: formFieldDefaults({label: '', labelVisible: false, statusVisible: false}),
    props: formFieldProps(),
    slots: [],
    render() {
      return div('placeholder-field-box');
    }
  },
  {
    objectType: 'WrappedFormField',
    ownsLabel: true,
    label: 'Wrapped form field',
    category: 'Containers',
    icon: 'file',
    description: 'Embeds another form inside the current form.',
    javaClass: 'org.eclipse.scout.rt.client.ui.form.fields.wrappedform.AbstractWrappedFormField',
    jsClass: 'WrappedFormField',
    isFormField: true,
    defaults: formFieldDefaults({
      'gridDataHints.useUiHeight': true,
      'gridDataHints.weightY': 1,label: 'Wrapped form', labelVisible: false, gridColumnCount: 2, layoutMode: 'grid', 'gridDataHints.w': 2, 'gridDataHints.h': 4}),
    props: formFieldProps(...LAYOUT_PROPS, {name: 'formTitle', label: 'Embedded form title', type: 'string', group: GROUP_CONTENT}),
    slots: [{name: 'fields', label: 'Fields', accepts: FIELD_TYPES, layout: 'grid'}],
    defaultGridH: 4,
    render(ctx, node) {
      const root = div('wrapped-form-field-box');
      const title = ctx.prop<string>(node, 'formTitle', '');
      if (title) root.appendChild(div('wrapped-form-title', title));
      root.appendChild(renderBody(ctx, node, div('group-box-body')));
      return root;
    }
  },
  {
    objectType: 'Form',
    label: 'Form',
    category: 'Containers',
    icon: 'file',
    description: 'A Scout form. Shown as a view (tab) or as a modal dialog on the desktop.',
    javaClass: 'org.eclipse.scout.rt.client.ui.form.AbstractForm',
    jsClass: 'Form',
    isFormField: false,
    defaults: {
      ...WIDGET_DEFAULTS,
      title: 'New form',
      subTitle: '',
      displayHint: 'view',
      iconId: '',
      gridColumnCount: 2,
      layoutMode: 'grid',
      closable: true,
      modal: true,
      headerVisible: true,
      saveNeeded: false,
      askIfNeedSave: true,
      notificationBadgeText: '',
      dialogWidth: 640,
      dialogHeight: 420
    },
    props: [
      ...WIDGET_PROPS,
      {name: 'title', label: 'Title', type: 'string', group: GROUP_CONTENT},
      {name: 'subTitle', label: 'Sub title', type: 'string', group: GROUP_CONTENT},
      {name: 'iconId', label: 'Icon', type: 'icon', group: GROUP_CONTENT},
      {name: 'displayHint', label: 'Display hint', type: 'enum', group: GROUP_LAYOUT, options: [
        {value: 'view', label: 'VIEW (bench tab)'},
        {value: 'dialog', label: 'DIALOG (modal)'},
        {value: 'popup-window', label: 'POPUP_WINDOW'}
      ]},
      {name: 'notificationBadgeText', label: 'Notification badge', type: 'string', group: GROUP_CONTENT, description: 'Small badge on the view tab, e.g. an unread count.'},
      {name: 'headerVisible', label: 'Header visible', type: 'boolean', group: GROUP_LAYOUT, visibleWhen: p => p.displayHint !== 'view'},
      {name: 'closable', label: 'Closable', type: 'boolean', group: GROUP_CONTENT},
      {name: 'modal', label: 'Modal', type: 'boolean', group: GROUP_LAYOUT, visibleWhen: p => p.displayHint === 'dialog'},
      {name: 'saveNeeded', label: 'Save needed marker', type: 'boolean', group: GROUP_CONTENT},
      {name: 'askIfNeedSave', label: 'Ask if need save', type: 'boolean', group: GROUP_CONTENT},
      {name: 'dialogWidth', label: 'Dialog width (px)', type: 'number', group: GROUP_LAYOUT, min: 200, visibleWhen: p => p.displayHint === 'dialog'},
      {name: 'dialogHeight', label: 'Dialog height (px)', type: 'number', group: GROUP_LAYOUT, min: 120, visibleWhen: p => p.displayHint === 'dialog'},
      ...LAYOUT_PROPS
    ],
    slots: [
      {name: 'fields', label: 'Fields (root group box)', accepts: FIELD_TYPES, layout: 'grid'},
      {name: 'menus', label: 'Form menus', accepts: ['Menu', 'Button'], layout: 'inline'}
    ],
    render(ctx, node) {
      const dialog = ctx.prop<string>(node, 'displayHint', 'view') !== 'view';
      const root = div(dialog ? 'form dialog' : 'form view');
      if (dialog) {
        root.style.width = `${ctx.prop<number>(node, 'dialogWidth', 640)}px`;
        root.style.height = `${ctx.prop<number>(node, 'dialogHeight', 420)}px`;
      }
      if (dialog && ctx.prop<boolean>(node, 'headerVisible', true)) {
        const header = div('form-header');
        const icon = renderIcon(ctx.prop<string>(node, 'iconId', ''));
        if (icon) header.appendChild(icon);
        const titles = div('form-titles');
        titles.appendChild(div('form-title', ctx.prop<string>(node, 'title', '')));
        const sub = ctx.prop<string>(node, 'subTitle', '');
        if (sub) titles.appendChild(div('form-sub-title', sub));
        header.appendChild(titles);
        if (ctx.prop<boolean>(node, 'closable', true)) {
          const closer = renderIcon('remove', 'closer');
          if (closer) header.appendChild(closer);
        }
        root.appendChild(header);
      }
      const body = div('root-group-box group-box');
      body.appendChild(renderBody(ctx, node, div('group-box-body')));
      root.appendChild(body);

      const menus = ctx.renderSlot(node, 'menus');
      if (menus.length) {
        const bar = div('menubar main-menubar bottom');
        const box = div('menubar-box');
        menus.forEach(m => box.appendChild(m));
        bar.appendChild(box);
        root.appendChild(bar);
      }
      return root;
    }
  }
];

registerWidgets(defs);
