import Interpret from "@wbr-project/wbr-interpret";
import { chromium } from "playwright";
import express from 'express';
import fs from 'fs';
import { PORT_NUMBER, TEST_TIMEOUT } from "./config";
import { simpleWorkflow } from "./workflow";

const app = express();

let retries = 0;

app.get('/profile', (req, res) => {
    res.send(`
    <html>
        <head>
            <title>
                Testing application Login page
            </title>
        </head>
        <body>
            <p class="username"><b>${req.query.email}</b></p>
            <p class="password"><i>${req.query.password}</i></p>
        </body>
    </html>
`);
});

app.get('/test', (req, res) => {
    if(!(req.query.email === 'email@email.com' && req.query.password === 'password')){
        res.sendStatus(403).end();
        return;
    }
    
    if(retries !== 0){
        retries--;
        console.log("Retrying...");
        res.sendStatus(500).end();
        return;
    }
    res.redirect(`/profile?email=${req.query.email}&password=${req.query.password}`);
});

app.get('/loginPage', (req, res) => {
    res.send(fs.readFileSync(`${__dirname}/html/index.html`, 'utf8'));
});

app.get('/', (req, res) => {
  res.redirect('/loginPage');
})

const server = app.listen(PORT_NUMBER, () => {
  console.log(`Example app listening on port ${PORT_NUMBER}`)
});

const checkResult = (result: any) => {
    [result] = result;
    if (!(result['user'] === 'email@email.com' && result['password'] === 'password')) {
        console.error(`Wrong scraping result. (${JSON.stringify(result, null, 2)})`);
        process.exit(2);
    }
}

(async () => {
    await Promise.race([
        (async () => {
            const interpret = new Interpret(simpleWorkflow, {'debug': true, 'serializableCallback': checkResult, 'maxRepeats': 1});
        
            const browser = await chromium.launch();
            const page = await browser.newPage();
        
            await interpret.run(page, {'username': 'email@email.com', 'password': 'password'});
            await page.close();

            await browser.close();
        
            server.close();
        })(),
        (async () => {
            await new Promise((res) => setTimeout(res, TEST_TIMEOUT));
            throw new Error('Test timeout!');
        })(),
    ]);
    process.exit(0);
})();