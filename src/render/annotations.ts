import type {Annotation, MockupDocument} from '../model/types';
import {div, span} from './dom';

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
