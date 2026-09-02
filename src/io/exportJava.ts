/**
 * Scout Java code generation for a single form.
 *
 * The output is deliberately narrow: one `AbstractForm` subclass with its
 * nested field classes, ready to be pasted into an existing Scout project.
 * No form data, no service, no outline, no desktop - those belong to the
 * application around the form and are not something a mockup can know.
 *
 * Every `getConfigured*` name below was checked against the Scout 26.1 sources
 * (`org.eclipse.scout.rt.client`). Two findings worth remembering:
 *   - there is no `AbstractTabItem`; a tab inside an `AbstractTabBox` is an
 *     ordinary `AbstractGroupBox`,
 *   - `getConfiguredDisplayHint()` returns `int` (IForm.DISPLAY_HINT_*), and
 *     modality is a separate `getConfiguredModalityHint()`.
 */
import type {MockupNode, PropertyValue} from '../model/types';
import {getWidget} from '../model/catalog';

/**
 * How much of the configuration ends up in the generated file.
 *
 * `changed` writes only what differs from the Scout default, which is what a
 * hand written form looks like. `layout` adds the logical grid of every field
 * even where it is still the default, so the layout is visible in the code
 * rather than implied. `all` writes every property the generator can map.
 */
export type PropertyDetail = 'changed' | 'layout' | 'all';

export interface JavaExportOptions {
  /** How much configuration to write out. Defaults to `layout` in the dialog. */
  detail: PropertyDetail;
  /** Java package the class is placed in. Empty writes no package statement. */
  packageName: string;
  /** Class name of the generated form, e.g. `PersonForm`. */
  className: string;
  /** Wrap every user visible text in `TEXTS.get("...")` instead of a literal. */
  useTexts: boolean;
  /** Emit `getXyzField()` accessors on the form, the way the Scout SDK does. */
  includeGetters: boolean;
}

export interface JavaExportResult {
  code: string;
  /** Things the mockup expresses that Java cannot, or that need a decision. */
  warnings: string[];
}

interface JavaWidget {
  /** Simple name of the Scout base class. */
  base: string;
  /** Fully qualified name, for the import block. */
  fqn: string;
  /** Type arguments appended to the base class, if it is generic. */
  typeArgs?: string;
  /** Suffix appended to the generated class name. */
  suffix: string;
  /** Extra imports this widget always needs. */
  imports?: string[];
  /** Emitted as a `// TODO` comment above the class. */
  note?: string;
}

const FIELDS = 'org.eclipse.scout.rt.client.ui.form.fields';

const JAVA_WIDGETS: Record<string, JavaWidget> = {
  // --- containers -----------------------------------------------------------
  GroupBox: {base: 'AbstractGroupBox', fqn: `${FIELDS}.groupbox.AbstractGroupBox`, suffix: 'Box'},
  TabBox: {base: 'AbstractTabBox', fqn: `${FIELDS}.tabbox.AbstractTabBox`, suffix: 'Box'},
  // Scout has no AbstractTabItem - a tab is a group box inside the tab box.
  TabItem: {base: 'AbstractGroupBox', fqn: `${FIELDS}.groupbox.AbstractGroupBox`, suffix: 'Box'},
  SequenceBox: {base: 'AbstractSequenceBox', fqn: `${FIELDS}.sequencebox.AbstractSequenceBox`, suffix: 'Box'},
  SplitBox: {base: 'AbstractSplitBox', fqn: `${FIELDS}.splitbox.AbstractSplitBox`, suffix: 'Box'},
  PlaceholderField: {base: 'AbstractPlaceholderField', fqn: `${FIELDS}.placeholder.AbstractPlaceholderField`, suffix: 'Field'},
  WrappedFormField: {
    base: 'AbstractWrappedFormField',
    fqn: `${FIELDS}.wrappedform.AbstractWrappedFormField`,
    typeArgs: '<IForm>',
    imports: ['org.eclipse.scout.rt.client.ui.form.IForm'],
    suffix: 'Field',
    note: 'Replace IForm with the concrete inner form class.'
  },

  // --- value fields ---------------------------------------------------------
  StringField: {base: 'AbstractStringField', fqn: `${FIELDS}.stringfield.AbstractStringField`, suffix: 'Field'},
  // Scout's AbstractNumberField is generic and abstract; the concrete decimal
  // field an application uses is AbstractBigDecimalField.
  NumberField: {base: 'AbstractBigDecimalField', fqn: `${FIELDS}.bigdecimalfield.AbstractBigDecimalField`, suffix: 'Field'},
  IntegerField: {base: 'AbstractIntegerField', fqn: `${FIELDS}.integerfield.AbstractIntegerField`, suffix: 'Field'},
  DateField: {base: 'AbstractDateField', fqn: `${FIELDS}.datefield.AbstractDateField`, suffix: 'Field'},
  SmartField: {
    base: 'AbstractSmartField', fqn: `${FIELDS}.smartfield.AbstractSmartField`, typeArgs: '<String>', suffix: 'Field',
    note: 'Set the value type and a lookup call or code type.'
  },
  ProposalField: {
    base: 'AbstractProposalField', fqn: `${FIELDS}.smartfield.AbstractProposalField`, typeArgs: '<String>', suffix: 'Field',
    note: 'Set the value type and a lookup call or code type.'
  },
  TagField: {base: 'AbstractTagField', fqn: `${FIELDS}.tagfield.AbstractTagField`, suffix: 'Field'},
  ColorField: {base: 'AbstractColorField', fqn: `${FIELDS}.colorfield.AbstractColorField`, suffix: 'Field'},
  FileChooserField: {base: 'AbstractFileChooserField', fqn: `${FIELDS}.filechooserfield.AbstractFileChooserField`, suffix: 'Field'},
  ClipboardField: {base: 'AbstractClipboardField', fqn: `${FIELDS}.clipboardfield.AbstractClipboardField`, suffix: 'Field'},
  LabelField: {base: 'AbstractLabelField', fqn: `${FIELDS}.labelfield.AbstractLabelField`, suffix: 'Field'},
  HtmlField: {base: 'AbstractHtmlField', fqn: `${FIELDS}.htmlfield.AbstractHtmlField`, suffix: 'Field'},
  BrowserField: {base: 'AbstractBrowserField', fqn: `${FIELDS}.browserfield.AbstractBrowserField`, suffix: 'Field'},
  ImageField: {base: 'AbstractImageField', fqn: `${FIELDS}.imagefield.AbstractImageField`, suffix: 'Field'},
  BeanField: {
    base: 'AbstractBeanField', fqn: `${FIELDS}.beanfield.AbstractBeanField`, typeArgs: '<Object>', suffix: 'Field',
    note: 'Replace Object with the bean type this field displays.'
  },

  // --- selection fields -----------------------------------------------------
  CheckBoxField: {base: 'AbstractBooleanField', fqn: `${FIELDS}.booleanfield.AbstractBooleanField`, suffix: 'Field'},
  RadioButtonGroup: {
    base: 'AbstractRadioButtonGroup', fqn: `${FIELDS}.radiobuttongroup.AbstractRadioButtonGroup`, typeArgs: '<String>', suffix: 'Field',
    note: 'Add an AbstractRadioButton inner class per option.'
  },
  ListBox: {
    base: 'AbstractListBox', fqn: `${FIELDS}.listbox.AbstractListBox`, typeArgs: '<String>', suffix: 'Field',
    note: 'Set the key type and a lookup call or code type.'
  },
  TreeBox: {
    base: 'AbstractTreeBox', fqn: `${FIELDS}.treebox.AbstractTreeBox`, typeArgs: '<String>', suffix: 'Field',
    note: 'Set the key type and a lookup call or code type.'
  },
  ModeSelectorField: {
    base: 'AbstractModeSelectorField', fqn: `${FIELDS}.modeselector.AbstractModeSelectorField`, typeArgs: '<String>', suffix: 'Field',
    note: 'Add an AbstractMode inner class per mode.'
  },

  // --- tables and trees -----------------------------------------------------
  TableField: {base: 'AbstractTableField', fqn: `${FIELDS}.tablefield.AbstractTableField`, suffix: 'Field'},
  TreeField: {base: 'AbstractTreeField', fqn: `${FIELDS}.treefield.AbstractTreeField`, suffix: 'Field'},
  CalendarField: {
    base: 'AbstractCalendarField', fqn: `${FIELDS}.calendarfield.AbstractCalendarField`, typeArgs: '<ICalendar>', suffix: 'Field',
    imports: ['org.eclipse.scout.rt.client.ui.basic.calendar.ICalendar'],
    note: 'Add a nested AbstractCalendar and use it as the type argument.'
  },

  // --- buttons and menus ----------------------------------------------------
  Button: {base: 'AbstractButton', fqn: `${FIELDS}.button.AbstractButton`, suffix: 'Button'},
  Menu: {base: 'AbstractMenu', fqn: 'org.eclipse.scout.rt.client.ui.action.menu.AbstractMenu', suffix: 'Menu'},

  // --- advanced -------------------------------------------------------------
  WizardProgressField: {base: 'AbstractWizardProgressField', fqn: `${FIELDS}.wizard.AbstractWizardProgressField`, suffix: 'Field'},
  BreadcrumbBarField: {base: 'AbstractBreadcrumbBarField', fqn: `${FIELDS}.breadcrumbbarfield.AbstractBreadcrumbBarField`, suffix: 'Field'},
  TileField: {
    base: 'AbstractTileField', fqn: `${FIELDS}.tilefield.AbstractTileField`, typeArgs: '<ITileGrid<ITile>>', suffix: 'Field',
    imports: ['org.eclipse.scout.rt.client.ui.tile.ITileGrid', 'org.eclipse.scout.rt.client.ui.tile.ITile'],
    note: 'Add a nested AbstractTileGrid and use it as the type argument.'
  },
  Accordion: {
    base: 'AbstractAccordionField', fqn: `${FIELDS}.accordionfield.AbstractAccordionField`, typeArgs: '<IAccordion>', suffix: 'Field',
    imports: ['org.eclipse.scout.rt.client.ui.accordion.IAccordion'],
    note: 'Add a nested AbstractAccordion and use it as the type argument.'
  }
};

/**
 * Widgets a form cannot contain as a plain inner class. Either scout.rt has no
 * Java class for them at all, or the class lives in a module a project has to
 * add on purpose - `AbstractChartField` for instance is in `scout.rt.chart`,
 * not in `scout.rt.client`. Each one becomes a TODO comment plus a warning.
 */
const JS_ONLY = new Map<string, string>([
  ['SliderField', 'scout.rt has no Java slider field; it exists in the JS layer only.'],
  ['SwitchField', 'the Java counterpart is AbstractToggleSwitch, which is not a form field.'],
  ['ChartField', 'AbstractChartField lives in the separate scout.rt.chart module.'],
  ['HeatmapField', 'the heatmap field is part of the Scout widgets demo, not of scout.rt.'],
  ['PlannerField', 'AbstractPlannerField needs three type arguments; add it by hand.'],
  ['Tile', 'tiles belong into a tile grid, not directly into a form.'],
  ['FormFieldTile', 'tiles belong into a tile grid, not directly into a form.'],
  ['TileAccordion', 'model this as an AbstractAccordionField with a nested accordion.'],
  ['Group', 'AbstractGroup belongs into an accordion, not directly into a form.'],
  ['Carousel', 'scout.rt has no Java carousel; it exists in the JS layer only.'],
  ['Notification', 'notifications are added at runtime, not declared in a form.'],
  ['Popup', 'popups are opened at runtime, not declared in a form.'],
  ['Tooltip', 'use getConfiguredTooltipText() on the field instead.'],
  ['MessageBox', 'message boxes are opened at runtime, not declared in a form.'],
  ['FileChooserButton', 'model this as an AbstractFileChooserField.']
]);

const PLATFORM_ORDER = 'org.eclipse.scout.rt.platform.Order';
const TEXTS_IMPORT = 'org.eclipse.scout.rt.platform.text.TEXTS';
const I_FORM_FIELD = `${FIELDS}.IFormField`;

/* -------------------------------------------------------------- properties */

interface Emitter {
  /** Java method name without parentheses. */
  method: string;
  /** Java return type. */
  returns: string;
  /** Renders the value as a Java expression. Returning null skips the override. */
  express(value: PropertyValue, ctx: EmitContext): string | null;
  imports?: string[];
  /** Restricts the mapping to these object types. */
  only?: string[];
}

interface EmitContext {
  options: JavaExportOptions;
  imports: Set<string>;
  warnings: string[];
  /**
   * Every class name used so far in this form. Scout resolves fields with
   * `getFieldByClass`, which takes the class itself, so two fields sharing a
   * simple name would produce two identical getters and fail to compile - even
   * though Java would allow the inner classes themselves.
   */
  names: Set<string>;
}

function javaString(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '')}"`;
}

/** `First name` -> `FirstName`, so a TEXTS key looks like a hand written one. */
function textsKey(label: string): string {
  const key = label.replace(/[^a-zA-Z0-9 ]/g, ' ').split(/\s+/).filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
  return key || 'Text';
}

function text(value: PropertyValue, ctx: EmitContext): string | null {
  const value_ = String(value ?? '');
  if (!value_) return null;
  if (!ctx.options.useTexts) return javaString(value_);
  ctx.imports.add(TEXTS_IMPORT);
  return `TEXTS.get(${javaString(textsKey(value_))})`;
}

const bool = (value: PropertyValue): string => (value ? 'true' : 'false');
const int = (value: PropertyValue): string => String(Math.round(Number(value)));

/** `1` -> `1.0`, because a Java double literal needs the decimal point. */
function double(value: PropertyValue): string {
  const number = Number(value);
  return Number.isInteger(number) ? `${number}.0` : String(number);
}

const LABEL_POSITION_CONSTANTS = ['LABEL_POSITION_DEFAULT', 'LABEL_POSITION_LEFT', 'LABEL_POSITION_ON_FIELD', 'LABEL_POSITION_RIGHT', 'LABEL_POSITION_TOP', 'LABEL_POSITION_BOTTOM'];

const EMITTERS: Record<string, Emitter> = {
  // --- widget ---------------------------------------------------------------
  visible: {method: 'getConfiguredVisible', returns: 'boolean', express: bool},
  enabled: {method: 'getConfiguredEnabled', returns: 'boolean', express: bool},
  cssClass: {method: 'getConfiguredCssClass', returns: 'String', express: v => (v ? javaString(String(v)) : null)},

  // --- form field -----------------------------------------------------------
  label: {method: 'getConfiguredLabel', returns: 'String', express: text},
  labelVisible: {method: 'getConfiguredLabelVisible', returns: 'boolean', express: bool},
  labelHtmlEnabled: {method: 'getConfiguredLabelHtmlEnabled', returns: 'boolean', express: bool},
  labelWidthInPixel: {method: 'getConfiguredLabelWidthInPixel', returns: 'int', express: int},
  labelPosition: {
    method: 'getConfiguredLabelPosition',
    // IFormField declares this as a byte, so the literal needs a cast.
    returns: 'byte',
    imports: [I_FORM_FIELD],
    express: value => {
      const index = Number(value);
      const constant = LABEL_POSITION_CONSTANTS[index];
      return constant ? `IFormField.${constant}` : null;
    }
  },
  mandatory: {method: 'getConfiguredMandatory', returns: 'boolean', express: bool},
  tooltipText: {method: 'getConfiguredTooltipText', returns: 'String', express: text},
  tooltipAnchor: {
    method: 'getConfiguredTooltipAnchor', returns: 'String', imports: [I_FORM_FIELD],
    express: value => (value === 'onField' ? 'IFormField.TOOLTIP_ANCHOR_ON_FIELD' : null)
  },
  statusVisible: {method: 'getConfiguredStatusVisible', returns: 'boolean', express: bool},
  statusPosition: {
    method: 'getConfiguredStatusPosition', returns: 'String', imports: [I_FORM_FIELD],
    express: value => (value === 'top' ? 'IFormField.STATUS_POSITION_TOP' : null)
  },
  fieldStyle: {
    method: 'getConfiguredFieldStyle', returns: 'String', imports: [I_FORM_FIELD],
    express: value => (value === 'classic' ? 'IFormField.FIELD_STYLE_CLASSIC' : 'IFormField.FIELD_STYLE_ALTERNATIVE')
  },
  disabledStyle: {
    method: 'getConfiguredDisabledStyle', returns: 'int', imports: [I_FORM_FIELD],
    express: value => (Number(value) === 1 ? 'IFormField.DISABLED_STYLE_READ_ONLY' : null)
  },
  fontColor: {method: 'getConfiguredForegroundColor', returns: 'String', express: v => (v ? javaString(String(v).replace('#', '')) : null)},
  backgroundColor: {method: 'getConfiguredBackgroundColor', returns: 'String', express: v => (v ? javaString(String(v).replace('#', '')) : null)},

  // --- logical grid ---------------------------------------------------------
  'gridDataHints.w': {method: 'getConfiguredGridW', returns: 'int', express: int},
  'gridDataHints.h': {method: 'getConfiguredGridH', returns: 'int', express: int},
  'gridDataHints.weightX': {method: 'getConfiguredGridWeightX', returns: 'double', express: double},
  'gridDataHints.weightY': {method: 'getConfiguredGridWeightY', returns: 'double', express: double},
  'gridDataHints.useUiWidth': {method: 'getConfiguredGridUseUiWidth', returns: 'boolean', express: bool},
  'gridDataHints.useUiHeight': {method: 'getConfiguredGridUseUiHeight', returns: 'boolean', express: bool},
  'gridDataHints.fillHorizontal': {method: 'getConfiguredFillHorizontal', returns: 'boolean', express: bool},
  'gridDataHints.fillVertical': {method: 'getConfiguredFillVertical', returns: 'boolean', express: bool},
  'gridDataHints.horizontalAlignment': {method: 'getConfiguredHorizontalAlignment', returns: 'int', express: int},
  'gridDataHints.verticalAlignment': {method: 'getConfiguredVerticalAlignment', returns: 'int', express: int},

  // --- group box family -----------------------------------------------------
  subLabel: {method: 'getConfiguredSubLabel', returns: 'String', express: text},
  gridColumnCount: {method: 'getConfiguredGridColumnCount', returns: 'int', express: int},
  borderVisible: {method: 'getConfiguredBorderVisible', returns: 'boolean', express: bool},
  borderDecoration: {method: 'getConfiguredBorderDecoration', returns: 'String', express: v => (v ? javaString(String(v)) : null)},
  expandable: {method: 'getConfiguredExpandable', returns: 'boolean', express: bool},
  expanded: {method: 'getConfiguredExpanded', returns: 'boolean', express: bool, only: ['GroupBox']},
  menuBarVisible: {method: 'getConfiguredMenuBarVisible', returns: 'boolean', express: bool},
  menuBarPosition: {method: 'getConfiguredMenuBarPosition', returns: 'String', express: v => (v ? javaString(String(v)) : null)},
  responsive: {
    // TriState, not boolean: `inherit` is Scout's UNDEFINED.
    method: 'getConfiguredResponsive', returns: 'TriState',
    imports: ['org.eclipse.scout.rt.platform.util.TriState'],
    express: value => {
      if (value === 'true') return 'TriState.TRUE';
      if (value === 'false') return 'TriState.FALSE';
      return null;
    }
  },
  scrollable: {
    method: 'getConfiguredScrollable', returns: 'TriState',
    imports: ['org.eclipse.scout.rt.platform.util.TriState'],
    express: value => (value ? 'TriState.TRUE' : 'TriState.FALSE'),
    only: ['GroupBox']
  },

  // --- string / number / date ----------------------------------------------
  maxLength: {method: 'getConfiguredMaxLength', returns: 'int', express: int},
  multilineText: {method: 'getConfiguredMultilineText', returns: 'boolean', express: bool},
  inputMasked: {method: 'getConfiguredInputMasked', returns: 'boolean', express: bool},
  trimText: {method: 'getConfiguredTrimText', returns: 'boolean', express: bool},
  wrapText: {method: 'getConfiguredWrapText', returns: 'boolean', express: bool},
  format: {method: 'getConfiguredFormat', returns: 'String', express: v => (v ? javaString(String(v)) : null)},
  hasDate: {method: 'getConfiguredHasDate', returns: 'boolean', express: bool},
  hasTime: {method: 'getConfiguredHasTime', returns: 'boolean', express: bool},
  triStateEnabled: {method: 'getConfiguredTriStateEnabled', returns: 'boolean', express: bool},
  clearable: {
    method: 'getConfiguredClearable', returns: 'String',
    imports: [`${FIELDS}.IValueField`],
    express: value => {
      if (value === 'always') return 'IValueField.CLEARABLE_ALWAYS';
      if (value === 'never') return 'IValueField.CLEARABLE_NEVER';
      return null;
    }
  },
  searchRequired: {method: 'getConfiguredSearchRequired', returns: 'boolean', express: bool},
  activeFilterEnabled: {method: 'getConfiguredActiveFilterEnabled', returns: 'boolean', express: bool},
  browseAutoExpandAll: {method: 'getConfiguredBrowseAutoExpandAll', returns: 'boolean', express: bool},
  browseMaxRowCount: {method: 'getConfiguredBrowseMaxRowCount', returns: 'int', express: int},

  // --- image ----------------------------------------------------------------
  imageUrl: {
    method: 'getConfiguredImageUrl', returns: 'String', only: ['ImageField'],
    express: value => (value && !String(value).startsWith('data:') ? javaString(String(value)) : null)
  },
  autoFit: {method: 'getConfiguredAutoFit', returns: 'boolean', express: bool, only: ['ImageField']},

  // --- split box ------------------------------------------------------------
  splitHorizontal: {method: 'getConfiguredSplitHorizontal', returns: 'boolean', express: bool},
  splitterPosition: {method: 'getConfiguredSplitterPosition', returns: 'double', express: double},
  splitterEnabled: {method: 'getConfiguredSplitterEnabled', returns: 'boolean', express: bool},

  // --- buttons and menus ----------------------------------------------------
  text: {method: 'getConfiguredText', returns: 'String', express: text, only: ['Menu']},
  iconId: {method: 'getConfiguredIconId', returns: 'String', express: v => (v ? javaString(String(v)) : null)},
  keyStroke: {method: 'getConfiguredKeyStroke', returns: 'String', express: v => (v ? javaString(String(v)) : null)},
  separator: {method: 'getConfiguredSeparator', returns: 'boolean', express: bool, only: ['Menu']},
  toggleAction: {method: 'getConfiguredToggleAction', returns: 'boolean', express: bool, only: ['Menu']},
  defaultButton: {method: 'getConfiguredDefaultButton', returns: 'Boolean', express: bool, only: ['Button']},

  // --- table ----------------------------------------------------------------
  checkable: {method: 'getConfiguredCheckable', returns: 'boolean', express: bool},
  multiCheck: {method: 'getConfiguredMultiCheck', returns: 'boolean', express: bool},
  multiSelect: {method: 'getConfiguredMultiSelect', returns: 'boolean', express: bool},
  headerVisible: {method: 'getConfiguredHeaderVisible', returns: 'boolean', express: bool},
  headerEnabled: {method: 'getConfiguredHeaderEnabled', returns: 'boolean', express: bool},
  compact: {method: 'getConfiguredCompact', returns: 'boolean', express: bool},
  autoResizeColumns: {method: 'getConfiguredAutoResizeColumns', returns: 'boolean', express: bool}
};

/* ---------------------------------------------------------------- emitting */

/** Turns a label into a Java class name: `Order no.` -> `OrderNo`. */
function pascal(value: string): string {
  const parts = value.replace(/[^a-zA-Z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  const name = parts.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
  // A Java identifier may not start with a digit.
  return /^[0-9]/.test(name) ? `F${name}` : name;
}

/** `BillingBox` -> `Billing`, so it can be used as a qualifier. */
function stemOf(className: string, suffix: string): string {
  return className.endsWith(suffix) ? className.slice(0, -suffix.length) : className;
}

function uniqueName(base: string, used: Set<string>): string {
  let name = base;
  let counter = 2;
  while (used.has(name)) name = `${base}${counter++}`;
  used.add(name);
  return name;
}

/**
 * Class name for a node: the explicit field id wins, otherwise the label.
 *
 * On a collision the enclosing box's name is prepended before falling back to
 * numbering, so two "Name" fields become `BillingNameField` and
 * `ShippingNameField` rather than `NameField` and `NameField2`.
 */
function classNameFor(node: MockupNode, widget: JavaWidget, used: Set<string>, parentStem = ''): string {
  const id = String(node.properties.id ?? '').trim();
  if (id) return uniqueName(pascal(id), used);
  const label = String(node.properties.label ?? node.properties.text ?? '').trim();
  const stem = pascal(label) || node.objectType.replace(/Field$|Box$/, '');
  const base = stem.endsWith(widget.suffix) ? stem : stem + widget.suffix;
  if (used.has(base) && parentStem) {
    const qualified = `${parentStem}${base}`;
    if (!used.has(qualified)) {
      used.add(qualified);
      return qualified;
    }
  }
  return uniqueName(base, used);
}

interface Line {
  indent: number;
  text: string;
}

class Writer {
  readonly lines: Line[] = [];

  add(indent: number, text = ''): void {
    this.lines.push({indent, text});
  }

  render(): string {
    return this.lines.map(line => (line.text ? '  '.repeat(line.indent) + line.text : '')).join('\n');
  }
}

/** Emits the `getConfigured*` overrides a node needs, skipping catalog defaults. */
/**
 * Properties that describe the layout. In `layout` detail these are written out
 * for every field even when they still hold the Scout default, because that is
 * the part a developer wants to see spelled out next to the structure.
 */
const LAYOUT_PROPS = [
  'gridDataHints.w',
  'gridDataHints.h',
  'gridDataHints.weightX',
  'gridDataHints.weightY',
  'gridDataHints.useUiWidth',
  'gridDataHints.useUiHeight',
  'gridDataHints.fillHorizontal',
  'gridDataHints.fillVertical',
  'gridDataHints.horizontalAlignment',
  'gridDataHints.verticalAlignment',
  'gridColumnCount',
  'labelPosition',
  'labelVisible',
  'labelWidthInPixel'
];

function emitOverrides(writer: Writer, node: MockupNode, indent: number, ctx: EmitContext): number {
  const def = getWidget(node.objectType);
  const defaults = def?.defaults ?? {};
  const detail = ctx.options.detail;

  // Everything the node carries, plus - depending on the detail level - the
  // properties it merely inherits from the catalog default.
  const names = new Set(Object.keys(node.properties));
  if (detail === 'all') {
    Object.keys(defaults).forEach(name => names.add(name));
  } else if (detail === 'layout') {
    LAYOUT_PROPS.forEach(name => {
      if (defaults[name] !== undefined) names.add(name);
    });
  }

  let count = 0;
  for (const name of names) {
    const emitter = EMITTERS[name];
    if (!emitter) continue;
    if (emitter.only && !emitter.only.includes(node.objectType)) continue;
    const value = node.properties[name] ?? defaults[name];
    if (value === undefined) continue;

    const isDefault = JSON.stringify(value) === JSON.stringify(defaults[name]);
    // The label names the field, so it is always written out. Layout and `all`
    // deliberately repeat the defaults; `changed` keeps the file minimal.
    const forced = name === 'label'
      || (detail === 'all')
      || (detail === 'layout' && LAYOUT_PROPS.includes(name));
    if (isDefault && !forced) continue;

    const expression = emitter.express(value, ctx);
    if (expression === null) continue;
    emitter.imports?.forEach(fqn => ctx.imports.add(fqn));

    if (count > 0) writer.add(0);
    writer.add(indent, '@Override');
    writer.add(indent, `protected ${emitter.returns} ${emitter.method}() {`);
    writer.add(indent + 1, `return ${expression};`);
    writer.add(indent, '}');
    count++;
  }
  return count;
}

interface ColumnSpec {
  header: string;
  align: string;
  width: number;
  base: string;
  fqn: string;
}

const COLUMNS_PACKAGE = 'org.eclipse.scout.rt.client.ui.basic.table.columns';

/** Guesses a column type from the sample data the mockup carries. */
function columnType(cells: string[], align: string): {base: string; fqn: string} {
  const values = cells.filter(cell => cell.trim().length > 0);
  const numeric = values.length > 0 && values.every(cell => /^[-+]?[\d'’., ]+$/.test(cell) && /\d/.test(cell));
  const dates = values.length > 0 && values.every(cell => /^\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4}$/.test(cell));
  if (dates) return {base: 'AbstractDateColumn', fqn: `${COLUMNS_PACKAGE}.AbstractDateColumn`};
  if (numeric && align === 'right') return {base: 'AbstractBigDecimalColumn', fqn: `${COLUMNS_PACKAGE}.AbstractBigDecimalColumn`};
  return {base: 'AbstractStringColumn', fqn: `${COLUMNS_PACKAGE}.AbstractStringColumn`};
}

function parseColumnSpecs(node: MockupNode): ColumnSpec[] {
  const asGrid = (value: unknown): string[][] =>
    Array.isArray(value) ? value.filter(Array.isArray).map(row => row.map(cell => String(cell ?? ''))) : [];
  const columns = asGrid(node.properties.columns);
  const rows = asGrid(node.properties.rows);
  const cellsAt = (index: number): string[] => rows.map(row => (row[index] ?? '').trim());

  return columns.map(([header = '', align = 'left', width = ''], index) => ({
    header,
    align,
    width: Number(width) || 0,
    ...columnType(cellsAt(index), align)
  }));
}

interface Getter {
  type: string;
  name: string;
}

/** Recursively writes one node and everything below it. */
function emitNode(
  writer: Writer,
  node: MockupNode,
  indent: number,
  order: number,
  ctx: EmitContext,
  used: Set<string>,
  getters: Getter[],
  parentStem = ''
): void {
  const excuse = JS_ONLY.get(node.objectType);
  if (excuse) {
    const label = getWidget(node.objectType)?.label ?? node.objectType;
    writer.add(indent, `// TODO ${label}: ${excuse}`);
    ctx.warnings.push(`${label} was left out as a TODO comment - ${excuse}`);
    return;
  }
  const widget = JAVA_WIDGETS[node.objectType];
  if (!widget) {
    writer.add(indent, `// TODO ${node.objectType}: not covered by the Java export.`);
    ctx.warnings.push(`${node.objectType} is not covered by the Java export and was left out as a TODO comment.`);
    return;
  }

  const className = classNameFor(node, widget, used, parentStem);
  const isTableField = node.objectType === 'TableField';
  const typeArgs = isTableField ? `<${className}.Table>` : (widget.typeArgs ?? '');
  ctx.imports.add(widget.fqn);
  widget.imports?.forEach(fqn => ctx.imports.add(fqn));
  getters.push({type: className, name: `get${className}`});

  if (widget.note) writer.add(indent, `// TODO ${widget.note}`);
  writer.add(indent, `@Order(${order})`);
  writer.add(indent, `public class ${className} extends ${widget.base}${typeArgs} {`);

  // The table configuration belongs to the nested Table class, not to the field.
  const fieldNode = isTableField
    ? {...node, properties: Object.fromEntries(Object.entries(node.properties).filter(([name]) => !TABLE_ONLY_PROPS.has(name)))}
    : node;
  let members = emitOverrides(writer, fieldNode, indent + 1, ctx);

  if (isTableField) {
    if (members > 0) writer.add(0);
    emitTable(writer, node, indent + 1, ctx);
    members++;
  }

  const containerSlots = ['fields', 'tabItems', 'first', 'second', 'menus'];
  let childOrder = 1000;
  for (const slot of containerSlots) {
    const children = node.children.filter(child => (child.slot ?? 'fields') === slot);
    for (const child of children) {
      // A table field renders its own menus inside the nested table class.
      if (isTableField && slot === 'menus') continue;
      if (members > 0) writer.add(0);
      emitNode(writer, child, indent + 1, childOrder, ctx, used, getters, stemOf(className, widget.suffix));
      childOrder += 1000;
      members++;
    }
  }

  writer.add(indent, '}');
}

/** The nested `Table` class of an `AbstractTableField`. */
function emitTable(writer: Writer, node: MockupNode, indent: number, ctx: EmitContext): void {
  ctx.imports.add('org.eclipse.scout.rt.client.ui.basic.table.AbstractTable');
  writer.add(indent, 'public class Table extends AbstractTable {');

  const columns = parseColumnSpecs(node);
  const names = columns.map(column => uniqueName(pascal(column.header) + 'Column', ctx.names));

  // Scout's own convention: a typed getter per column, then the column classes.
  names.forEach(name => {
    writer.add(indent + 1, `public ${name} get${name}() {`);
    writer.add(indent + 2, `return getColumnSet().getColumnByClass(${name}.class);`);
    writer.add(indent + 1, '}');
    writer.add(0);
  });

  let hasMembers = names.length > 0;
  let order = 1000;
  columns.forEach((column, index) => {
    ctx.imports.add(column.fqn);
    if (index > 0) writer.add(0);
    writer.add(indent + 1, `@Order(${order})`);
    writer.add(indent + 1, `public class ${names[index]} extends ${column.base} {`);
    let first = true;
    if (column.header) {
      writer.add(indent + 2, '@Override');
      writer.add(indent + 2, 'protected String getConfiguredHeaderText() {');
      writer.add(indent + 3, `return ${text(column.header, ctx)};`);
      writer.add(indent + 2, '}');
      first = false;
    }
    if (column.width > 0) {
      if (!first) writer.add(0);
      writer.add(indent + 2, '@Override');
      writer.add(indent + 2, 'protected int getConfiguredWidth() {');
      writer.add(indent + 3, `return ${column.width};`);
      writer.add(indent + 2, '}');
      first = false;
    }
    if (column.align === 'right' || column.align === 'center') {
      if (!first) writer.add(0);
      writer.add(indent + 2, '@Override');
      writer.add(indent + 2, 'protected int getConfiguredHorizontalAlignment() {');
      writer.add(indent + 3, `return ${column.align === 'right' ? 1 : 0};`);
      writer.add(indent + 2, '}');
    }
    writer.add(indent + 1, '}');
    order += 1000;
  });

  // Table level configuration and the table's own menus.
  const tableWriter = new Writer();
  const count = emitOverrides(tableWriter, {...node, properties: tableProperties(node)}, indent + 1, ctx);
  if (count > 0) {
    if (hasMembers) writer.add(0);
    tableWriter.lines.forEach(line => writer.lines.push(line));
    hasMembers = true;
  }

  const menus = node.children.filter(child => child.slot === 'menus');
  let menuOrder = 1000;
  for (const menu of menus) {
    if (hasMembers) writer.add(0);
    emitNode(writer, menu, indent + 1, menuOrder, ctx, ctx.names, []);
    menuOrder += 1000;
    hasMembers = true;
  }

  writer.add(indent, '}');
}

/**
 * Splits a table field's properties: label and grid data belong to the field,
 * the table configuration belongs to the nested table class.
 */
const TABLE_ONLY_PROPS = new Set(['checkable', 'multiCheck', 'multiSelect', 'headerVisible', 'headerEnabled', 'compact', 'autoResizeColumns']);

function tableProperties(node: MockupNode): Record<string, PropertyValue> {
  const result: Record<string, PropertyValue> = {};
  for (const [name, value] of Object.entries(node.properties)) {
    if (TABLE_ONLY_PROPS.has(name)) result[name] = value;
  }
  return result;
}

/* ------------------------------------------------------------- entry point */

/** Every `Form` node in the document, in tree order. */
export function collectForms(root: MockupNode): MockupNode[] {
  const found: MockupNode[] = [];
  const walk = (node: MockupNode): void => {
    if (node.objectType === 'Form') found.push(node);
    node.children.forEach(walk);
  };
  walk(root);
  return found;
}

/** A class name suggestion derived from the form title, e.g. `PersonForm`. */
export function suggestClassName(form: MockupNode): string {
  const title = String(form.properties.title ?? '').trim();
  const stem = pascal(title) || 'Mockup';
  return stem.endsWith('Form') ? stem : `${stem}Form`;
}

const DISPLAY_HINTS: Record<string, string> = {
  view: 'IForm.DISPLAY_HINT_VIEW',
  dialog: 'IForm.DISPLAY_HINT_DIALOG',
  'popup-window': 'IForm.DISPLAY_HINT_POPUP_WINDOW'
};

export function generateFormJava(form: MockupNode, options: JavaExportOptions): JavaExportResult {
  const ctx: EmitContext = {
    options,
    imports: new Set([PLATFORM_ORDER]),
    warnings: [],
    names: new Set([options.className, 'MainBox', 'Table'])
  };
  const body = new Writer();
  const getters: Getter[] = [];

  // --- form level configuration --------------------------------------------
  const formOverrides = new Writer();
  let formMembers = 0;
  const title = String(form.properties.title ?? '');
  if (title) {
    formOverrides.add(1, '@Override');
    formOverrides.add(1, 'protected String getConfiguredTitle() {');
    formOverrides.add(2, `return ${text(title, ctx)};`);
    formOverrides.add(1, '}');
    formMembers++;
  }
  const subTitle = String(form.properties.subTitle ?? '');
  if (subTitle) {
    if (formMembers) formOverrides.add(0);
    formOverrides.add(1, '@Override');
    formOverrides.add(1, 'protected String getConfiguredSubTitle() {');
    formOverrides.add(2, `return ${text(subTitle, ctx)};`);
    formOverrides.add(1, '}');
    formMembers++;
  }
  const displayHint = String(form.properties.displayHint ?? 'view');
  if (displayHint !== 'view' && DISPLAY_HINTS[displayHint]) {
    ctx.imports.add('org.eclipse.scout.rt.client.ui.form.IForm');
    if (formMembers) formOverrides.add(0);
    formOverrides.add(1, '@Override');
    formOverrides.add(1, 'protected int getConfiguredDisplayHint() {');
    formOverrides.add(2, `return ${DISPLAY_HINTS[displayHint]};`);
    formOverrides.add(1, '}');
    formMembers++;
  }
  // Scout expresses modality through the modality hint, not a boolean.
  if (displayHint === 'dialog' && form.properties.modal === false) {
    ctx.imports.add('org.eclipse.scout.rt.client.ui.form.IForm');
    if (formMembers) formOverrides.add(0);
    formOverrides.add(1, '@Override');
    formOverrides.add(1, 'protected int getConfiguredModalityHint() {');
    formOverrides.add(2, 'return IForm.MODALITY_HINT_MODELESS;');
    formOverrides.add(1, '}');
    formMembers++;
  }
  if (form.properties.askIfNeedSave === false) {
    if (formMembers) formOverrides.add(0);
    formOverrides.add(1, '@Override');
    formOverrides.add(1, 'protected boolean getConfiguredAskIfNeedSave() {');
    formOverrides.add(2, 'return false;');
    formOverrides.add(1, '}');
    formMembers++;
  }
  const iconId = String(form.properties.iconId ?? '');
  if (iconId) {
    if (formMembers) formOverrides.add(0);
    formOverrides.add(1, '@Override');
    formOverrides.add(1, 'protected String getConfiguredIconId() {');
    formOverrides.add(2, `return ${javaString(iconId)};`);
    formOverrides.add(1, '}');
    formMembers++;
  }

  // --- the main box ---------------------------------------------------------
  const mainBox = new Writer();
  ctx.imports.add(`${FIELDS}.groupbox.AbstractGroupBox`);
  mainBox.add(1, '@Order(1000)');
  mainBox.add(1, 'public class MainBox extends AbstractGroupBox {');
  let boxMembers = 0;
  const columnCount = Number(form.properties.gridColumnCount ?? 2);
  if (columnCount !== 2) {
    mainBox.add(2, '@Override');
    mainBox.add(2, 'protected int getConfiguredGridColumnCount() {');
    mainBox.add(3, `return ${columnCount};`);
    mainBox.add(2, '}');
    boxMembers++;
  }
  let order = 1000;
  for (const child of form.children.filter(c => (c.slot ?? 'fields') === 'fields')) {
    if (boxMembers) mainBox.add(0);
    emitNode(mainBox, child, 2, order, ctx, ctx.names, getters);
    order += 1000;
    boxMembers++;
  }
  // Form menus become menus of the main box, which is where Scout puts them.
  for (const menu of form.children.filter(c => c.slot === 'menus')) {
    if (boxMembers) mainBox.add(0);
    emitNode(mainBox, menu, 2, order, ctx, ctx.names, getters);
    order += 1000;
    boxMembers++;
  }
  mainBox.add(1, '}');

  // --- assemble -------------------------------------------------------------
  if (formMembers) {
    formOverrides.lines.forEach(line => body.lines.push(line));
    body.add(0);
  }
  if (options.includeGetters) {
    body.add(1, 'public MainBox getMainBox() {');
    body.add(2, 'return getFieldByClass(MainBox.class);');
    body.add(1, '}');
    getters.forEach(getter => {
      body.add(0);
      body.add(1, `public ${getter.type} ${getter.name}() {`);
      body.add(2, `return getFieldByClass(${getter.type}.class);`);
      body.add(1, '}');
    });
    body.add(0);
  }
  mainBox.lines.forEach(line => body.lines.push(line));

  const header = new Writer();
  if (options.packageName.trim()) {
    header.add(0, `package ${options.packageName.trim()};`);
    header.add(0);
  }
  ctx.imports.add('org.eclipse.scout.rt.client.ui.form.AbstractForm');
  [...ctx.imports].sort().forEach(fqn => header.add(0, `import ${fqn};`));
  header.add(0);
  header.add(0, '/**');
  header.add(0, ` * Generated by ES Mockup from the mockup form "${title || options.className}".`);
  header.add(0, ' * <p>');
  header.add(0, ' * Only the form and its fields are generated - no form data, no service and no');
  header.add(0, ' * outline. Sample values shown in the mockup are display data and are not part');
  header.add(0, ' * of the generated code.');
  header.add(0, ' */');
  header.add(0, `public class ${options.className} extends AbstractForm {`);

  const footer = '}\n';
  return {
    code: `${header.render()}\n\n${body.render()}\n${footer}`,
    warnings: [...new Set(ctx.warnings)]
  };
}
