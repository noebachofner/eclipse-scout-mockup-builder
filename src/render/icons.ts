import {SCOUT_ICONS} from '../model/scoutIcons.generated';
import {span} from './dom';

export {SCOUT_ICONS};

export function iconChar(iconId: string | null | undefined): string | null {
  if (!iconId) return null;
  const id = String(iconId).trim();
  if (!id) return null;
  if (id.startsWith('font:')) {
    const rest = id.slice(5).trim();
    const parts = rest.split(/\s+/);
    return parts[parts.length - 1] || null;
  }
  return SCOUT_ICONS[id] ?? null;
}

export function isImageIcon(iconId: string | null | undefined): boolean {
  const id = String(iconId ?? '').trim();
  if (!id || id.startsWith('font:') || id in SCOUT_ICONS) return false;
  return /^(https?:|data:|\/|\.{0,2}\/)/.test(id) || /\.(png|jpe?g|gif|svg|webp|avif)$/i.test(id);
}

export function renderIcon(iconId: string | null | undefined, extraClass = ''): HTMLElement | null {
  if (!iconId) return null;
  const char = iconChar(iconId);
  const suffix = extraClass ? ' ' + extraClass : '';
  if (char) {
    return span(`icon font-icon${suffix}`, char);
  }
  if (isImageIcon(iconId)) {
    const el = span(`icon image-icon${suffix}`);
    const img = document.createElement('img');
    img.src = String(iconId);
    img.alt = '';
    el.appendChild(img);
    return el;
  }
  return null;
}
