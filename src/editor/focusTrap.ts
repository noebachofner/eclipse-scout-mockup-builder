const FOCUSABLE = [
  'a[href]',
  'button:not(:disabled)',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

export function focusableWithin(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(el => el.offsetParent !== null || el === document.activeElement);
}

export function trapFocus(dialog: HTMLElement): () => void {
  const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return;
    const items = focusableWithin(dialog);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !dialog.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  };
  dialog.addEventListener('keydown', onKeyDown);
  const onFocusOut = (event: FocusEvent): void => {
    if (event.relatedTarget instanceof Node && dialog.contains(event.relatedTarget)) return;
    if (!document.body.contains(dialog)) return;
    queueMicrotask(() => {
      if (document.body.contains(dialog) && !dialog.contains(document.activeElement)) {
        focusableWithin(dialog)[0]?.focus();
      }
    });
  };
  dialog.addEventListener('focusout', onFocusOut);

  return () => {
    dialog.removeEventListener('keydown', onKeyDown);
    dialog.removeEventListener('focusout', onFocusOut);
    previous?.focus();
  };
}
