import { chromium } from 'playwright';
import fs from 'fs';
import Interpreter from './interpret';

(async () => {
  const browser = await chromium.launch(process.env.DOCKER
    ? { executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox', '--disable-gpu'] }
    : { headless: true });

  const ctx = await browser.newContext();
  // await ctx.addInitScript({path: path.join(__dirname, 'hiding_tricks.js')});

  const interpreter = new Interpreter(JSON.parse(fs.readFileSync('./workflow.json').toString()), browser);

  const page = await ctx.newPage();

  await interpreter.run({}, page);
})();
