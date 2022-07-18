# The WBR project - Documentation

Web Browser Recorder, a one-stop shop for running and managing automated tasks on the web. \

Web Browser Robot is a library allowing you to write fast web automations, saving you time on things that don't matter.


## Installation and usage

To install the `wbr` npm package, navigate to your project's directory and run

```bash
npm i wbr
```

This installs the package into the `node_modules` folder of your project. The package also includes [Typescript](https://www.typescriptlang.org/) typings by default to facilitate its usage.

Now you are all set!

## How to start
- [**Interpreter**](./wbr-interpret/interpreter.md) is the core of the Web Browser Robot - it reads your workflows, executes them, and makes sure everything goes smoothly.
- [**(Smart) Workflow**](./wbr-interpret/waw_definition.md) is a description of an actual real-life workflow you wish to automatize. By creating this, you teach the interpreter how to act in different situations, automating your task.
	- a workflow consists of a list of actions (what to do) paired with their respective conditions (when to do it). This is a very simple yet powerful mechanism for handling even the hardest tasks. It also allows the robot to act on its own, recovering from potential mistakes and being less dependent on the actual environment. To a certain extent, this actually makes WBR an AI powered tool :)

## Usage
Using the `wbr` package is simple. Just get your `.waw.json` file and your Playwright installation (should install with the package) ready.

```javascript
import { chromium } from 'playwright';
import  Interpret  from 'wbr';

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
To create your own workflow automation, you don't have to be a seasoned programmer (nor a programmer at all!) See [The WAW format definition](./wbr-interpret/waw_definition.md) for a detailed explanation of the format.
