export default function throwErr(name: string, message: string) : never {
  const e = new Error(message);
  e.name = name;
  throw e;
}
