/**
 * A minimal re-implementation of the LESS color functions Scout's `colors.less`
 * uses, so the full Scout color system can be recomputed in the browser when the
 * user edits the palette.
 *
 * Only `fade`, `darken`, `lighten` and `rgba` occur in colors.less; the
 * algorithms below mirror less.js (HSL round-trip, channels rounded to integers)
 * so the result is identical to a real theme recompile. `tools/verify-colors.mjs`
 * asserts that against the LESS-compiled token file.
 */
import {SCOUT_COLOR_DECLS, type ColorExpr} from '../model/scoutColors.generated';

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
  /** Set when the value came from a CSS keyword LESS prints back verbatim (`transparent`). */
  keyword?: string;
}

const NAMED: Record<string, string> = {
  white: '#ffffff',
  black: '#000000',
  transparent: 'rgba(0, 0, 0, 0)'
};

export function parseColor(value: string): Rgba | null {
  const v = value.trim().toLowerCase();
  if (v === 'transparent') return {r: 0, g: 0, b: 0, a: 0, keyword: 'transparent'};
  const named = NAMED[v];
  if (named && named !== v) return parseColor(named);

  let m = /^#([0-9a-f]{3,8})$/.exec(v);
  if (m) {
    const h = m[1];
    if (h.length === 3 || h.length === 4) {
      const c = [...h].map(ch => parseInt(ch + ch, 16));
      return {r: c[0], g: c[1], b: c[2], a: h.length === 4 ? c[3] / 255 : 1};
    }
    if (h.length === 6 || h.length === 8) {
      const c = [0, 2, 4, 6].map(i => parseInt(h.slice(i, i + 2), 16));
      return {r: c[0], g: c[1], b: c[2], a: h.length === 8 ? c[3] / 255 : 1};
    }
    return null;
  }
  m = /^rgba?\(([^)]+)\)$/.exec(v);
  if (m) {
    const parts = m[1].split(/[,\s/]+/).filter(Boolean).map(p => parseFloat(p));
    if (parts.length < 3) return null;
    return {r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1};
  }
  return null;
}

export function formatColor(c: Rgba): string {
  if (c.keyword) return c.keyword;
  const r = clamp255(c.r);
  const g = clamp255(c.g);
  const b = clamp255(c.b);
  if (c.a >= 1) {
    return '#' + [r, g, b].map(n => n.toString(16).padStart(2, '0')).join('');
  }
  // less.js prints at most 3 decimals and strips trailing zeroes.
  const a = Math.round(c.a * 1000) / 1000;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function clamp255(n: number): number {
  return Math.min(255, Math.max(0, Math.round(n)));
}

function toHsl(c: Rgba): {h: number; s: number; l: number; a: number} {
  const r = c.r / 255;
  const g = c.g / 255;
  const b = c.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return {h: h * 360, s, l, a: c.a};
}

function fromHsl(hsl: {h: number; s: number; l: number; a: number}): Rgba {
  // NOTE: the arithmetic below mirrors less.js exactly, including the order of
  // operations - normalising the hue differently changes the last bit of the
  // floating point result and can shift a channel by one.
  const h = (hsl.h % 360) / 360;
  const s = clamp01(hsl.s);
  const l = clamp01(hsl.l);
  const m2 = l <= 0.5 ? l * (s + 1) : l + s - l * s;
  const m1 = l * 2 - m2;
  const hue = (x: number): number => {
    const t = x < 0 ? x + 1 : x > 1 ? x - 1 : x;
    if (t * 6 < 1) return m1 + (m2 - m1) * t * 6;
    if (t * 2 < 1) return m2;
    if (t * 3 < 2) return m1 + (m2 - m1) * (2 / 3 - t) * 6;
    return m1;
  };
  return {
    r: hue(h + 1 / 3) * 255,
    g: hue(h) * 255,
    b: hue(h - 1 / 3) * 255,
    a: hsl.a
  };
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

export function darken(c: Rgba, amount: number): Rgba {
  const hsl = toHsl(c);
  hsl.l = clamp01(hsl.l - amount / 100);
  return fromHsl(hsl);
}

export function lighten(c: Rgba, amount: number): Rgba {
  const hsl = toHsl(c);
  hsl.l = clamp01(hsl.l + amount / 100);
  return fromHsl(hsl);
}

export function fade(c: Rgba, amount: number): Rgba {
  return {r: c.r, g: c.g, b: c.b, a: clamp01(amount / 100)};
}

function numberArg(expr: ColorExpr): number {
  if (expr.k === 'lit') return parseFloat(expr.value);
  return 0;
}

/**
 * Evaluates the whole `colors.less` declaration list.
 *
 * @param overrides raw variable overrides, keyed by the LESS name without `@`
 *        (e.g. `accent-color-3` or `palette-gray-2`). Values are CSS colors.
 * @returns every declared color, keyed by LESS name, as a CSS color string.
 */
export function resolveScoutColors(overrides: Record<string, string> = {}): Record<string, string> {
  const env = new Map<string, Rgba>();
  const out: Record<string, string> = {};

  const evaluate = (expr: ColorExpr): Rgba | null => {
    switch (expr.k) {
      case 'lit': {
        return parseColor(expr.value);
      }
      case 'ref': {
        return env.get(expr.name) ?? null;
      }
      case 'call': {
        const first = expr.args.length ? evaluate(expr.args[0]) : null;
        switch (expr.fn) {
          case 'fade':
            return first ? fade(first, numberArg(expr.args[1])) : null;
          case 'darken':
            return first ? darken(first, numberArg(expr.args[1])) : null;
          case 'lighten':
            return first ? lighten(first, numberArg(expr.args[1])) : null;
          case 'rgba': {
            const nums = expr.args.map(a => (a.k === 'lit' ? parseFloat(a.value) : NaN));
            if (nums.length === 4 && nums.every(n => !Number.isNaN(n))) {
              return {r: nums[0], g: nums[1], b: nums[2], a: nums[3]};
            }
            // rgba(@someColor, 0.4) - LESS allows a color as first argument
            return first ? {...first, a: numberArg(expr.args[expr.args.length - 1])} : null;
          }
          default:
            return null;
        }
      }
    }
  };

  for (const decl of SCOUT_COLOR_DECLS) {
    const override = overrides[decl.name];
    const rgba = override ? parseColor(override) : evaluate(decl.expr);
    if (!rgba) continue;
    env.set(decl.name, rgba);
    out[decl.name] = formatColor(rgba);
  }
  return out;
}

/** Default (unthemed) resolution of the Scout color system. */
export const DEFAULT_SCOUT_COLORS = resolveScoutColors();
