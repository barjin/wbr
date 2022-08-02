'use strict';
const Interpret = require('wbr').default;
const Apify = require('apify');
const {chromium} = require('playwright');

Apify.main(async () => {
    const input = await Apify.getInput();
    
    if(!input || !('workflow' in input)){
        throw new SyntaxError('Missing workflow. Nothing to run, stopping...');
    }

    const dataset = await Apify.openDataset();
    const kvs = await Apify.openKeyValueStore();

    const interpreter = new Interpret(input.workflow, 
    {
      serializableCallback: (row) => dataset.pushData(row),
      binaryCallback: (data, mimeType) => kvs.setValue(`${Date.now()}`, data, { contentType: mimeType }),
    });

    const browser = await chromium.launch(process.env.DOCKER
        ? { executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox', '--disable-gpu'] }
        : { });
  
    const ctx = await browser.newContext({ locale: 'en-GB' });
    const page = await ctx.newPage();

    await interpreter.run(page, input.params);

});
