
const Interpret = require('@wbr-project/wbr-interpret').default;
const {chromium} = require('playwright');
const fs = require('fs');


const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('process');
			
const workflow = JSON.parse(fs.readFileSync('../../examples/steam_scraper.waw.json'));

(
	async () => {
		const interpret = new Interpret(workflow, {serializableCallback: console.log, maxRepeats: 5, maxConcurrency: 5});
		
		const browser = await chromium.launch({headless: false});
		const ctx = await browser.newContext();
		const page = await ctx.newPage();
		
		interpret.on('flag', async (page, resume) => { //done? callback?
			const rl = readline.createInterface({ input, output });

			const title = await page.title();
			console.log(`The page ${title} requires your attention!`);
			
			await rl.question(`Please, handle the situation and continue by pressing [Enter]`);			
			resume();
			
			await rl.close();
		})
		
		await interpret.run(page, {
			url: "https://www.nehnutelnosti.sk/bratislava/"
		});

		await browser.close();
	}
)();