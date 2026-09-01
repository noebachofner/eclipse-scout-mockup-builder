import type {PropDef} from './registry';
import type {PropertyValue} from '../types';

export const GROUP_GENERAL = 'General';
export const GROUP_LABEL = 'Label';
export const GROUP_STATE = 'State & Status';
export const GROUP_GRID = 'Logical grid';
export const GROUP_STYLE = 'Appearance';
export const GROUP_CONTENT = 'Content';
export const GROUP_LAYOUT = 'Layout';

/** Scout `FormField.LabelPosition`. */
export const LABEL_POSITION_OPTIONS = [
  {value: 0, label: 'DEFAULT (left)'},
  {value: 1, label: 'LEFT'},
  {value: 2, label: 'ON_FIELD (placeholder)'},
  {value: 3, label: 'RIGHT'},
  {value: 4, label: 'TOP'},
  {value: 5, label: 'BOTTOM'}
];

/** Scout `Status.Severity`. */
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
  {value: 'classic', label: 'CLASSIC (bordered)'},
  {value: 'alternative', label: 'ALTERNATIVE (underlined)'}
];

/** Properties every Scout widget has. */
export const WIDGET_PROPS: PropDef[] = [
  {name: 'id', label: 'Field id', type: 'string', group: GROUP_GENERAL, placeholder: 'MyField', description: 'Identifier used in generated Scout code. Purely informational in the mockup.'},
  {name: 'visible', label: 'Visible', type: 'boolean', group: GROUP_STATE},
  {name: 'enabled', label: 'Enabled', type: 'boolean', group: GROUP_STATE},
  {name: 'cssClass', label: 'CSS class', type: 'string', group: GROUP_STYLE, placeholder: 'my-custom-class'}
];

/** Properties shared by everything deriving from Scout's `FormField`. */
export const FORM_FIELD_PROPS: PropDef[] = [
  {name: 'label', label: 'Label', type: 'string', group: GROUP_LABEL},
  {name: 'subLabel', label: 'Sub label', type: 'string', group: GROUP_LABEL},
  {name: 'labelVisible', label: 'Label visible', type: 'boolean', group: GROUP_LABEL},
  {name: 'labelPosition', label: 'Label position', type: 'enum', group: GROUP_LABEL, options: LABEL_POSITION_OPTIONS},
  {name: 'labelWidthInPixel', label: 'Label width (px)', type: 'number', group: GROUP_LABEL, min: -1, description: '0 = Scout default (140px), -1 = use UI width.'},
  {name: 'mandatory', label: 'Mandatory', type: 'boolean', group: GROUP_STATE},
  {name: 'tooltipText', label: 'Tooltip', type: 'text', group: GROUP_STATE},
  {name: 'errorStatus', label: 'Status severity', type: 'enum', group: GROUP_STATE, options: SEVERITY_OPTIONS},
  {name: 'errorStatusMessage', label: 'Status message', type: 'string', group: GROUP_STATE, visibleWhen: p => p.errorStatus !== 'none' && p.errorStatus !== undefined},
  {name: 'statusVisible', label: 'Status visible', type: 'boolean', group: GROUP_STATE},
  {name: 'fontColor', label: 'Font color', type: 'color', group: GROUP_STYLE},
  {name: 'backgroundColor', label: 'Background color', type: 'color', group: GROUP_STYLE},
  {name: 'fontBold', label: 'Bold', type: 'boolean', group: GROUP_STYLE}
];

/** Scout `GridData` hints, exposed one property per hint. */
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
  errorStatus: 'none',
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

/** Convenience: the full property list of a standard form field. */
export function formFieldProps(...extra: PropDef[]): PropDef[] {
  return [...WIDGET_PROPS, ...FORM_FIELD_PROPS, ...extra, ...GRID_PROPS];
}

export function formFieldDefaults(extra: Record<string, PropertyValue> = {}): Record<string, PropertyValue> {
  return {...FORM_FIELD_DEFAULTS, ...extra};
}
