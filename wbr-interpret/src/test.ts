import { chromium } from "playwright";
import Interpreter from "./interpret";
import fs from 'fs';

(async () => {
  const browser = await chromium.launch(process.env.DOCKER
    ? { executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox', '--disable-gpu'] }
    : { headless: false });

  const interpreter = new Interpreter(JSON.parse(fs.readFileSync('./workflow.json').toString()), browser);

  await interpreter.run();
})();
