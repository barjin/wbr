/**
 * Converts an array of scalars to an object with **items** of the array **for keys**.
 */
export function arrayToObject(array : any[]) {
  return array.reduce((p, x) => ({ ...p, [x]: [] }), {});
}

export type ReadablePromise = { done: boolean, promise: Promise<any> };
