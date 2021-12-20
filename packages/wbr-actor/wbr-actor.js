'use strict';
const process = require('process');
const Interpret = require('@wbr-project/wbr-interpret').default;

console.log(process.env.INPUT);

const inter = new Interpret({},{});
inter.run();