
function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && val.constructor === Object;
}

export function merge<T>(target: T, update: unknown): T {
  if(Array.isArray(target) && isPlainObject(update)) { // Sparse array updates
    const copy = [...target];
    for(const [k, v] of Object.entries(update)) copy[parseInt(k)] = merge(copy[parseInt(k)], v);
    return copy as T;
  }
  if(!isPlainObject(target) || !isPlainObject(update)) return update as T;
  
  return Object.keys(update).reduce<Record<string, unknown>>((acc, k) => ({
    ...acc,
    [k]: merge(target[k], update[k]),
  }), target) as T;
}
