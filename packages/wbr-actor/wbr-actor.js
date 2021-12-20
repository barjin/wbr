'use strict';
const Interpret = require('@wbr-project/wbr-interpret').default;
const Apify = require('apify');

Apify.main(async () => {
    const input = await Apify.getInput();
    console.log(input);
});
