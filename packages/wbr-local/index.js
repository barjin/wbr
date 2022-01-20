
const Interpret = require('@wbr-project/wbr-interpret').default;
const {chromium} = require('playwright');
const fs = require('fs');

// const workflow = {
// 	"meta": {
// 		"name": "Example workflow",
// 		"desc": "A WAW object workflow example/placeholder."
// 	},
// 	"workflow":[

// 	]
// };

const workflow = JSON.parse(fs.readFileSync('../../examples/nehnutelnosti_sk.json'));

(
	async () => {
		const interpret = new Interpret(workflow, {serializableCallback: console.log, maxRepeats: null, maxConcurrency: 5});
		
		const browser = await chromium.launch({headless: false});
		const ctx = await browser.newContext();
		const page = await ctx.newPage();
		
		await interpret.run(page, {
			url: "https://www.nehnutelnosti.sk/bratislava/"
		});

		await browser.close();
	}
)();