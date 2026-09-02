import type {Annotation, MockupDocument} from '../model/types';
import {div, span} from './dom';

/**
 * The review callout layer.
 *
 * Rendered by the editor canvas and by both exports, so a reviewer sees the
 * same numbers in the PNG that the author placed in the editor. The layer sits
 * in the mockup's own coordinate space, which means the callouts stay attached
 * to the spot they were dropped on when the canvas is zoomed.
 */
export function renderAnnotations(doc: MockupDocument): HTMLElement | null {
  if (!doc.canvas.annotationsVisible || !doc.annotations.length) return null;
  const layer = div('annotation-layer');
  doc.annotations.forEach((annotation, index) => {
    layer.appendChild(renderAnnotation(annotation, index + 1));
  });
  const legend = renderLegend(doc.annotations);
  if (legend) layer.appendChild(legend);
  return layer;
}

export function renderAnnotation(annotation: Annotation, number: number): HTMLElement {
  const marker = div('annotation-marker');
  marker.dataset.annotationId = annotation.id;
  marker.style.left = `${annotation.x}px`;
  marker.style.top = `${annotation.y}px`;
  marker.appendChild(span('annotation-number', String(number)));
  if (annotation.text) marker.title = annotation.text;
  return marker;
}

/** The numbered list under the mockup; only callouts with a text appear. */
function renderLegend(annotations: Annotation[]): HTMLElement | null {
  const described = annotations
    .map((annotation, index) => ({annotation, number: index + 1}))
    .filter(entry => entry.annotation.text.trim().length > 0);
  if (!described.length) return null;

  const legend = div('annotation-legend');
  for (const {annotation, number} of described) {
    const row = div('annotation-legend-row');
    row.appendChild(span('annotation-number', String(number)));
    row.appendChild(span('annotation-legend-text', annotation.text));
    legend.appendChild(row);
  }
  return legend;
}
