## The interpreter
The interpreter is the core of the entire WBR library - one might say, the interpreter is the actual eponymous robot. Its duty is to read the workflow, act upon it, handle the internal concurrency and provide us with the execution results.

### Creating an interpreter instance
During the creation of the interpreter class, it only requires the Workflow object representing the Smart Workflow we want to run.
```javascript
const workflow = {
    ...
}

const interpret = new Interpret(workflow);
```
We can also specify several intepreter options, namely:
- `maxRepeats`: specifies how many times can the interpreter run the same action on a webpage. Breaks possible infinite loops. In case this is not the desired behaviour (the workflow supposed to repeat an action many times), it can be turned off by setting this parameter to `null`.

```javascript
const workflow = {
    ...
}

// Exits the execution loop after 10 repetitions of the same action.
const interpret = new Interpret(workflow, { 
    maxRepeats: 10 
}); 
```

- `maxConcurrency`: specifies how many parallel browser tabs do you want the interpreter to handle at once. Setting this too high can negatively affect the interpreter's performance, or even lead to freezing. Setting this option to `null` turns off the limiting mechanism, allowing the intepreter to run all the enqueued jobs in parallel browser tabs at once.

```javascript
// Handles one browser tab at a time, not allowing for any concurrency.
const interpret = new Interpret(workflow, { 
    maxConcurrency: 1 
}); 
```

- `serializableCallback` - a custom "output" function for JSON serializable data. All the interpreter's JSON serializable output gets passed as a parameter to this function (called repeatedly, whenever the interpreter produces an output).

```javascript
// (Pretty) prints out all the results to the console.
const interpret = new Interpret(workflow, { 
    serializableCallback: (data) => {
        console.log(JSON.stringify(data, null, 2));
    }
}); 
```

- `binaryCallback` - a custom "output" function for arbitrary data. Any kind of interpreter non-serializable output data gets passed as a parameter to this function (along with its [MIME type](https://en.wikipedia.org/wiki/Media_type) as the second parameter). As shown below, both output callbacks can be asynchronous functions.

```javascript
// Saves the provided data into a file named "filename" (possibly overwriting the older data with the newer data)
const interpret = new Interpret(workflow, { 
    binaryCallback: async (data, _) => {
        await fs.writeFile("filename", data);
    }
}); 
```

Any of the interpreter options are however not required and the interpreter can be easily spawned without them, using its internal defaults.

### Running a workflow
Once spawned, we can now run the interpreter provided with the workflow simply by calling its `run()` method, providing it with a Page object to run the workflow on.

```javascript
...
(async () => {

    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    await interpret.run(page, { maxRepeats: 10 });

    await browser.close();

})();
```
This way, you can customize the used browser and initial page context from your own code.

For a tutorial on how to handle the browser and page creation, please refer to the [Playwright documentation](https://playwright.dev/docs/api/class-playwright).