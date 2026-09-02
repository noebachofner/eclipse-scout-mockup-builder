import {resolveScoutColors} from '../render/colorSystem';
import type {ThemeSettings} from '../model/types';

export function themeCssVariables(theme: ThemeSettings): string {
  const colors = resolveScoutColors(theme.colors ?? {});
  const lines: string[] = [];
  for (const [name, value] of Object.entries(colors)) {
    lines.push(`  --scout-${name}: ${value};`);
  }
  if (theme.fontFamily) lines.push(`  --es-font-family: ${theme.fontFamily};`);
  return lines.join('\n');
}

export function applyTheme(host: HTMLElement, theme: ThemeSettings): void {
  const colors = resolveScoutColors(theme.colors ?? {});
  for (const [name, value] of Object.entries(colors)) {
    host.style.setProperty(`--scout-${name}`, value);
  }
  if (theme.fontFamily) host.style.setProperty('--es-font-family', theme.fontFamily);
  host.classList.toggle('dense', !!theme.dense);
  host.classList.toggle('no-responsive', theme.responsive === false);
}

export const THEME_PRESETS: {id: string; label: string; colors: Record<string, string>}[] = [
  {id: 'scout', label: 'Scout blue (default)', colors: {}},
  {
    id: 'teal',
    label: 'Teal',
    colors: {
      'accent-color-0': '#DCFBF5',
      'accent-color-1': '#BDF2E8',
      'accent-color-2': '#67E9D1',
      'accent-color-3': '#0DA98C',
      'accent-color-4': '#00856C',
      'accent-color-5': '#2F4542'
    }
  },
  {
    id: 'plum',
    label: 'Plum',
    colors: {
      'accent-color-0': '#F4E9F6',
      'accent-color-1': '#E4C8EC',
      'accent-color-2': '#C08FD1',
      'accent-color-3': '#7A2E96',
      'accent-color-4': '#5B1F73',
      'accent-color-5': '#3A2942'
    }
  },
  {
    id: 'graphite',
    label: 'Graphite',
    colors: {
      'accent-color-0': '#EFEFEF',
      'accent-color-1': '#D6D6D6',
      'accent-color-2': '#9A9A9A',
      'accent-color-3': '#3F4A54',
      'accent-color-4': '#2A323A',
      'accent-color-5': '#1B2026'
    }
  },
  {
    id: 'amber',
    label: 'Amber',
    colors: {
      'accent-color-0': '#FCF0E5',
      'accent-color-1': '#FDE1B1',
      'accent-color-2': '#FFBE6B',
      'accent-color-3': '#AD6200',
      'accent-color-4': '#874D00',
      'accent-color-5': '#3D2C14'
    }
  }
];

export const THEME_COLOR_FIELDS: {name: string; label: string; hint: string}[] = [
  {name: 'accent-color-3', label: 'Accent (main)', hint: 'Header, navigation, selection, links, default buttons.'},
  {name: 'accent-color-4', label: 'Accent (dark)', hint: 'Hover state of selected items.'},
  {name: 'accent-color-2', label: 'Accent (medium)', hint: 'Secondary accents and charts.'},
  {name: 'accent-color-1', label: 'Accent (light)', hint: 'Focus glow, tag background.'},
  {name: 'accent-color-0', label: 'Accent (lightest)', hint: 'Row/item selection background.'},
  {name: 'background-color', label: 'Background', hint: 'Bench and field background.'},
  {name: 'text-color', label: 'Text', hint: 'Default text colour.'},
  {name: 'label-color', label: 'Field label', hint: 'Colour of form field labels.'},
  {name: 'border-color', label: 'Border', hint: 'Separators and field borders.'},
  {name: 'panel-background-color', label: 'Panel background', hint: 'Table header, mode selector track.'}
];
