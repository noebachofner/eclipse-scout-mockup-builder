let counter = 0;

export function newId(prefix = 'w'): string {
  counter++;
  return `${prefix}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
