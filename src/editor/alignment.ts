export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SnapResult {
  dx: number;
  dy: number;
  verticals: number[];
  horizontals: number[];
}

export const SNAP_THRESHOLD = 6;

const edgesX = (rect: Rect): number[] => [rect.x, rect.x + rect.width / 2, rect.x + rect.width];
const edgesY = (rect: Rect): number[] => [rect.y, rect.y + rect.height / 2, rect.y + rect.height];

export function computeSnap(moving: Rect, others: Rect[], container: {width: number; height: number}, threshold = SNAP_THRESHOLD): SnapResult {
  const targetsX: number[] = [0, container.width / 2, container.width];
  const targetsY: number[] = [0, container.height / 2, container.height];
  for (const other of others) {
    targetsX.push(...edgesX(other));
    targetsY.push(...edgesY(other));
  }

  const best = (own: number[], targets: number[]): {delta: number; line: number | null} => {
    let bestDelta = Infinity;
    let bestLine: number | null = null;
    for (const source of own) {
      for (const target of targets) {
        const delta = target - source;
        if (Math.abs(delta) < Math.abs(bestDelta) && Math.abs(delta) <= threshold) {
          bestDelta = delta;
          bestLine = target;
        }
      }
    }
    return {delta: Number.isFinite(bestDelta) ? bestDelta : 0, line: bestLine};
  };

  const x = best(edgesX(moving), targetsX);
  const y = best(edgesY(moving), targetsY);

  const snapped: Rect = {...moving, x: moving.x + x.delta, y: moving.y + y.delta};
  const verticals = x.line === null ? [] : targetsX.filter(target => edgesX(snapped).some(edge => Math.abs(edge - target) < 0.5));
  const horizontals = y.line === null ? [] : targetsY.filter(target => edgesY(snapped).some(edge => Math.abs(edge - target) < 0.5));

  return {
    dx: x.delta,
    dy: y.delta,
    verticals: [...new Set(verticals)],
    horizontals: [...new Set(horizontals)]
  };
}

export type AlignMode = 'left' | 'centerX' | 'right' | 'top' | 'centerY' | 'bottom';

export function alignRects(rects: Rect[], mode: AlignMode): Array<{x: number; y: number}> {
  if (rects.length < 2) return rects.map(rect => ({x: rect.x, y: rect.y}));
  const left = Math.min(...rects.map(rect => rect.x));
  const right = Math.max(...rects.map(rect => rect.x + rect.width));
  const top = Math.min(...rects.map(rect => rect.y));
  const bottom = Math.max(...rects.map(rect => rect.y + rect.height));

  return rects.map(rect => {
    switch (mode) {
      case 'left': return {x: left, y: rect.y};
      case 'right': return {x: right - rect.width, y: rect.y};
      case 'centerX': return {x: Math.round((left + right) / 2 - rect.width / 2), y: rect.y};
      case 'top': return {x: rect.x, y: top};
      case 'bottom': return {x: rect.x, y: bottom - rect.height};
      case 'centerY': return {x: rect.x, y: Math.round((top + bottom) / 2 - rect.height / 2)};
      default: return {x: rect.x, y: rect.y};
    }
  });
}

export function distributeRects(rects: Rect[], axis: 'x' | 'y'): Array<{x: number; y: number}> {
  if (rects.length < 3) return rects.map(rect => ({x: rect.x, y: rect.y}));
  const size = axis === 'x' ? 'width' : 'height';
  const order = rects.map((rect, index) => ({rect, index})).sort((a, b) => a.rect[axis] - b.rect[axis]);

  const first = order[0].rect;
  const last = order[order.length - 1].rect;
  const span = (last[axis] + last[size]) - first[axis];
  const used = order.reduce((sum, entry) => sum + entry.rect[size], 0);
  const gap = (span - used) / (order.length - 1);

  const result = rects.map(rect => ({x: rect.x, y: rect.y}));
  let cursor = first[axis];
  for (const {rect, index} of order) {
    result[index] = axis === 'x' ? {x: Math.round(cursor), y: rect.y} : {x: rect.x, y: Math.round(cursor)};
    cursor += rect[size] + gap;
  }
  return result;
}
