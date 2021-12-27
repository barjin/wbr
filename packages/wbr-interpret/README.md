# wbr-interpret
Blazing fast interpreter for the **Smart Workflows** automation format, part of the WBR project.

## Installation and usage

To install the `wbr-interpret` npm package, navigate to your project's directory and run

```bash
npm i -s @wbr-project/wbr-interpret
```

This installs the package into the `node_modules` folder of your project. The package also includes [Typescript](https://www.typescriptlang.org/) typings by default to facilitate its usage.

Now you are all set!

## Usage
Using the `wbr-interpret` package is simple. Just get your `.waw.json` file and your Playwright installation (should install with the package) ready.

```javascript
import { chromium } from 'playwright';
import  Interpret  from 'wbr-interpret';

(async () => {
	// either defined here or parsed from a file
	const workflow = {...}; 
	
	// intepret's settings (how to deal with the output etc.)
	const options = {
		serializableCallback: console.log,
		binaryCallback: (data) => fs.writeFileSync("filename", data)
	}
	
	const interpret = new Interpret(workflow, options);

	// the browser can be customized here (proxy, initScripts etc.)
	const browser = await chromium.launch();
	const page = await browser.newPage();

	// Here, you specify the "runtime" parameters and pass the Page to be used.
	await interpret.run(
	page,
	{
		login: "username",
		password: "pwd"
	});
})();
```

This example runs the defined `workflow` and exits.

## Writing your Workflows
To create your own workflow automation, you don't have to be a seasoned programmer (nor a programmer at all!) See [the docs](https://github.com/barjin/wbr/blob/main/docs/wbr-interpret/waw_definition.md) for a detailed explanation of the format.