import {registerWidgets, type WidgetDef} from './registry';
import {formFieldDefaults, formFieldProps, GROUP_CONTENT, GROUP_STYLE} from './common';
import {div, span} from '../../render/dom';
import {inputField, lines} from '../../render/parts';
import {renderIcon} from '../../render/icons';

const ALIGN_OPTIONS = [
  {value: 'left', label: 'LEFT'},
  {value: 'center', label: 'CENTER'},
  {value: 'right', label: 'RIGHT'}
];

/** Every value field shares these extra properties. */
const valueProps = [
  {name: 'displayText', label: 'Display text', type: 'string' as const, group: GROUP_CONTENT, description: 'The value shown in the mockup.'},
  {name: 'placeholder', label: 'Placeholder', type: 'string' as const, group: GROUP_CONTENT},
  {name: 'readOnly', label: 'Read only', type: 'boolean' as const, group: GROUP_CONTENT}
];

function styleClass(fieldStyle: string): string {
  return fieldStyle === 'classic' ? 'classic' : 'alternative';
}

const defs: WidgetDef[] = [
  {
    objectType: 'StringField',
    label: 'String field',
    category: 'Value fields',
    icon: 'pencil',
    description: 'Single or multi-line text input.',
    javaClass: 'org.eclipse.scout.rt.client.ui.form.fields.stringfield.AbstractStringField',
    jsClass: 'StringField',
    isFormField: true,
    defaults: formFieldDefaults({label: 'String field', displayText: '', multilineText: false, inputMasked: false, format: 'none', maxLength: 4000}),
    props: formFieldProps(
      ...valueProps,
      {name: 'multilineText', label: 'Multiline', type: 'boolean', group: GROUP_CONTENT},
      {name: 'inputMasked', label: 'Input masked (password)', type: 'boolean', group: GROUP_CONTENT},
      {name: 'maxLength', label: 'Max length', type: 'number', group: GROUP_CONTENT, min: 1},
      {name: 'format', label: 'Format', type: 'enum', group: GROUP_CONTENT, options: [
        {value: 'none', label: 'none'},
        {value: 'upper', label: 'UPPERCASE'},
        {value: 'lower', label: 'lowercase'}
      ]},
      {name: 'alignment', label: 'Text alignment', type: 'enum', group: GROUP_STYLE, options: ALIGN_OPTIONS}
    ),
    slots: [{name: 'menus', label: 'Menus', accepts: ['Menu'], layout: 'inline'}],
    render(ctx, node) {
      const multiline = ctx.prop<boolean>(node, 'multilineText', false);
      let text = ctx.prop<string>(node, 'displayText', '');
      if (ctx.prop<boolean>(node, 'inputMasked', false) && text) text = '•'.repeat(text.length);
      const format = ctx.prop<string>(node, 'format', 'none');
      if (format === 'upper') text = text.toUpperCase();
      if (format === 'lower') text = text.toLowerCase();
      return inputField(text, {
        placeholder: ctx.prop<string>(node, 'placeholder', ''),
        multiline,
        alignment: ctx.prop<'left' | 'center' | 'right'>(node, 'alignment', 'left'),
        disabled: !ctx.prop<boolean>(node, 'enabled', true),
        extraClass: styleClass(ctx.prop<string>(node, 'fieldStyle', 'alternative'))
      });
    }
  },
  {
    objectType: 'NumberField',
    label: 'Number field',
    category: 'Value fields',
    icon: 'sum',
    description: 'Numeric input, right aligned by default.',
    javaClass: 'org.eclipse.scout.rt.client.ui.form.fields.numberfield.AbstractNumberField',
    jsClass: 'NumberField',
    isFormField: true,
    defaults: formFieldDefaults({label: 'Number field', displayText: '', alignment: 'right', decimalFormat: "#,##0.00"}),
    props: formFieldProps(
      ...valueProps,
      {name: 'decimalFormat', label: 'Decimal format', type: 'string', group: GROUP_CONTENT, placeholder: '#,##0.00'},
      {name: 'alignment', label: 'Text alignment', type: 'enum', group: GROUP_STYLE, options: ALIGN_OPTIONS}
    ),
    slots: [],
    render(ctx, node) {
      return inputField(ctx.prop<string>(node, 'displayText', ''), {
        placeholder: ctx.prop<string>(node, 'placeholder', ''),
        alignment: ctx.prop<'left' | 'center' | 'right'>(node, 'alignment', 'right'),
        disabled: !ctx.prop<boolean>(node, 'enabled', true),
        extraClass: styleClass(ctx.prop<string>(node, 'fieldStyle', 'alternative'))
      });
    }
  },
  {
    objectType: 'IntegerField',
    label: 'Integer field',
    category: 'Value fields',
    icon: 'sum',
    description: 'Number field restricted to integers.',
    javaClass: 'org.eclipse.scout.rt.client.ui.form.fields.integerfield.AbstractIntegerField',
    jsClass: 'IntegerField',
    isFormField: true,
    defaults: formFieldDefaults({label: 'Integer field', displayText: '', alignment: 'right'}),
    props: formFieldProps(...valueProps, {name: 'alignment', label: 'Text alignment', type: 'enum', group: GROUP_STYLE, options: ALIGN_OPTIONS}),
    slots: [],
    render(ctx, node) {
      return inputField(ctx.prop<string>(node, 'displayText', ''), {
        placeholder: ctx.prop<string>(node, 'placeholder', ''),
        alignment: 'right',
        disabled: !ctx.prop<boolean>(node, 'enabled', true),
        extraClass: styleClass(ctx.prop<string>(node, 'fieldStyle', 'alternative'))
      });
    }
  },
  {
    objectType: 'DateField',
    label: 'Date field',
    category: 'Value fields',
    icon: 'calendar',
    description: 'Date and/or time picker.',
    javaClass: 'org.eclipse.scout.rt.client.ui.form.fields.datefield.AbstractDateField',
    jsClass: 'DateField',
    isFormField: true,
    defaults: formFieldDefaults({label: 'Date field', displayText: '', hasDate: true, hasTime: false}),
    props: formFieldProps(
      ...valueProps,
      {name: 'hasDate', label: 'Has date', type: 'boolean', group: GROUP_CONTENT},
      {name: 'hasTime', label: 'Has time', type: 'boolean', group: GROUP_CONTENT},
      {name: 'timeDisplayText', label: 'Time text', type: 'string', group: GROUP_CONTENT, visibleWhen: p => p.hasTime === true}
    ),
    slots: [],
    render(ctx, node) {
      const hasDate = ctx.prop<boolean>(node, 'hasDate', true);
      const hasTime = ctx.prop<boolean>(node, 'hasTime', false);
      const style = styleClass(ctx.prop<string>(node, 'fieldStyle', 'alternative'));
      const root = div('date-time-container');
      if (hasDate) {
        const part = inputField(ctx.prop<string>(node, 'displayText', ''), {
          placeholder: ctx.prop<string>(node, 'placeholder', ''),
          icon: 'calendar',
          disabled: !ctx.prop<boolean>(node, 'enabled', true),
          extraClass: style
        });
        part.classList.add('date-part');
        root.appendChild(part);
      }
      if (hasTime) {
        const part = inputField(ctx.prop<string>(node, 'timeDisplayText', ''), {
          icon: 'clock',
          disabled: !ctx.prop<boolean>(node, 'enabled', true),
          extraClass: style
        });
        part.classList.add('time-part');
        root.appendChild(part);
      }
      return root;
    }
  },
  {
    objectType: 'SmartField',
    label: 'Smart field',
    category: 'Value fields',
    icon: 'search',
    description: 'Lookup field with type-ahead proposals.',
    javaClass: 'org.eclipse.scout.rt.client.ui.form.fields.smartfield.AbstractSmartField',
    jsClass: 'SmartField',
    isFormField: true,
    defaults: formFieldDefaults({label: 'Smart field', displayText: '', browseAutoExpandAll: true, displayStyle: 'default'}),
    props: formFieldProps(
      ...valueProps,
      {name: 'displayStyle', label: 'Display style', type: 'enum', group: GROUP_STYLE, options: [
        {value: 'default', label: 'DEFAULT'},
        {value: 'dropdown', label: 'DROPDOWN'}
      ]},
      {name: 'popupOpen', label: 'Show proposal popup', type: 'boolean', group: GROUP_CONTENT},
      {name: 'proposals', label: 'Proposals (one per line)', type: 'lines', group: GROUP_CONTENT, visibleWhen: p => p.popupOpen === true}
    ),
    slots: [],
    render(ctx, node) {
      const dropdown = ctx.prop<string>(node, 'displayStyle', 'default') === 'dropdown';
      const root = div('smart-field-container');
      const field = inputField(ctx.prop<string>(node, 'displayText', ''), {
        placeholder: ctx.prop<string>(node, 'placeholder', ''),
        icon: dropdown ? 'angle-down' : 'angle-down',
        disabled: !ctx.prop<boolean>(node, 'enabled', true),
        extraClass: styleClass(ctx.prop<string>(node, 'fieldStyle', 'alternative'))
      });
      root.appendChild(field);
      if (ctx.prop<boolean>(node, 'popupOpen', false)) {
        const popup = div('proposal-popup');
        for (const [i, text] of lines(ctx.prop<string>(node, 'proposals', ''), ['Proposal one', 'Proposal two', 'Proposal three']).entries()) {
          const row = div('proposal-row', text);
          if (i === 0) row.classList.add('selected');
          popup.appendChild(row);
        }
        root.appendChild(popup);
      }
      return root;
    }
  },
  {
    objectType: 'ProposalField',
    label: 'Proposal field',
    category: 'Value fields',
    icon: 'search',
    description: 'Smart field that also accepts free text.',
    javaClass: 'org.eclipse.scout.rt.client.ui.form.fields.smartfield.AbstractProposalField',
    jsClass: 'ProposalField',
    isFormField: true,
    defaults: formFieldDefaults({label: 'Proposal field', displayText: ''}),
    props: formFieldProps(...valueProps),
    slots: [],
    render(ctx, node) {
      return inputField(ctx.prop<string>(node, 'displayText', ''), {
        placeholder: ctx.prop<string>(node, 'placeholder', ''),
        icon: 'angle-down',
        disabled: !ctx.prop<boolean>(node, 'enabled', true),
        extraClass: styleClass(ctx.prop<string>(node, 'fieldStyle', 'alternative'))
      });
    }
  },
  {
    objectType: 'TagField',
    label: 'Tag field',
    category: 'Value fields',
    icon: 'group',
    description: 'Free-text field that collects values as removable chips.',
    jsClass: 'TagField',
    isFormField: true,
    defaults: formFieldDefaults({label: 'Tag field', tags: 'scout\nmockup'}),
    props: formFieldProps({name: 'tags', label: 'Tags (one per line)', type: 'lines', group: GROUP_CONTENT}),
    slots: [],
    render(ctx, node) {
      const field = div('tag-field-box');
      for (const tag of lines(ctx.prop<string>(node, 'tags', ''), ['scout', 'mockup'])) {
        const chip = div('tag-element');
        chip.appendChild(span('tag-text', tag));
        chip.appendChild(span('tag-remove-icon'));
        field.appendChild(chip);
      }
      return field;
    }
  },
  {
    objectType: 'ColorField',
    label: 'Color field',
    category: 'Value fields',
    icon: 'pencil',
    description: 'Field for picking a color value.',
    jsClass: 'ColorField',
    isFormField: true,
    defaults: formFieldDefaults({label: 'Color field', value: '#1561A7'}),
    props: formFieldProps({name: 'value', label: 'Color', type: 'color', group: GROUP_CONTENT}),
    slots: [],
    render(ctx, node) {
      const color = ctx.prop<string>(node, 'value', '#1561A7');
      const wrapper = inputField(color, {extraClass: styleClass(ctx.prop<string>(node, 'fieldStyle', 'alternative'))});
      const swatch = span('color-swatch');
      swatch.style.backgroundColor = color;
      wrapper.insertBefore(swatch, wrapper.firstChild);
      wrapper.classList.add('color-field-container');
      return wrapper;
    }
  },
  {
    objectType: 'FileChooserField',
    label: 'File chooser field',
    category: 'Value fields',
    icon: 'folder',
    description: 'Field for selecting a file from the local file system.',
    javaClass: 'org.eclipse.scout.rt.client.ui.form.fields.filechooserfield.AbstractFileChooserField',
    jsClass: 'FileChooserField',
    isFormField: true,
    defaults: formFieldDefaults({label: 'File', displayText: ''}),
    props: formFieldProps(...valueProps),
    slots: [],
    render(ctx, node) {
      return inputField(ctx.prop<string>(node, 'displayText', ''), {
        placeholder: ctx.prop<string>(node, 'placeholder', 'No file selected'),
        icon: 'folder',
        extraClass: styleClass(ctx.prop<string>(node, 'fieldStyle', 'alternative'))
      });
    }
  },
  {
    objectType: 'ClipboardField',
    label: 'Clipboard field',
    category: 'Value fields',
    icon: 'file',
    description: 'Drop zone for pasting content from the clipboard.',
    jsClass: 'ClipboardField',
    isFormField: true,
    defaults: formFieldDefaults({label: 'Clipboard', 'gridDataHints.h': 3, displayText: 'Paste content here'}),
    props: formFieldProps(...valueProps),
    slots: [],
    defaultGridH: 3,
    render(ctx, node) {
      return div('clipboard-field-box', ctx.prop<string>(node, 'displayText', 'Paste content here'));
    }
  },
  {
    objectType: 'LabelField',
    label: 'Label field',
    category: 'Value fields',
    icon: 'file',
    description: 'Read-only text output.',
    javaClass: 'org.eclipse.scout.rt.client.ui.form.fields.labelfield.AbstractLabelField',
    jsClass: 'LabelField',
    isFormField: true,
    defaults: formFieldDefaults({label: 'Label field', displayText: 'Some read-only text', wrapText: false}),
    props: formFieldProps(
      {name: 'displayText', label: 'Text', type: 'text', group: GROUP_CONTENT},
      {name: 'wrapText', label: 'Wrap text', type: 'boolean', group: GROUP_CONTENT}
    ),
    slots: [],
    render(ctx, node) {
      const el = div('label-field-text', ctx.prop<string>(node, 'displayText', ''));
      if (ctx.prop<boolean>(node, 'wrapText', false)) el.classList.add('wrap');
      return el;
    }
  },
  {
    objectType: 'HtmlField',
    label: 'HTML field',
    category: 'Value fields',
    icon: 'world',
    description: 'Renders rich text / HTML content.',
    javaClass: 'org.eclipse.scout.rt.client.ui.form.fields.htmlfield.AbstractHtmlField',
    jsClass: 'HtmlField',
    isFormField: true,
    defaults: formFieldDefaults({label: 'HTML field', 'gridDataHints.h': 3, displayText: 'Rich text with a <b>bold</b> part and a link.'}),
    props: formFieldProps({name: 'displayText', label: 'Text', type: 'text', group: GROUP_CONTENT, description: 'Plain text; HTML tags are shown escaped so exports stay safe.'}),
    slots: [],
    defaultGridH: 3,
    render(ctx, node) {
      return div('html-field-box', ctx.prop<string>(node, 'displayText', ''));
    }
  },
  {
    objectType: 'BrowserField',
    label: 'Browser field',
    category: 'Value fields',
    icon: 'world',
    description: 'Embeds an external page in an iframe.',
    javaClass: 'org.eclipse.scout.rt.client.ui.form.fields.browserfield.AbstractBrowserField',
    jsClass: 'BrowserField',
    isFormField: true,
    defaults: formFieldDefaults({label: 'Browser field', 'gridDataHints.h': 5, location: 'https://eclipse.dev/scout/'}),
    props: formFieldProps({name: 'location', label: 'Location', type: 'string', group: GROUP_CONTENT}),
    slots: [],
    defaultGridH: 5,
    render(ctx, node) {
      const box = div('browser-field-box');
      box.appendChild(div('browser-field-url', ctx.prop<string>(node, 'location', '')));
      box.appendChild(div('browser-field-body', 'Embedded web content'));
      return box;
    }
  },
  {
    objectType: 'ImageField',
    label: 'Image field',
    category: 'Value fields',
    icon: 'file',
    description: 'Displays an image, optionally scrollable and zoomable.',
    javaClass: 'org.eclipse.scout.rt.client.ui.form.fields.imagefield.AbstractImageField',
    jsClass: 'ImageField',
    isFormField: true,
    defaults: formFieldDefaults({label: 'Image', 'gridDataHints.h': 4, imageUrl: '', autoFit: true}),
    props: formFieldProps(
      {name: 'imageUrl', label: 'Image URL or data URI', type: 'string', group: GROUP_CONTENT},
      {name: 'autoFit', label: 'Auto fit', type: 'boolean', group: GROUP_CONTENT}
    ),
    slots: [],
    defaultGridH: 4,
    render(ctx, node) {
      const box = div('image-field-box');
      const url = ctx.prop<string>(node, 'imageUrl', '');
      if (url) {
        const img = document.createElement('img');
        img.src = url;
        img.alt = ctx.prop<string>(node, 'label', 'Image');
        if (ctx.prop<boolean>(node, 'autoFit', true)) img.classList.add('auto-fit');
        box.appendChild(img);
      } else {
        box.classList.add('empty');
        const icon = renderIcon('file');
        if (icon) box.appendChild(icon);
        box.appendChild(span('image-field-hint', 'No image'));
      }
      return box;
    }
  },
  {
    objectType: 'SliderField',
    label: 'Slider field',
    category: 'Value fields',
    icon: 'long-arrow-up',
    description: 'Numeric value chosen with a slider.',
    jsClass: 'SliderField',
    isFormField: true,
    defaults: formFieldDefaults({label: 'Slider', value: 40, minValue: 0, maxValue: 100}),
    props: formFieldProps(
      {name: 'value', label: 'Value', type: 'number', group: GROUP_CONTENT},
      {name: 'minValue', label: 'Min value', type: 'number', group: GROUP_CONTENT},
      {name: 'maxValue', label: 'Max value', type: 'number', group: GROUP_CONTENT}
    ),
    slots: [],
    render(ctx, node) {
      const min = Number(ctx.prop<number>(node, 'minValue', 0));
      const max = Number(ctx.prop<number>(node, 'maxValue', 100));
      const value = Number(ctx.prop<number>(node, 'value', 40));
      const ratio = max > min ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0;
      const box = div('slider-box');
      const track = div('slider-track');
      const fill = div('slider-fill');
      fill.style.width = `${ratio * 100}%`;
      const thumb = div('slider-thumb');
      thumb.style.left = `${ratio * 100}%`;
      track.appendChild(fill);
      track.appendChild(thumb);
      box.appendChild(track);
      box.appendChild(span('slider-value', String(value)));
      return box;
    }
  },
  {
    objectType: 'BeanField',
    label: 'Bean field',
    category: 'Value fields',
    icon: 'file',
    description: 'Field whose content is rendered by custom HTML.',
    javaClass: 'org.eclipse.scout.rt.client.ui.form.fields.beanfield.AbstractBeanField',
    jsClass: 'BeanField',
    isFormField: true,
    defaults: formFieldDefaults({label: 'Bean field', 'gridDataHints.h': 3, displayText: 'Custom rendered content'}),
    props: formFieldProps({name: 'displayText', label: 'Content', type: 'text', group: GROUP_CONTENT}),
    slots: [],
    defaultGridH: 3,
    render(ctx, node) {
      return div('bean-field-box', ctx.prop<string>(node, 'displayText', ''));
    }
  }
];

registerWidgets(defs);
