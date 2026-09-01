import {SCOUT_ICONS} from '../model/scoutIcons.generated';
import {span} from './dom';

export {SCOUT_ICONS};

/**
 * Scout icon ids come in three flavours:
 *   `font:<char>`        - a character of the scoutIcons font
 *   `font:<family> <char>` - a character of another icon font
 *   `path/to/image.png`  - an image
 * ES Mockup additionally accepts a bare icon name (`search`) for convenience.
 */
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

/**
 * Only values that actually look like a resource are treated as image icons -
 * an unknown bare name is a typo, not a relative URL, and must not trigger a
 * request (which would 404 and, in an export, leave a broken image).
 */
export function isImageIcon(iconId: string | null | undefined): boolean {
  const id = String(iconId ?? '').trim();
  if (!id || id.startsWith('font:') || id in SCOUT_ICONS) return false;
  return /^(https?:|data:|\/|\.{0,2}\/)/.test(id) || /\.(png|jpe?g|gif|svg|webp|avif)$/i.test(id);
}

/** Builds the `<span class="icon font-icon">` Scout uses for font icons. */
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
