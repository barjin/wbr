/*
* Logger class for more detailed and comprehensible logs (with colors and timestamps)
*/

export enum Level {
  DATE = 36,
  LOG = 0,
  WARN = 93,
  ERROR = 31,
  DEBUG = 95,
  RESET = 0,
}

export default function logger(
  message: string | Error,
  level: (Level.LOG | Level.WARN | Level.ERROR | Level.DEBUG) = Level.LOG,
) {
  let m = message;
  if (message.constructor.name.includes('Error') && typeof message !== 'string') {
    m = <Error><unknown>(message).message;
  }
  process.stdout.write(`\x1b[${Level.DATE}m[${(new Date()).toLocaleString()}]\x1b[0m `);
  process.stdout.write(`\x1b[${level}m`);
  if (level === Level.ERROR || level === Level.WARN) {
    process.stderr.write(<string>m);
  } else {
    process.stdout.write(<string>m);
  }
  process.stdout.write(`\x1b[${Level.RESET}m\n`);
}
