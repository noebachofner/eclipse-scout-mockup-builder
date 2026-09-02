import type {PropDef} from './registry';
import type {PropertyValue} from '../types';

export const GROUP_GENERAL = 'General';
export const GROUP_LABEL = 'Label';
export const GROUP_STATE = 'State & Status';
export const GROUP_GRID = 'Logical grid';
export const GROUP_STYLE = 'Appearance';
export const GROUP_CONTENT = 'Content';
export const GROUP_LAYOUT = 'Layout';

export const LABEL_POSITION_OPTIONS = [
  {value: 0, label: 'DEFAULT (left)'},
  {value: 1, label: 'LEFT'},
  {value: 2, label: 'ON_FIELD (placeholder)'},
  {value: 3, label: 'RIGHT'},
  {value: 4, label: 'TOP'},
  {value: 5, label: 'BOTTOM'}
];

export const SEVERITY_OPTIONS = [
  {value: 'none', label: 'none'},
  {value: 'ok', label: 'OK'},
  {value: 'info', label: 'INFO'},
  {value: 'warning', label: 'WARNING'},
  {value: 'error', label: 'ERROR'}
];

export const ALIGNMENT_OPTIONS = [
  {value: -1, label: 'LEFT / TOP (-1)'},
  {value: 0, label: 'CENTER (0)'},
  {value: 1, label: 'RIGHT / BOTTOM (1)'}
];

export const FIELD_STYLE_OPTIONS = [
  {value: 'alternative', label: 'ALTERNATIVE (underlined)'},
  {value: 'classic', label: 'CLASSIC (bordered)'}
];

export const WIDGET_PROPS: PropDef[] = [
  {name: 'id', label: 'Field id', type: 'string', group: GROUP_GENERAL, placeholder: 'MyField', description: 'Identifier used in generated Scout code. Purely informational in the mockup.'},
  {name: 'visible', label: 'Visible', type: 'boolean', group: GROUP_STATE},
  {name: 'enabled', label: 'Enabled', type: 'boolean', group: GROUP_STATE},
  {name: 'cssClass', label: 'CSS class', type: 'string', group: GROUP_STYLE, placeholder: 'my-custom-class'}
];

export const FORM_FIELD_PROPS: PropDef[] = [
  {name: 'label', label: 'Label', type: 'string', group: GROUP_LABEL},
  {name: 'labelVisible', label: 'Label visible', type: 'boolean', group: GROUP_LABEL},
  {name: 'labelPosition', label: 'Label position', type: 'enum', group: GROUP_LABEL, options: LABEL_POSITION_OPTIONS},
  {name: 'labelWidthInPixel', label: 'Label width (px)', type: 'number', group: GROUP_LABEL, min: -1, description: '0 = Scout default (140px), -1 = use UI width.'},
  {name: 'labelHtmlEnabled', label: 'Label HTML enabled', type: 'boolean', group: GROUP_LABEL},
  {name: 'mandatory', label: 'Mandatory', type: 'boolean', group: GROUP_STATE},
  {name: 'loading', label: 'Loading', type: 'boolean', group: GROUP_STATE, description: 'Shows the loading indicator instead of the field content.'},
  {name: 'tooltipText', label: 'Tooltip', type: 'text', group: GROUP_STATE},
  {name: 'tooltipAnchor', label: 'Tooltip anchor', type: 'enum', group: GROUP_STATE, options: [
    {value: 'default', label: 'DEFAULT'},
    {value: 'onField', label: 'ON_FIELD'}
  ]},
  {name: 'errorStatus', label: 'Status severity', type: 'enum', group: GROUP_STATE, options: SEVERITY_OPTIONS},
  {name: 'errorStatusMessage', label: 'Status message', type: 'string', group: GROUP_STATE, visibleWhen: p => p.errorStatus !== 'none' && p.errorStatus !== undefined},
  {
    name: 'statusTooltipVisible',
    label: 'Show status tooltip',
    type: 'boolean',
    group: GROUP_STATE,
    description: 'Scout shows the message in a tooltip when the status icon is clicked. Turn this on to capture that state in the mockup.'
  },
  {name: 'statusVisible', label: 'Status visible', type: 'boolean', group: GROUP_STATE},
  {name: 'statusPosition', label: 'Status position', type: 'enum', group: GROUP_STATE, options: [
    {value: 'default', label: 'DEFAULT'},
    {value: 'top', label: 'TOP'}
  ]},
  {name: 'disabledStyle', label: 'Disabled style', type: 'enum', group: GROUP_STATE, options: [
    {value: 0, label: 'DEFAULT'},
    {value: 1, label: 'READ_ONLY'}
  ], visibleWhen: p => p.enabled === false},
  {name: 'fieldStyle', label: 'Field style', type: 'enum', group: GROUP_STYLE, options: FIELD_STYLE_OPTIONS, description: "Scout's FormField.fieldStyle. ALTERNATIVE draws only an underline and is the framework default."},
  {name: 'fontColor', label: 'Font color', type: 'color', group: GROUP_STYLE},
  {name: 'backgroundColor', label: 'Background color', type: 'color', group: GROUP_STYLE},
  {name: 'fontBold', label: 'Bold', type: 'boolean', group: GROUP_STYLE}
];

export const GRID_PROPS: PropDef[] = [
  {name: 'gridDataHints.w', label: 'Grid width (w)', type: 'number', group: GROUP_GRID, min: 1, max: 12, description: 'How many logical grid columns the field spans.'},
  {name: 'gridDataHints.h', label: 'Grid height (h)', type: 'number', group: GROUP_GRID, min: 1, max: 20, description: 'How many logical grid rows the field spans.'},
  {name: 'gridDataHints.weightX', label: 'Weight X', type: 'number', group: GROUP_GRID, min: -1, step: 0.1, description: '-1 lets Scout compute the weight (w > 1 grows, w = 1 does not).'},
  {name: 'gridDataHints.weightY', label: 'Weight Y', type: 'number', group: GROUP_GRID, min: -1, step: 0.1, description: '-1 lets Scout compute the weight; > 0 makes the row absorb extra height.'},
  {name: 'gridDataHints.fillHorizontal', label: 'Fill horizontal', type: 'boolean', group: GROUP_GRID},
  {name: 'gridDataHints.fillVertical', label: 'Fill vertical', type: 'boolean', group: GROUP_GRID},
  {name: 'gridDataHints.useUiWidth', label: 'Use UI width', type: 'boolean', group: GROUP_GRID},
  {name: 'gridDataHints.useUiHeight', label: 'Use UI height', type: 'boolean', group: GROUP_GRID},
  {name: 'gridDataHints.horizontalAlignment', label: 'Horizontal alignment', type: 'enum', group: GROUP_GRID, options: ALIGNMENT_OPTIONS},
  {name: 'gridDataHints.verticalAlignment', label: 'Vertical alignment', type: 'enum', group: GROUP_GRID, options: ALIGNMENT_OPTIONS}
];

export const FORM_FIELD_DEFAULTS: Record<string, PropertyValue> = {
  visible: true,
  enabled: true,
  labelVisible: true,
  labelPosition: 0,
  labelWidthInPixel: 0,
  mandatory: false,
  statusVisible: true,
  statusPosition: 'default',
  tooltipAnchor: 'default',
  errorStatus: 'none',
  statusTooltipVisible: false,
  fieldStyle: 'alternative',
  loading: false,
  'gridDataHints.w': 1,
  'gridDataHints.h': 1,
  'gridDataHints.weightX': -1,
  'gridDataHints.weightY': -1,
  'gridDataHints.fillHorizontal': true,
  'gridDataHints.fillVertical': true,
  'gridDataHints.useUiWidth': false,
  'gridDataHints.useUiHeight': false,
  'gridDataHints.horizontalAlignment': -1,
  'gridDataHints.verticalAlignment': -1
};

export const WIDGET_DEFAULTS: Record<string, PropertyValue> = {
  visible: true,
  enabled: true
};

export function formFieldProps(...extra: PropDef[]): PropDef[] {
  return [...WIDGET_PROPS, ...FORM_FIELD_PROPS, ...extra, ...GRID_PROPS];
}

export function formFieldDefaults(extra: Record<string, PropertyValue> = {}): Record<string, PropertyValue> {
  return {...FORM_FIELD_DEFAULTS, ...extra};
}

export const CLEARABLE_OPTIONS = [
  {value: 'focused', label: 'FOCUSED (default)'},
  {value: 'always', label: 'ALWAYS'},
  {value: 'never', label: 'NEVER'}
];

export const RESPONSIVE_OPTIONS = [
  {value: 'inherit', label: 'null (inherit)'},
  {value: 'true', label: 'true'},
  {value: 'false', label: 'false'}
];

export const GROUP_BOX_PROPS: PropDef[] = [
  {name: 'subLabel', label: 'Sub label', type: 'string', group: GROUP_LABEL},
  {name: 'menuBarVisible', label: 'Menu bar visible', type: 'boolean', group: GROUP_LAYOUT},
  {
    name: 'responsive',
    label: 'Responsive',
    type: 'enum',
    group: GROUP_LAYOUT,
    options: RESPONSIVE_OPTIONS,
    description: 'Scout moves the labels on top once the box is narrower than it would like to be. `null` inherits the setting from the parent.'
  }
];
