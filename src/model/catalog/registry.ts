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
  | 'rows'
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
  columns?: string[];
  visibleWhen?: (props: Record<string, PropertyValue>) => boolean;
}

export interface SlotDef {
  name: string;
  label: string;
  accepts: string[];
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
  exportMode: boolean;
  dense: boolean;
  renderNode(node: MockupNode, parent: MockupNode | null): HTMLElement;
  childrenOf(node: MockupNode, slot: string): MockupNode[];
  renderSlot(node: MockupNode, slot: string): HTMLElement[];
  prop<T extends PropertyValue>(node: MockupNode, name: string, fallback: T): T;
}

export interface WidgetDef {
  objectType: string;
  label: string;
  category: WidgetCategory;
  icon: string;
  description: string;
  javaClass?: string;
  jsClass?: string;
  isFormField: boolean;
  defaults: Record<string, PropertyValue>;
  props: PropDef[];
  slots: SlotDef[];
  defaultGridH?: number;
  ownsLabel?: boolean;
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
