import type {MockupDocument, MockupNode, PropertyValue} from '../types';

export type PropType =
  | 'string'
  | 'text'
  | 'number'
  | 'boolean'
  | 'enum'
  | 'color'
  | 'icon'
  | 'image'
  | 'columns'
  | 'lines';

export interface PropOption {
  value: string | number;
  label: string;
}

export interface PropDef {
  name: string;
  label: string;
  type: PropType;
  group: string;
  options?: PropOption[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  description?: string;
  /** Hides the row unless the predicate matches the current property values. */
  visibleWhen?: (props: Record<string, PropertyValue>) => boolean;
}

export interface SlotDef {
  name: string;
  label: string;
  /** Object types accepted in this slot; `'*'` accepts anything droppable. */
  accepts: string[];
  /** How children are arranged when dropped. */
  layout: 'grid' | 'stack' | 'inline' | 'none';
  max?: number;
}

export type WidgetCategory =
  | 'Desktop'
  | 'Containers'
  | 'Value fields'
  | 'Selection fields'
  | 'Tables & Trees'
  | 'Buttons & Menus'
  | 'Tiles & Layout'
  | 'Advanced';

export interface RenderContext {
  doc: MockupDocument;
  /** True while rendering for HTML/PNG export - no editor affordances are added. */
  exportMode: boolean;
  dense: boolean;
  /** Renders one node through the registry (adds editor hooks in editor mode). */
  renderNode(node: MockupNode, parent: MockupNode | null): HTMLElement;
  /** Children of `node` that belong to `slot`. */
  childrenOf(node: MockupNode, slot: string): MockupNode[];
  /** Renders every child of a slot. */
  renderSlot(node: MockupNode, slot: string): HTMLElement[];
  /** Reads a property, falling back to the widget's Scout default. */
  prop<T extends PropertyValue>(node: MockupNode, name: string, fallback: T): T;
}

export interface WidgetDef {
  objectType: string;
  label: string;
  category: WidgetCategory;
  /** Scout icon id shown in the toolbox. */
  icon: string;
  description: string;
  /** Fully qualified Scout Java class, for the property panel's reference line. */
  javaClass?: string;
  /** `@eclipse-scout/core` class name. */
  jsClass?: string;
  /** True for anything deriving from Scout's FormField (gets label/status/grid data). */
  isFormField: boolean;
  /** Scout property defaults; anything not listed falls back to `undefined`. */
  defaults: Record<string, PropertyValue>;
  props: PropDef[];
  slots: SlotDef[];
  /** Default number of logical grid rows this widget occupies. */
  defaultGridH?: number;
  /**
   * Set for form fields that draw their own title (group box, tab box, ...).
   * Scout does not render the standard label column for those - the title is
   * part of the widget itself.
   */
  ownsLabel?: boolean;
  /** Renders the widget. For form fields this returns only the `.field` content. */
  render(ctx: RenderContext, node: MockupNode): HTMLElement;
}

const registry = new Map<string, WidgetDef>();

export function registerWidget(def: WidgetDef): WidgetDef {
  if (registry.has(def.objectType)) {
    throw new Error(`Duplicate widget definition: ${def.objectType}`);
  }
  registry.set(def.objectType, def);
  return def;
}

export function registerWidgets(defs: WidgetDef[]): void {
  defs.forEach(registerWidget);
}

export function getWidget(objectType: string): WidgetDef | undefined {
  return registry.get(objectType);
}

export function requireWidget(objectType: string): WidgetDef {
  const def = registry.get(objectType);
  if (!def) throw new Error(`Unknown objectType: ${objectType}`);
  return def;
}

export function allWidgets(): WidgetDef[] {
  return [...registry.values()];
}

export const CATEGORY_ORDER: WidgetCategory[] = [
  'Desktop',
  'Containers',
  'Value fields',
  'Selection fields',
  'Tables & Trees',
  'Buttons & Menus',
  'Tiles & Layout',
  'Advanced'
];
