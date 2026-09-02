export interface PageBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

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

export function placeOver(element: HTMLElement, box: PageBox): void {
  element.style.left = `${box.left}px`;
  element.style.top = `${box.top}px`;
  element.style.width = `${box.width}px`;
  element.style.height = `${box.height}px`;
}
