import type {MockupDocument} from '../model/types';
import {renderDocument} from '../render/render';
import {renderAnnotations} from '../render/annotations';
import {themeCssVariables} from '../editor/theme';
import tokensCss from '../styles/scout-tokens.generated.css?raw';
import renderCss from '../styles/scout-render.css?raw';
import iconFontUrl from '../assets/scoutIcons.woff?url';

export async function buildMockupCss(): Promise<string> {
  const fontDataUri = await loadIconFontDataUri();
  return [
    stripFontFace(tokensCss),
    fontFaceRule(fontDataUri),
    stripFontFace(renderCss)
  ].join('\n');
}

export function renderExportRoot(doc: MockupDocument): HTMLElement {
  const rendered = renderDocument(doc, {exportMode: true});
  rendered.style.width = `${doc.canvas.width}px`;
  rendered.style.height = `${doc.canvas.height}px`;
  const annotations = renderAnnotations(doc);
  if (annotations) {
    rendered.style.position = 'relative';
    rendered.appendChild(annotations);
  }
  return rendered;
}

export async function buildHtmlExport(doc: MockupDocument): Promise<string> {
  const css = await buildMockupCss();
  const rendered = renderExportRoot(doc);

  const themeVars = themeCssVariables(doc.theme);
  const title = escapeHtml(doc.meta.name || 'ES Mockup');
  const description = escapeHtml(doc.meta.description || '');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${title}</title>
${description ? `<meta name="description" content="${description}"/>\n` : ''}<meta name="generator" content="ES Mockup - Eclipse Scout mockup builder"/>
<style>
${css}

/* --- export page frame --- */
html, body {
  margin: 0;
  padding: 0;
  background-color: #f2f3f5;
}
.es-export-page {
  width: ${doc.canvas.width}px;
  height: ${doc.canvas.height}px;
  margin: 0 auto;
  overflow: hidden;
  background-color: var(--scout-body-background-color);
  box-shadow: 0 2px 18px rgba(0, 0, 0, 0.18);
}
.es-export-theme {
${themeVars}
}
@media print {
  html, body { background: #fff; }
  .es-export-page { box-shadow: none; margin: 0; }
}
</style>
</head>
<body class="es-export-theme">
<div class="es-export-page">
${rendered.outerHTML}
</div>
</body>
</html>
`;
}

function stripFontFace(css: string): string {
  return css.replace(/@font-face\s*\{[^}]*\}/g, '');
}

function fontFaceRule(dataUri: string): string {
  return `@font-face {
  font-family: scoutIcons;
  font-weight: normal;
  font-display: block;
  src: url('${dataUri}') format('woff');
}`;
}

let cachedFont: string | null = null;

export async function loadIconFontDataUri(): Promise<string> {
  if (cachedFont) return cachedFont;
  const response = await fetch(iconFontUrl);
  if (!response.ok) throw new Error(`Could not load the Scout icon font (${response.status}).`);
  const buffer = await response.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  cachedFont = `data:font/woff;base64,${btoa(binary)}`;
  return cachedFont;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
