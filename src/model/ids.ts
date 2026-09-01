let counter = 0;

/** Short, stable-enough ids; readable in the saved JSON. */
export function newId(prefix = 'w'): string {
  counter++;
  return `${prefix}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
