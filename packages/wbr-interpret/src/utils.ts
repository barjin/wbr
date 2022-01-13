/**
 * Converts an array of scalars to an object with **items** of the array **for keys**.
 */
export function arrayToObject(array : any[]) {
  return array.reduce((p, x) => ({ ...p, [x]: [] }), {});
}

export enum PromiseState{
  PENDING,
  FULFILLED,
  REJECTED
};

// /**
//  * "Synchronously" reads the state of the given promise.
//  * Original solution at https://stackoverflow.com/a/35820220
//  * @param promise The tested promise
//  */
// export function getPromiseState(promise: Promise<any>) : Promise<PromiseState> {
//   console.log("testing promise...");
//   const immediate = null;
//   return Promise.race([promise, immediate]).then((resolved) => 
//       resolved === immediate ? PromiseState.PENDING : PromiseState.FULFILLED
//   , () => PromiseState.REJECTED)
// }