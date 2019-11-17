export function add(array1, array2) {
  for(let i = 0; i < array1.length; i++) array1[i] += array2[i];
  return array1;
}

export function map(array, func) {
  for(let i = 0; i < array.length; i++) array[i] = func(array[i]);
  return array;
}

export function duplicate(array) {
  return copy(array, new Float32Array(array.length));
}

export function copy(array1, array2) {
  let i, length;
  for(i = 0, length = array1.length; i < length; i++) array2[i] = array1[i];
  return array2;
}
