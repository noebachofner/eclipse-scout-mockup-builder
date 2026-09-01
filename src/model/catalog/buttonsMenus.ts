import {registerWidgets, type WidgetDef} from './registry';
import {formFieldDefaults, formFieldProps, GROUP_CONTENT, GROUP_STYLE, WIDGET_DEFAULTS, WIDGET_PROPS} from './common';
import {div, span} from '../../render/dom';
import {renderIcon} from '../../render/icons';

const defs: WidgetDef[] = [
  {
    objectType: 'Button',
    label: 'Button',
    category: 'Buttons & Menus',
    icon: 'checked-bold',
    description: 'Push, toggle or radio button placed in a form.',
    javaClass: 'org.eclipse.scout.rt.client.ui.form.fields.button.AbstractButton',
    jsClass: 'Button',
    isFormField: true,
    defaults: formFieldDefaults({
      label: 'Button',
      labelVisible: false,
      text: 'Button',
      displayStyle: 'default',
      processButton: true,
      iconId: '',
      'gridDataHints.fillHorizontal': false,
      'gridDataHints.useUiWidth': true
    }),
    props: formFieldProps(
      {name: 'text', label: 'Text', type: 'string', group: GROUP_CONTENT},
      {name: 'iconId', label: 'Icon', type: 'icon', group: GROUP_CONTENT},
      {name: 'displayStyle', label: 'Display style', type: 'enum', group: GROUP_STYLE, options: [
        {value: 'default', label: 'DEFAULT'},
        {value: 'toggle', label: 'TOGGLE'},
        {value: 'link', label: 'LINK'},
        {value: 'borderless', label: 'BORDERLESS'}
      ]},
      {name: 'defaultButton', label: 'Default button', type: 'boolean', group: GROUP_STYLE},
      {name: 'selected', label: 'Selected (toggle)', type: 'boolean', group: GROUP_CONTENT, visibleWhen: p => p.displayStyle === 'toggle'},
      {name: 'keyStroke', label: 'Key stroke', type: 'string', group: GROUP_CONTENT, placeholder: 'ctrl-s'}
    ),
    slots: [{name: 'menus', label: 'Menus', accepts: ['Menu'], layout: 'inline'}],
    render(ctx, node) {
      const style = ctx.prop<string>(node, 'displayStyle', 'default');
      const button = div('button');
      button.classList.add(`display-style-${style}`);
      if (ctx.prop<boolean>(node, 'defaultButton', false)) button.classList.add('default');
      if (style === 'toggle' && ctx.prop<boolean>(node, 'selected', false)) button.classList.add('selected');
      if (!ctx.prop<boolean>(node, 'enabled', true)) button.classList.add('disabled');
      const icon = renderIcon(ctx.prop<string>(node, 'iconId', ''));
      const text = ctx.prop<string>(node, 'text', '');
      if (icon) {
        if (text) icon.classList.add('with-label');
        button.appendChild(icon);
      }
      if (text) button.appendChild(span('text', text));
      if (!text && !icon) button.appendChild(span('text', 'Button'));
      const wrapper = div('button-container');
      wrapper.appendChild(button);
      return wrapper;
    }
  },
  {
    objectType: 'Menu',
    label: 'Menu',
    category: 'Buttons & Menus',
    icon: 'ellipsis-v',
    description: 'Menu item in a menu bar, context menu or the desktop tool box.',
    javaClass: 'org.eclipse.scout.rt.client.ui.action.menu.AbstractMenu',
    jsClass: 'Menu',
    isFormField: false,
    defaults: {
      ...WIDGET_DEFAULTS,
      text: 'Menu',
      iconId: '',
      separator: false,
      selected: false,
      displayStyle: 'default',
      horizontalAlignment: -1,
      keyStroke: ''
    },
    props: [
      ...WIDGET_PROPS,
      {name: 'text', label: 'Text', type: 'string', group: GROUP_CONTENT},
      {name: 'iconId', label: 'Icon', type: 'icon', group: GROUP_CONTENT},
      {name: 'keyStroke', label: 'Key stroke', type: 'string', group: GROUP_CONTENT, placeholder: 'ctrl-n'},
      {name: 'displayStyle', label: 'Display style', type: 'enum', group: GROUP_STYLE, options: [
        {value: 'default', label: 'DEFAULT'},
        {value: 'avatar', label: 'AVATAR (round icon, e.g. the user menu)'}
      ]},
      {name: 'separator', label: 'Separator', type: 'boolean', group: GROUP_STYLE},
      {name: 'selected', label: 'Selected', type: 'boolean', group: GROUP_STYLE},
      {name: 'horizontalAlignment', label: 'Horizontal alignment', type: 'enum', group: GROUP_STYLE, options: [
        {value: -1, label: 'LEFT (-1)'},
        {value: 1, label: 'RIGHT (1)'}
      ]},
      {name: 'childActionsOpen', label: 'Show sub menu', type: 'boolean', group: GROUP_CONTENT}
    ],
    slots: [{name: 'childActions', label: 'Sub menus', accepts: ['Menu'], layout: 'stack'}],
    render(ctx, node) {
      if (ctx.prop<boolean>(node, 'separator', false)) {
        return div('menu-separator');
      }
      const displayStyle = ctx.prop<string>(node, 'displayStyle', 'default');
      const item = div('menu-item');
      if (displayStyle === 'avatar') item.classList.add('avatar-menu');
      if (ctx.prop<boolean>(node, 'selected', false)) item.classList.add('selected');
      if (!ctx.prop<boolean>(node, 'enabled', true)) item.classList.add('disabled');
      if (Number(ctx.prop<number>(node, 'horizontalAlignment', -1)) === 1) item.classList.add('right-aligned');
      const icon = renderIcon(ctx.prop<string>(node, 'iconId', ''));
      const text = ctx.prop<string>(node, 'text', '');
      if (icon && displayStyle === 'avatar') {
        const avatar = div('menu-avatar');
        avatar.appendChild(icon);
        item.appendChild(avatar);
      } else if (icon) {
        if (text) icon.classList.add('with-label');
        item.appendChild(icon);
      } else if (!text) {
        item.classList.add('menu-icononly');
      }
      if (text) item.appendChild(span('text', text));
      const children = ctx.childrenOf(node, 'childActions');
      if (children.length) {
        const arrow = renderIcon('angle-down', 'submenu-icon');
        if (arrow) item.appendChild(arrow);
      }
      if (children.length && ctx.prop<boolean>(node, 'childActionsOpen', false)) {
        const popup = div('context-menu-popup');
        children.forEach(child => popup.appendChild(ctx.renderNode(child, node)));
        const wrapper = div('menu-with-popup');
        wrapper.appendChild(item);
        wrapper.appendChild(popup);
        return wrapper;
      }
      return item;
    }
  },
  {
    objectType: 'FileChooserButton',
    label: 'File chooser button',
    category: 'Buttons & Menus',
    icon: 'folder',
    description: 'Button that opens the file chooser.',
    jsClass: 'FileChooserButton',
    isFormField: true,
    defaults: formFieldDefaults({label: 'Attachment', text: 'Choose file...', 'gridDataHints.fillHorizontal': false}),
    props: formFieldProps({name: 'text', label: 'Text', type: 'string', group: GROUP_CONTENT}),
    slots: [],
    render(ctx, node) {
      const wrapper = div('button-container');
      const button = div('button');
      const icon = renderIcon('folder', 'with-label');
      if (icon) button.appendChild(icon);
      button.appendChild(span('text', ctx.prop<string>(node, 'text', 'Choose file...')));
      wrapper.appendChild(button);
      return wrapper;
    }
  }
];

registerWidgets(defs);
