import type {MockupDocument} from '../model/types';
import {buildMockupCss, renderExportRoot} from './exportHtml';
import {themeCssVariables} from '../editor/theme';

export interface PngExportOptions {
  /** 1 = canvas size, 2 = retina. */
  scale?: number;
}

const XHTML_NS = 'http://www.w3.org/1999/xhtml';
const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Renders the mockup to a PNG.
 *
 * The document is rendered fresh (not screenshotted from the editor canvas), so
 * selection outlines, drop highlights and the zoom factor never end up in the
 * image. The rendered tree plus the complete stylesheet - icon font included as
 * a data URI - is wrapped in an SVG `foreignObject` and rasterised on a canvas.
 * Everything is inline, so the image is drawn from a data URI and the canvas
 * stays untainted.
 */
export async function exportPng(doc: MockupDocument, options: PngExportOptions = {}): Promise<Blob> {
  const scale = options.scale ?? 2;
  const width = doc.canvas.width;
  const height = doc.canvas.height;

  const css = await buildMockupCss();
  const rendered = renderExportRoot(doc);

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

  const foreignObject = document.createElementNS(SVG_NS, 'foreignObject');
  foreignObject.setAttribute('x', '0');
  foreignObject.setAttribute('y', '0');
  foreignObject.setAttribute('width', String(width));
  foreignObject.setAttribute('height', String(height));

  const container = document.createElementNS(XHTML_NS, 'div');
  container.setAttribute('xmlns', XHTML_NS);
  container.setAttribute('style', `width:${width}px;height:${height}px;overflow:hidden;background:#ffffff;`);

  const style = document.createElementNS(XHTML_NS, 'style');
  style.textContent = `${css}\n:root, .es-mockup-root {\n${themeCssVariables(doc.theme)}\n}`;
  container.appendChild(style);
  container.appendChild(importIntoXhtml(rendered));

  foreignObject.appendChild(container);
  svg.appendChild(foreignObject);

  const markup = new XMLSerializer().serializeToString(svg);
  const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;

  // Make sure the icon font is ready before rasterising, otherwise glyphs can
  // come out as empty boxes on the first export.
  if (document.fonts?.ready) await document.fonts.ready;

  const image = await loadImage(dataUri);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('The browser did not provide a 2D canvas context.');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('The browser could not encode the PNG.');
  return blob;
}

/**
 * `foreignObject` content must be XHTML. Re-creating every node in the XHTML
 * namespace keeps `XMLSerializer` from emitting HTML-only shorthand (`<img>`
 * without a closing tag) which would make the SVG unparsable.
 */
function importIntoXhtml(source: Element): Element {
  const target = document.createElementNS(XHTML_NS, source.tagName.toLowerCase());
  for (const attribute of Array.from(source.attributes)) {
    target.setAttribute(attribute.name, attribute.value);
  }
  for (const child of Array.from(source.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      target.appendChild(document.createTextNode(child.nodeValue ?? ''));
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const element = child as Element;
      // SVG children (charts) are already in the right namespace - deep clone them.
      target.appendChild(element.namespaceURI === SVG_NS ? element.cloneNode(true) : importIntoXhtml(element));
    }
  }
  return target;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The mockup could not be rasterised. Images referenced by URL must be data URIs to be included in a PNG.'));
    image.src = src;
  });
}
