/**
 * Focus handling for the editor's modal dialogs.
 *
 * A dialog that does not hold the focus is a trap of a different kind: Tab
 * walks out of it into the page behind, which is still there but unreachable,
 * and closing it leaves the focus wherever it happened to land. This keeps Tab
 * inside the dialog and hands the focus back to whatever opened it.
 */
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

/**
 * Traps the focus inside `dialog` and returns a function that releases it and
 * restores the focus to the element that had it before.
 */
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
  // A click inside the dialog on something unfocusable must not drop the focus
  // out of it, or the next Tab starts from the document again.
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
