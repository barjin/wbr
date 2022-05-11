import {chromium} from 'playwright';

beforeAll(async () => {
    require(`${__dirname}/../../../packages/wbr-cloud/build/cloud.js`);
})

const finalWorkflow = {
    "workflow": [
        {
            "where": {
                "$and": [
                    {
                        "$or": [
                            {
                                "selectors": ["selectors"]
                            }
                        ]
                    },
                ]
            },
            "what": [
                {
                    "action": "goto",
                    "args": [
                        "https://jindrich.bar/"
                    ]
                }
            ]
        },
        {
            "where": {
                "$and": []
            },
            "what": []
        }
    ]
};

test('Editor test', async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:8080');
    
    expect(await page.title()).toBe('wbr-editor');
    
    await page.click('[title="Close"]');
    await page.waitForTimeout(5);
    await page.click('button');
    await page.waitForTimeout(100);
    
    await page.click('.button.primary');
    await page.waitForTimeout(5);
    
    await page.click('.what .button.primary');
    await page.waitForTimeout(5);
    
    await page.click(':text-matches("goto")');
    await page.waitForTimeout(5);
    
    await page.fill('[value="url"]', 'https://jindrich.bar/');
    await page.waitForTimeout(5);
    
    await page.click(':text-matches("Play")');
    await page.waitForTimeout(5000);
    
    const consoleContents = await (await page.$('#console')).innerText();
    expect(consoleContents).toMatch(/\"url\": \"https:\/\/jindrich.bar\/\"/);
    
    await page.click('.dropZone + div.button');
    await page.waitForTimeout(5);
    
    await page.click('.where .button.primary');
    await page.waitForTimeout(5);
    
    await page.click('div[style*=block] > .option:text("$or")');
    await page.waitForTimeout(5);
    
    await page.click('.where .where .where .button.primary');
    await page.waitForTimeout(5);
    
    await page.click('div[style*=block] > .option:text("selectors")');
    await page.waitForTimeout(5);
    
    page.on('download', async (d) => {
        expect(d.suggestedFilename()).toBe('workflow.json');
        const x = await d.createReadStream();
        let string = '';
        x.on('data', (b) => {
            string += b.toString('utf8');
        });
        x.on('end',() => {
            expect(JSON.parse(string)).toEqual(finalWorkflow);
        });
    });
    await page.click(':text("Download")');
    
    await page.waitForTimeout(2500);
});