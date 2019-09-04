
function isPlainObject(val) {
  return typeof val === "object" && val !== null && val.constructor === Object;
}

export function merge(target, update) {
  if(!isPlainObject(target) || !isPlainObject(update)) return update;
  
  return Object.keys(update).reduce((acc, k) => ({
    ...acc,
    [k]: merge(target[k], update[k]),
  }), target);
}
