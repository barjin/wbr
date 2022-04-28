/* eslint-disable import/prefer-default-export */

export function objectEquality(
  a: Record<string, any>,
  b: Record<string, any>,
) {
  return JSON.stringify(a) === JSON.stringify(b);
}
