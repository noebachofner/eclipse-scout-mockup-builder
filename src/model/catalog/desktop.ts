import {registerWidgets, type WidgetDef} from './registry';
import {GROUP_CONTENT, GROUP_LAYOUT, GROUP_STYLE, WIDGET_DEFAULTS, WIDGET_PROPS} from './common';
import {div, span} from '../../render/dom';
import {renderIcon} from '../../render/icons';
import type {MockupNode} from '../types';

interface OutlineNodeSpec {
  level: number;
  text: string;
  iconId: string;
  expanded: boolean;
}

/**
 * Outline pages are written as indented text (two spaces per level). A line may
 * carry an icon: `Customers [group]`. A leading `+` marks a collapsed node.
 */
export function parseOutlineNodes(raw: unknown): OutlineNodeSpec[] {
  return String(raw ?? '')
    .split(/\r?\n/)
    .filter(line => line.trim())
    .map(line => {
      const indent = line.length - line.trimStart().length;
      let text = line.trim();
      const collapsed = text.startsWith('+');
      if (collapsed || text.startsWith('-')) text = text.slice(1).trim();
      let iconId = '';
      const iconMatch = /\[([\w-]+)\]\s*$/.exec(text);
      if (iconMatch) {
        iconId = iconMatch[1];
        text = text.slice(0, iconMatch.index).trim();
      }
      return {level: Math.floor(indent / 2), text, iconId, expanded: !collapsed};
    });
}

const DEFAULT_OUTLINE_NODES = [
  'Dashboard [chart]',
  'Customers [group]',
  '  Companies',
  '  Persons',
  'Orders [list]',
  '  Open orders',
  '  Archived orders',
  '+ Administration [gear]'
].join('\n');

const defs: WidgetDef[] = [
  {
    objectType: 'Desktop',
    label: 'Desktop',
    category: 'Desktop',
    icon: 'world',
    description: 'The Scout desktop: navigation on the left, header with view tabs and tool box on top, bench in the middle.',
    javaClass: 'org.eclipse.scout.rt.client.ui.desktop.AbstractDesktop',
    jsClass: 'Desktop',
    isFormField: false,
    defaults: {
      ...WIDGET_DEFAULTS,
      title: 'ES Mockup Application',
      navigationVisible: true,
      navigationWidth: 290,
      headerVisible: true,
      benchVisible: true,
      selectedOutline: 0,
      selectedView: 0,
      benchContent: 'views',
      logoText: 'ES',
      logoUrl: '',
      displayStyle: 'default',
      navigationInBackground: false,
      outlineIconId: 'folder',
      viewButtonDisplayStyle: 'menu'
    },
    props: [
      {name: 'title', label: 'Application title', type: 'string', group: GROUP_CONTENT},
      {name: 'navigationVisible', label: 'Navigation visible', type: 'boolean', group: GROUP_LAYOUT},
      {name: 'navigationWidth', label: 'Navigation width (px)', type: 'number', group: GROUP_LAYOUT, min: 49, max: 640},
      {name: 'headerVisible', label: 'Header visible', type: 'boolean', group: GROUP_LAYOUT},
      {name: 'benchVisible', label: 'Bench visible', type: 'boolean', group: GROUP_LAYOUT},
      {name: 'displayStyle', label: 'Display style', type: 'enum', group: GROUP_LAYOUT, options: [
        {value: 'default', label: 'DEFAULT'},
        {value: 'bench', label: 'BENCH (no navigation)'}
      ]},
      {name: 'selectedOutline', label: 'Selected outline index', type: 'number', group: GROUP_CONTENT, min: 0},
      {name: 'benchContent', label: 'Bench shows', type: 'enum', group: GROUP_CONTENT, options: [
        {value: 'views', label: 'Views (form tabs)'},
        {value: 'outlineDetail', label: "Selected outline's detail"}
      ]},
      {name: 'selectedView', label: 'Selected view index', type: 'number', group: GROUP_CONTENT, min: 0, visibleWhen: p => p.benchContent !== 'outlineDetail'},
      {
        name: 'viewButtonDisplayStyle',
        label: 'Outline buttons',
        type: 'enum',
        group: GROUP_LAYOUT,
        options: [
          {value: 'menu', label: 'MENU (icon + switcher)'},
          {value: 'compact', label: 'COMPACT (switcher only)'},
          {value: 'tabs', label: 'TABS (one icon per outline, side by side)'}
        ],
        description: 'How the outlines are offered at the top left. TABS shows every outline as its own icon button - give each outline an icon to tell them apart.'
      },
      {name: 'outlineIconId', label: 'Outline switcher icon', type: 'icon', group: GROUP_STYLE, visibleWhen: p => p.viewButtonDisplayStyle !== 'tabs', description: "Icon of the outline switcher. Falls back to the selected outline's icon."},
      {
        name: 'navigationInBackground',
        label: 'Navigation in background',
        type: 'boolean',
        group: GROUP_STYLE,
        description: 'Scout dims the navigation while a dialog or a view has the focus: the selected page turns grey instead of accent coloured.'
      },
      {name: 'logoText', label: 'Logo text', type: 'string', group: GROUP_STYLE, description: 'Shown when no logo URL is set.'},
      {name: 'logoUrl', label: 'Logo', type: 'image', group: GROUP_STYLE}
    ],
    slots: [
      {name: 'outlines', label: 'Outlines', accepts: ['Outline'], layout: 'stack'},
      {name: 'views', label: 'Views (bench)', accepts: ['Form'], layout: 'stack'},
      {name: 'toolMenus', label: 'Tool box menus', accepts: ['Menu'], layout: 'inline'},
      {name: 'notifications', label: 'Notifications', accepts: ['Notification'], layout: 'stack'},
      {name: 'dialogs', label: 'Dialogs & message boxes', accepts: ['Form', 'MessageBox'], layout: 'stack'},
      {name: 'popups', label: 'Popups & tooltips', accepts: ['Popup', 'Tooltip'], layout: 'stack'}
    ],
    render(ctx, node) {
      const navigationVisible = ctx.prop<boolean>(node, 'navigationVisible', true)
        && ctx.prop<string>(node, 'displayStyle', 'default') !== 'bench';
      const headerVisible = ctx.prop<boolean>(node, 'headerVisible', true);
      const benchVisible = ctx.prop<boolean>(node, 'benchVisible', true);
      const navigationWidth = navigationVisible ? Number(ctx.prop<number>(node, 'navigationWidth', 290)) : 0;

      const desktop = div('desktop');
      if (!navigationVisible) desktop.classList.add('navigation-invisible');

      const outlines = ctx.childrenOf(node, 'outlines');
      const selectedOutlineIndex = Math.min(Math.max(0, Number(ctx.prop<number>(node, 'selectedOutline', 0))), Math.max(0, outlines.length - 1));
      const selectedOutline: MockupNode | undefined = outlines[selectedOutlineIndex];

      const inBackground = ctx.prop<boolean>(node, 'navigationInBackground', false);

      if (navigationVisible) {
        const navigation = div('desktop-navigation');
        navigation.style.width = `${navigationWidth}px`;
        if (inBackground) navigation.classList.add('in-background');

        // Top-left: the outline switcher, exactly where Scout puts the view
        // button box. `selected` is the state Scout shows while the navigation
        // holds the active outline - the white card on the blue header.
        const viewButtonBox = div('view-button-box');
        const displayStyle = ctx.prop<string>(node, 'viewButtonDisplayStyle', 'menu');

        if (displayStyle === 'tabs') {
          // Every outline gets its own button, side by side - Scout's TAB style
          // for view buttons.
          const wrapper = div('view-tab-wrapper');
          outlines.forEach((outline, i) => {
            const tab = div('view-tab');
            if (i === selectedOutlineIndex) tab.classList.add('selected');
            const icon = renderIcon(String(outline.properties.iconId ?? '') || 'folder');
            if (icon) tab.appendChild(icon);
            tab.title = String(outline.properties.title ?? '');
            tab.dataset.nodeId = outline.id;
            wrapper.appendChild(tab);
          });
          if (!outlines.length) wrapper.appendChild(div('view-tab selected'));
          viewButtonBox.appendChild(wrapper);
        } else {
          // The outline switcher. `selected` is the state Scout shows while the
          // navigation holds the active outline: a white tab that merges into
          // the navigation body below it.
          const viewMenuTab = div('view-menu-tab selected');
          if (displayStyle === 'compact') viewMenuTab.classList.add('selected-button-invisible');
          else {
            const viewButton = div('view-button');
            const outlineIcon = renderIcon(
              (selectedOutline && String(selectedOutline.properties.iconId ?? '')) || ctx.prop<string>(node, 'outlineIconId', 'folder')
            );
            if (outlineIcon) viewButton.appendChild(outlineIcon);
            viewMenuTab.appendChild(viewButton);
          }
          const viewMenu = div('view-menu');
          const caret = renderIcon('angle-down');
          if (caret) viewMenu.appendChild(caret);
          viewMenuTab.appendChild(viewMenu);
          viewButtonBox.appendChild(viewMenuTab);

          // Further outlines appear as small buttons next to the switcher.
          if (outlines.length > 1) {
            const wrapper = div('view-tab-wrapper');
            outlines.forEach((outline, i) => {
              if (i === selectedOutlineIndex) return;
              const tab = div('view-tab');
              const icon = renderIcon(String(outline.properties.iconId ?? '') || 'star');
              if (icon) tab.appendChild(icon);
              tab.title = String(outline.properties.title ?? '');
              tab.dataset.nodeId = outline.id;
              wrapper.appendChild(tab);
            });
            if (wrapper.childElementCount) viewButtonBox.appendChild(wrapper);
          }
        }
        if (inBackground) viewButtonBox.classList.add('in-background');
        navigation.appendChild(viewButtonBox);

        const body = div('navigation-body');
        if (selectedOutline) {
          body.appendChild(ctx.renderNode(selectedOutline, node));
        } else {
          body.classList.add('empty-container');
        }
        navigation.appendChild(body);
        desktop.appendChild(navigation);
      }

      const views = ctx.childrenOf(node, 'views');
      const selectedViewIndex = Math.min(Math.max(0, Number(ctx.prop<number>(node, 'selectedView', 0))), Math.max(0, views.length - 1));
      const benchContent = ctx.prop<string>(node, 'benchContent', 'views');
      const showViewTabs = benchContent !== 'outlineDetail';

      if (headerVisible) {
        const header = div('desktop-header');
        header.style.left = `${navigationWidth}px`;
        if (inBackground) header.classList.add('in-background');

        if (showViewTabs) {
          const tabArea = div('simple-tab-area');
          views.forEach((view, i) => {
            const tab = div('desktop-tab simple-tab');
            if (i === selectedViewIndex) tab.classList.add('selected');
            const titleLine = div('title-line');
            const icon = renderIcon(String(view.properties.iconId ?? ''));
            if (icon) {
              const container = div('icon-container');
              container.appendChild(icon);
              titleLine.appendChild(container);
            }
            titleLine.appendChild(span('title', String(view.properties.title ?? 'Form')));
            if (view.properties.saveNeeded) titleLine.appendChild(span('save-needer', '*'));
            tab.appendChild(titleLine);
            const sub = String(view.properties.subTitle ?? '');
            if (sub) tab.appendChild(div('sub-title', sub));
            tab.dataset.viewIndex = String(i);
            tab.dataset.nodeId = view.id;
            tabArea.appendChild(tab);
          });
          header.appendChild(tabArea);
        }

        const toolBox = div('desktop-tool-box');
        ctx.renderSlot(node, 'toolMenus').forEach(menu => toolBox.appendChild(menu));
        header.appendChild(toolBox);

        const logo = div('desktop-logo');
        const logoUrl = ctx.prop<string>(node, 'logoUrl', '');
        if (logoUrl) {
          const img = document.createElement('img');
          img.className = 'image';
          img.src = logoUrl;
          img.alt = ctx.prop<string>(node, 'title', 'Logo');
          logo.appendChild(img);
        } else {
          logo.appendChild(span('logo-text', ctx.prop<string>(node, 'logoText', 'ES')));
        }
        header.appendChild(logo);
        desktop.appendChild(header);
      }

      if (benchVisible) {
        const bench = div('desktop-bench');
        bench.style.left = `${navigationWidth}px`;
        bench.style.top = headerVisible ? 'var(--scout-desktop-header-height)' : '0';

        const notifications = ctx.renderSlot(node, 'notifications');
        if (notifications.length) {
          const container = div('desktop-notifications');
          notifications.forEach(n => container.appendChild(n));
          bench.appendChild(container);
        }

        if (benchContent === 'outlineDetail') {
          const detail = selectedOutline ? ctx.childrenOf(selectedOutline, 'detail') : [];
          const content = div('bench-content outline-detail');
          if (detail.length) {
            detail.forEach(child => content.appendChild(ctx.renderNode(child, selectedOutline!)));
          } else {
            content.classList.add('empty-container');
          }
          bench.appendChild(content);
        } else {
          const active = views[selectedViewIndex];
          const content = div('bench-content');
          if (active) {
            content.appendChild(ctx.renderNode(active, node));
          } else {
            content.classList.add('empty-container');
          }
          bench.appendChild(content);
        }
        desktop.appendChild(bench);
      }

      // Popups float above the desktop without dimming it, unlike a dialog.
      const popups = ctx.renderSlot(node, 'popups');
      if (popups.length) {
        const layer = div('desktop-popups');
        popups.forEach(popup => layer.appendChild(popup));
        desktop.appendChild(layer);
      }

      const dialogs = ctx.childrenOf(node, 'dialogs');
      if (dialogs.length) {
        const glasspane = div('glasspane');
        dialogs.forEach(dialog => glasspane.appendChild(ctx.renderNode(dialog, node)));
        desktop.appendChild(glasspane);
      }
      return desktop;
    }
  },
  {
    objectType: 'Outline',
    label: 'Outline',
    category: 'Desktop',
    icon: 'folder',
    description: 'A tree of pages shown in the desktop navigation.',
    javaClass: 'org.eclipse.scout.rt.client.ui.desktop.outline.AbstractOutline',
    jsClass: 'Outline',
    isFormField: false,
    defaults: {
      ...WIDGET_DEFAULTS,
      title: 'Navigation',
      iconId: '',
      nodes: DEFAULT_OUTLINE_NODES,
      selectedNode: 1,
      titleVisible: true
    },
    props: [
      ...WIDGET_PROPS,
      {name: 'title', label: 'Title', type: 'string', group: GROUP_CONTENT},
      {name: 'iconId', label: 'Icon', type: 'icon', group: GROUP_CONTENT},
      {name: 'titleVisible', label: 'Title visible', type: 'boolean', group: GROUP_STYLE},
      {
        name: 'nodes',
        label: 'Pages',
        type: 'lines',
        group: GROUP_CONTENT,
        description: 'Two spaces per level. `+` marks a collapsed page, `[icon-name]` adds a Scout icon.'
      },
      {name: 'selectedNode', label: 'Selected page index', type: 'number', group: GROUP_CONTENT, min: -1}
    ],
    slots: [
      {name: 'detail', label: 'Detail content (bench)', accepts: ['Table', 'Form', 'TableField'], layout: 'stack'},
      {name: 'menus', label: 'Title menus', accepts: ['Menu'], layout: 'inline'}
    ],
    render(ctx, node) {
      const outline = div('outline tree');
      if (ctx.prop<boolean>(node, 'titleVisible', true)) {
        const title = div('outline-title');
        const icon = renderIcon(ctx.prop<string>(node, 'iconId', ''));
        if (icon) title.appendChild(icon);
        title.appendChild(span('text', ctx.prop<string>(node, 'title', '')));
        const menus = ctx.renderSlot(node, 'menus');
        if (menus.length) {
          const bar = div('menubar');
          const box = div('menubar-box');
          menus.forEach(m => box.appendChild(m));
          bar.appendChild(box);
          title.appendChild(bar);
        }
        outline.appendChild(title);
      }

      const nodes = parseOutlineNodes(ctx.prop<string>(node, 'nodes', DEFAULT_OUTLINE_NODES));
      const selected = Number(ctx.prop<number>(node, 'selectedNode', 1));
      const indentOf = (level: number): number => 37 + level * 17;
      const data = div('tree-data');
      nodes.forEach((entry, i) => {
        const row = div('outline-node tree-node');
        row.style.paddingLeft = `${indentOf(entry.level)}px`;
        const hasChildren = nodes[i + 1] ? nodes[i + 1].level > entry.level : false;
        const control = span('tree-node-control');
        control.classList.toggle('expanded', hasChildren && entry.expanded);
        control.classList.toggle('empty', !hasChildren);
        row.appendChild(control);
        const icon = renderIcon(entry.iconId);
        if (icon) row.appendChild(icon);
        row.appendChild(span('text', entry.text));
        if (i === selected) row.classList.add('selected');
        data.appendChild(row);
      });
      outline.appendChild(data);
      return outline;
    }
  }
];

registerWidgets(defs);
