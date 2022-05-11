import { chromium } from 'playwright';
import { readdirSync } from 'fs';

beforeAll(async () => {
    require(`${__dirname}/../../../packages/wbr-cloud/build/cloud.js`);
});

test('Validation test', async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:8080');

    expect(await page.title()).toBe('wbr-editor');

    await page.click('[title="Close"]');
    await page.waitForTimeout(5);
      
      const testFolder = `${__dirname}/workflows/`;
      const workflows = readdirSync(testFolder);

      for (const w of workflows){
        const [fileChooser] = await Promise.all([
            // It is important to call waitForEvent before click to set up waiting.
            page.waitForEvent('filechooser'),
            // Opens the file chooser.
            page.locator('button:has-text("Load workflow")').click(),
          ]);
        
        await fileChooser.setFiles([`${testFolder}${w}`]);
        await page.waitForTimeout(10);

        if(w.includes('invalid')){
            expect(await (await page.$('h3')).textContent()).toBe(w);
        } else {
            const backbutton = await page.$('button');

            expect(backbutton).toBeTruthy();
            expect(await backbutton.textContent()).toBe('< Back to the menu');

            await backbutton.click();
        }
        await page.waitForTimeout(10);
      }
});