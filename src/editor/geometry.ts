export interface PageBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * An element's box in the mockup's own coordinate space.
 *
 * The canvas is scaled by the zoom factor, so a screen rectangle has to be
 * divided by it and made relative to the page before it means anything to the
 * document. Every overlay needs this, so it lives in one place.
 */
export function pageBoxOf(element: Element, page: HTMLElement, zoom: number): PageBox {
  const pageRect = page.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  const scale = zoom || 1;
  return {
    left: (rect.left - pageRect.left) / scale,
    top: (rect.top - pageRect.top) / scale,
    width: rect.width / scale,
    height: rect.height / scale
  };
}

/** Places an absolutely positioned overlay element over `box`. */
export function placeOver(element: HTMLElement, box: PageBox): void {
  element.style.left = `${box.left}px`;
  element.style.top = `${box.top}px`;
  element.style.width = `${box.width}px`;
  element.style.height = `${box.height}px`;
}
