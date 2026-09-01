/** Reusable visual building blocks that several widget renderers share. */
import {div, span} from './dom';
import {renderIcon} from './icons';

export interface InputOptions {
  placeholder?: string;
  alignment?: 'left' | 'center' | 'right';
  multiline?: boolean;
  disabled?: boolean;
  /** A trailing icon inside the input, e.g. the calendar or smart field chevron. */
  icon?: string;
  extraClass?: string;
}

/**
 * Scout renders value fields as an `<input>`-looking box. Mockups use a div
 * (`.input-field`, the same class Scout uses for its non-input value fields) so
 * the exported HTML stays inert and prints identically.
 */
export function inputField(value: string, options: InputOptions = {}): HTMLElement {
  const wrapper = div('field-container');
  const input = div(`input-field${options.extraClass ? ' ' + options.extraClass : ''}`);
  if (options.multiline) input.classList.add('multiline');
  if (options.disabled) input.classList.add('disabled');
  if (options.alignment && options.alignment !== 'left') input.classList.add('halign-' + options.alignment);
  if (value) {
    input.textContent = value;
  } else if (options.placeholder) {
    input.textContent = options.placeholder;
    input.classList.add('placeholder');
  } else {
    input.innerHTML = '&nbsp;';
  }
  wrapper.appendChild(input);
  if (options.icon) {
    const icon = renderIcon(options.icon, 'field-icon');
    if (icon) wrapper.appendChild(icon);
    input.classList.add('has-icon');
  }
  return wrapper;
}

export function checkBox(checked: boolean, disabled = false): HTMLElement {
  const box = span('check-box');
  if (checked) box.classList.add('checked');
  if (disabled) box.classList.add('disabled');
  return box;
}

export function radioCircle(selected: boolean, disabled = false): HTMLElement {
  const circle = span('radio-button-circle');
  if (selected) circle.classList.add('checked');
  if (disabled) circle.classList.add('disabled');
  return circle;
}

/** Splits a multi-line text property into trimmed, non-empty lines. */
export function lines(value: unknown, fallback: string[] = []): string[] {
  if (Array.isArray(value)) return value.map(String);
  const text = String(value ?? '').trim();
  if (!text) return fallback;
  return text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
}

/** Parses `Header|Header2` style column definitions used by table mockups. */
export function cells(line: string): string[] {
  return line.split('|').map(c => c.trim());
}
