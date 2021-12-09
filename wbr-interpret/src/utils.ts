export function toKebabCase(string: string) {
	return string
	.replace(/([a-z])([A-Z])/g, '$1-$2')
	.replace(/[\s_]+/g, '-')
	.toLowerCase()
}
/**
 * Converts an array of scalars to an object with **items** of the array **for keys**.
 */
export function arrayToObject(array : any[]){
	return array.reduce((p, x) => ({ ...p, [x]: [] }), {});
}

export function* intGenerator() {
	let i = 0;
	while (true) {
		i += 1;
		yield i;
	}
}