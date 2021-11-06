/* eslint-disable max-len */
// Logger

export enum Level{
  DATE = 36,
  LOG = 0,
  WARN = 93,
  ERROR = 31,
  DEBUG = 95,
  RESET = 0,
}

export default function logger(message: string | Error, level: (Level.LOG | Level.WARN | Level.ERROR | Level.DEBUG) = Level.LOG) {
  if (message.constructor.name === 'Error' && typeof message !== 'string') {
    message = <Error><unknown>(message).message;
  }
  process.stdout.write(`\x1b[${Level.DATE}m[${(new Date()).toLocaleString()}]\x1b[0m `);
  process.stdout.write(`\x1b[${level}m`);
  if (level === Level.ERROR || level === Level.WARN) {
    process.stderr.write(<string>message);
  } else {
    process.stdout.write(<string>message);
  }
  process.stdout.write(`\x1b[${Level.RESET}m\n`);
}
