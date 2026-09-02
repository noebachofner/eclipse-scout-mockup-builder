/**
 * Checks a mockup against the things standard Scout layout can actually do.
 *
 * The editor lets you build layouts Scout cannot reproduce - free placement is
 * the obvious one - and it lets you enter values that break an export. Rather
 * than blocking those, the check collects them so they can be reviewed before
 * the mockup is handed to development.
 */
import type {MockupDocument, MockupNode} from './types';
import {getWidget} from './catalog';

export type FindingSeverity = 'error' | 'warning' | 'info';

/** Matches the fallback the renderer uses for a container without the property. */
const DEFAULT_GRID_COLUMN_COUNT = 2;

export interface Finding {
  severity: FindingSeverity;
  /** Node the finding belongs to, so clicking it can select the widget. */
  nodeId: string;
  /** Human readable path, e.g. `Person › Personal data › First name`. */
  path: string;
  message: string;
}

function labelOf(node: MockupNode): string {
  const label = String(node.properties.label ?? node.properties.title ?? node.properties.text ?? '').trim();
  return label || getWidget(node.objectType)?.label || node.objectType;
}

export function validateDocument(doc: MockupDocument): Finding[] {
  const findings: Finding[] = [];

  const walk = (node: MockupNode, ancestors: MockupNode[]): void => {
    const path = [...ancestors, node].map(labelOf).join(' › ');
    const add = (severity: FindingSeverity, message: string): void => {
      findings.push({severity, nodeId: node.id, path, message});
    };
    const parent = ancestors[ancestors.length - 1];

    // --- free placement ------------------------------------------------------
    if (node.properties.layoutMode === 'free') {
      add('warning', 'Free placement: children are positioned absolutely. Standard Scout layout cannot reproduce this - switch the container back to "Logical grid" before handing the mockup over.');
    }

    // --- logical grid --------------------------------------------------------
    const width = Number(node.properties['gridDataHints.w'] ?? 1);
    if (parent && width > 1) {
      const columns = Number(parent.properties.gridColumnCount ?? DEFAULT_GRID_COLUMN_COUNT);
      if (parent.properties.layoutMode !== 'free' && width > columns) {
        add('error', `Grid width ${width} is wider than the ${columns} columns of "${labelOf(parent)}". Scout clamps the field to the column count, so the mockup and the running form will differ.`);
      }
    }

    // --- exports -------------------------------------------------------------
    for (const name of ['imageUrl', 'logoUrl']) {
      const value = String(node.properties[name] ?? '');
      if (/^https?:/i.test(value)) {
        add('error', `${name} points at an external server. The standalone HTML export would depend on it and the PNG export cannot load it at all - pick a file instead so the image is embedded.`);
      }
    }

    // --- labels --------------------------------------------------------------
    const def = getWidget(node.objectType);
    if (def?.isFormField && !def.ownsLabel) {
      const label = String(node.properties.label ?? '').trim();
      const labelVisible = node.properties.labelVisible !== false;
      if (!label && labelVisible && node.objectType !== 'PlaceholderField') {
        add('info', 'No label. Scout renders an empty label column for the field - set a label, or turn "Label visible" off.');
      }
      if (node.properties.mandatory === true && !label) {
        add('warning', 'Mandatory field without a label: the asterisk has nothing to sit next to.');
      }
    }

    // --- java export ---------------------------------------------------------
    if (node.objectType === 'Form' && !node.children.some(child => (child.slot ?? 'fields') === 'fields')) {
      add('info', 'The form has no fields, so a Java export would produce an empty main box.');
    }

    node.children.forEach(child => walk(child, [...ancestors, node]));
  };

  walk(doc.root, []);
  return findings;
}
