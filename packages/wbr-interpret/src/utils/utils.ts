/**
 * ESLint rule in case there is only one util function
 * (it still does not represent the "utils" file)
*/

/* eslint-disable import/prefer-default-export */

/**
 * Converts an array of scalars to an object with **items** of the array **for keys**.
 */
export function arrayToObject(array : any[]) {
  return array.reduce((p, x) => ({ ...p, [x]: [] }), {});
}
