import type {MockupDocument, MockupNode, PropertyValue} from '../model/types';
import {getWidget, type RenderContext, type WidgetDef} from '../model/catalog/registry';
import {append, div, h, span} from './dom';
import {renderIcon} from './icons';

export interface RenderOptions {
  exportMode?: boolean;
  /** Called for every rendered node so the editor can attach selection handling. */
  onNode?: (el: HTMLElement, node: MockupNode, parent: MockupNode | null, def: WidgetDef | undefined) => void;
}

const SEVERITY_ICON: Record<string, string> = {
  error: 'exclamation-mark-circle',
  warning: 'exclamation-mark-circle',
  info: 'info',
  ok: 'checked-bold'
};

export function createRenderContext(doc: MockupDocument, options: RenderOptions = {}): RenderContext {
  const ctx: RenderContext = {
    doc,
    exportMode: !!options.exportMode,
    dense: !!doc.theme.dense,
    childrenOf(node, slot) {
      const def = getWidget(node.objectType);
      const slots = def?.slots ?? [];
      const defaultSlot = slots[0]?.name;
      return node.children.filter(child => (child.slot ?? defaultSlot) === slot);
    },
    renderSlot(node, slot) {
      return ctx.childrenOf(node, slot).map(child => ctx.renderNode(child, node));
    },
    prop<T extends PropertyValue>(node: MockupNode, name: string, fallback: T): T {
      const own = node.properties[name];
      if (own !== undefined && own !== null) return own as T;
      const def = getWidget(node.objectType);
      const fromDefaults = def?.defaults[name];
      if (fromDefaults !== undefined && fromDefaults !== null) return fromDefaults as T;
      return fallback;
    },
    renderNode(node, parent) {
      const def = getWidget(node.objectType);
      let el: HTMLElement;
      if (!def) {
        el = div('unknown-widget', `Unknown widget: ${node.objectType}`);
      } else if (def.isFormField) {
        el = renderFormField(ctx, node, def);
      } else {
        el = def.render(ctx, node);
        applyCommonStyles(ctx, node, el);
      }
      el.dataset.nodeId = node.id;
      el.dataset.objectType = node.objectType;
      options.onNode?.(el, node, parent, def);
      return el;
    }
  };
  return ctx;
}

function applyCommonStyles(ctx: RenderContext, node: MockupNode, el: HTMLElement): void {
  // A stable, collision-free hook for custom CSS in exported mockups. The bare
  // slug is deliberately not used: `button`, `group-box` etc. are already taken
  // by the widget styles themselves.
  el.classList.add(`scout-${slug(node.objectType)}`);
  const cssClass = ctx.prop<string>(node, 'cssClass', '');
  if (cssClass) el.classList.add(...cssClass.split(/\s+/).filter(Boolean));
  if (ctx.prop<boolean>(node, 'visible', true) === false) el.classList.add('invisible');
  if (ctx.prop<boolean>(node, 'enabled', true) === false) el.classList.add('disabled');
  const fontColor = ctx.prop<string>(node, 'fontColor', '');
  if (fontColor) el.style.color = fontColor;
  const backgroundColor = ctx.prop<string>(node, 'backgroundColor', '');
  if (backgroundColor) el.style.backgroundColor = backgroundColor;
  if (ctx.prop<boolean>(node, 'fontBold', false)) el.style.fontWeight = 'bold';
}

/**
 * Builds Scout's standard form field structure:
 * `mandatory-indicator | label | field | status`, positioned by `FormFieldLayout`.
 * The widget definition only contributes the `.field` content.
 */
export function renderFormField(ctx: RenderContext, node: MockupNode, def: WidgetDef): HTMLElement {
  const labelPosition = Number(ctx.prop<number>(node, 'labelPosition', 0));
  const labelVisible = ctx.prop<boolean>(node, 'labelVisible', true);
  const label = ctx.prop<string>(node, 'label', '');
  const subLabel = ctx.prop<string>(node, 'subLabel', '');
  const mandatory = ctx.prop<boolean>(node, 'mandatory', false);
  const enabled = ctx.prop<boolean>(node, 'enabled', true);
  const severity = ctx.prop<string>(node, 'errorStatus', 'none');
  const statusVisible = ctx.prop<boolean>(node, 'statusVisible', true);
  const tooltipText = ctx.prop<string>(node, 'tooltipText', '');

  const positionClass = ['label-position-default', 'label-position-left', 'label-position-on-field',
    'label-position-right', 'label-position-top', 'label-position-bottom'][labelPosition] ?? 'label-position-default';

  const root = div(`form-field scout-${slug(def.objectType)} ${positionClass}`);
  // Scout puts the field style on the container as well as on the field itself.
  const fieldStyle = ctx.prop<string>(node, 'fieldStyle', 'alternative') === 'classic' ? 'classic' : 'alternative';
  root.classList.add(fieldStyle);
  if (def.ownsLabel) root.classList.add('owns-label');
  if (mandatory) root.classList.add('mandatory');
  if (!enabled) root.classList.add('disabled');
  if (ctx.prop<boolean>(node, 'readOnly', false)) root.classList.add('read-only');
  if (ctx.prop<boolean>(node, 'loading', false)) root.classList.add('loading');
  if (ctx.prop<string>(node, 'statusPosition', 'default') === 'top') root.classList.add('status-position-top');
  if (severity && severity !== 'none') root.classList.add('has-' + severity);
  if (!labelVisible || labelPosition === 2) root.classList.add('label-hidden');

  const indicator = div('mandatory-indicator');
  indicator.textContent = mandatory ? '*' : '';
  root.appendChild(indicator);

  if (labelVisible && labelPosition !== 2 && !def.ownsLabel) {
    const labelEl = h('label', 'label');
    labelEl.textContent = label;
    const widthInPixel = Number(ctx.prop<number>(node, 'labelWidthInPixel', 0));
    if (widthInPixel > 0) labelEl.style.width = `${widthInPixel}px`;
    if (widthInPixel === -1) labelEl.style.width = 'auto';
    if (subLabel) {
      const wrapper = div('label-with-sub');
      wrapper.appendChild(labelEl);
      wrapper.appendChild(span('sub-label', subLabel));
      root.appendChild(wrapper);
    } else {
      root.appendChild(labelEl);
    }
  }

  const fieldContent = def.render(ctx, node);
  fieldContent.classList.add('field');
  fieldContent.classList.add(fieldStyle);
  if (labelPosition === 2 && label && !fieldContent.dataset.placeholderApplied) {
    const input = fieldContent.querySelector('.input-field, input, textarea');
    if (input && !input.textContent) input.textContent = label;
    if (input) input.classList.add('placeholder');
  }
  root.appendChild(fieldContent);

  const status = div('status');
  const severityIcon = SEVERITY_ICON[severity];
  if (statusVisible && !def.ownsLabel && (severityIcon || tooltipText)) {
    const icon = renderIcon(severityIcon ?? 'info');
    if (icon) status.appendChild(icon);
    status.classList.add(severity !== 'none' ? severity : 'tooltip');
  }
  root.appendChild(status);

  if (severity !== 'none') {
    const message = ctx.prop<string>(node, 'errorStatusMessage', '');
    if (message) {
      const hint = div('field-status-message', message);
      root.appendChild(hint);
      root.classList.add('has-status-message');
    }
  }

  applyCommonStyles(ctx, node, root);
  return root;
}

/** `StringField` -> `string-field`, used for the `scout-*` marker class. */
function slug(objectType: string): string {
  return objectType
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

/** Renders a whole document into a detached element. */
export function renderDocument(doc: MockupDocument, options: RenderOptions = {}): HTMLElement {
  const ctx = createRenderContext(doc, options);
  const root = ctx.renderNode(doc.root, null);
  const host = div('scout es-mockup-root');
  if (doc.theme.dense) host.classList.add('dense');
  if (doc.theme.responsive === false) host.classList.add('no-responsive');
  host.style.setProperty('--es-font-family', doc.theme.fontFamily || 'Arial, sans-serif');
  append(host, root);
  return host;
}
