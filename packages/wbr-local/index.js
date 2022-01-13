const Interpret = require('@wbr-project/wbr-interpret').default;
const {chromium} = require('playwright');
const fs = require('fs');

const workflow = {
	"meta": {
		"name": "Example workflow",
		"desc": "A WAW object workflow example/placeholder."
	},
	"workflow":[

	]
};

(
	async () => {
		const interpret = new Interpret(workflow, {serializableCallback: console.log, maxRepeats: null, maxConcurrency: 5});
		
		const browser = await chromium.launch({headless: false});
		const ctx = await browser.newContext();
		const page = await ctx.newPage();
		
		await interpret.run(page);

		await browser.close();
	}
)();