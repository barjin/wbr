const Interpret = require('@wbr-project/wbr-interpret').default;
const {chromium} = require('playwright');

const nehnutelnosti_sk = {
	"meta":{
	   "params":[],
	   "name": "Nehnutelnosti.sk scraper (tech demo)",
	   "desc": "Scraper for the nehnutelnosti.sk, Slovak real estate online marketplace."
	},
	"workflow":[
	   {
		  "name": "closePopups",
		  "where":{
			"selectors":[
				"[title=\"SP Consent Message\"]"
			]
		  },
		  "what":[
			 {
				"type":"script",
				"params": "\
				const frame = page.frameLocator(\"[title='SP Consent Message']\");\
				await frame.locator(\"[title='Prijať všetko']\").click();\
				"
			 },
			 {
				 "type": "waitForLoadState"
			 }
		  ]
	   },
	   {
		  "name": "scrapeInfoPage",
		  "where":{
			"selectors":[
				".price--main.paramNo0"
			]
		  },
		  "what":[
			 {
				"type":"waitForLoadState"
			 },
			 {
				 "type": "scrapeSchema",
				 "params": {
					 "id": ".parameter--info :text(\"ID inzerátu\") strong",
					 "title": "h1",
					 "date": ".date",
					 "price": ".price--main.paramNo0",
					 "offerType": ".parameter--info :text(\"Typ\") strong",
					 "type": ".parameter--info :text(\"Druh\") strong",
					 "condition": ".parameter--info :text(\"Stav\") strong",
					 "roomNo": ".additional-features--item :text(\"izieb\") strong:visible",
					 "floorNo": ".additional-features--item :text(\"podlaží\") strong:visible",
					 "utilityArea": ".parameter--info :text(\"Úžit. plocha\") strong",
					 "builtArea": ".parameter--info :text(\"Zast. plocha\") strong",
					 "landArea": ".parameter--info :text(\"Plocha pozemku\") strong",
					 "location": ".top--info-location",
					 "desc": ".text-inner",
					 "broker": ".broker-name",
					 "brokerAddress": ".info--address",
				 }
			 },
			 {
				 "type": "close"
			 }
		  ]
	   },
	   {
		"name": "openDetailsInNewTabs",
		"where":{
			"selectors": ["li + li .component-pagination__arrow-color"]
		},
		"what":[
			{
				"type": "waitForLoadState"
			},
			{
				"type": "script",
				"params": "\
				const links = await page.evaluate(() => \
				{\
					return Array.from(\
						document.querySelectorAll('a.advertisement-item--content__title')\
					).map(a => a.href);\
				});\
				\
				for(let link of links){\
					await new Promise(res => setTimeout(res, 100));\
					const new_page = await page.context().newPage();\
					await new_page.goto(link);\
				}\
				"
			},
			{
				"type":"click",
				"params": "li + li .component-pagination__arrow-color"
			},
			{
				"type":"waitForTimeout",
				"params": 2000
			},
		  ]
	   },
	   {
		"name": "scrape_basic",
		"where":{
			"selectors": ["li + li .component-pagination__arrow-color"]
		},
		"what":[
			{
				"type": "waitForLoadState"
			},
			{
				"type": "scrape"
			},
			{
				"type":"click",
				"params": "li + li .component-pagination__arrow-color"
			},
			{
				"type":"waitForTimeout",
				"params": 2000
			},
		  ]
	   },
	   {
		  "name": "base",
		  "where":{
		  },
		  "what":[
			 {
				"type":"goto",
				"params": {"$param": "url"}
			 },
			 {
				"type":"waitForLoadState"
			 },
			 {
				"type":"waitForTimeout",
				"params": 1000
			 }
		  ]
	   }
	]
};

const SouthCarolinaProbate = {
	"meta":{
	   "params":["county", "firstName", "lastName"],
	   "name": "Southcarolinaprobate.net scraper",
	   "desc": "Scraper for southcarolinaprobate.net, South Carolinian government page."
	},
	"workflow":[
	   {
		  "name": "scrapeInfoPage",
		  "where":{
			"selectors":[
				".price--main.paramNo0"
			]
		  },
		  "what":[
			 {
				"type":"waitForLoadState"
			 },
			 {
				 "type": "scrapeSchema",
				 "params": {
					 "id": ".parameter--info :text(\"ID inzerátu\") strong",
					 "title": "h1",
					 "date": ".date",
					 "price": ".price--main.paramNo0",
					 "offerType": ".parameter--info :text(\"Typ\") strong",
					 "type": ".parameter--info :text(\"Druh\") strong",
					 "condition": ".parameter--info :text(\"Stav\") strong",
					 "roomNo": ".additional-features--item :text(\"izieb\") strong:visible",
					 "floorNo": ".additional-features--item :text(\"podlaží\") strong:visible",
					 "utilityArea": ".parameter--info :text(\"Úžit. plocha\") strong",
					 "builtArea": ".parameter--info :text(\"Zast. plocha\") strong",
					 "landArea": ".parameter--info :text(\"Plocha pozemku\") strong",
					 "location": ".top--info-location",
					 "desc": ".text-inner",
					 "broker": ".broker-name",
					 "brokerAddress": ".info--address",
				 }
			 },
			 {
				 "type": "close"
			 }
		  ]
	   },
	   {
		"name": "openDetailsInNewTabs",
		"where":{
			"selectors": ["li + li .component-pagination__arrow-color"]
		},
		"what":[
			{
				"type": "waitForLoadState"
			},
			{
				"type": "script",
				"params": "\
				const links = await page.evaluate(() => \
				{\
					return Array.from(\
						document.querySelectorAll('a.advertisement-item--content__title')\
					).map(a => a.href);\
				});\
				\
				for(let link of links){\
					await new Promise(res => setTimeout(res, 100));\
					const new_page = await page.context().newPage();\
					await new_page.goto(link);\
				}\
				"
			},
			{
				"type":"click",
				"params": "li + li .component-pagination__arrow-color"
			},
			{
				"type":"waitForTimeout",
				"params": 2000
			},
		  ]
	   },
	   {
		"name": "scrape_basic",
		"where":{
			"selectors": ["tr:not(.HeaderStyle)"]
		},
		"what":[
			{
				"type": "waitForLoadState"
			},
			{
				"type": "scrapeSchema",
				"params": {
					"caseNumber": "#ctl00_ContentPlaceHolder1_cgvCases tr:not(.HeaderStyle) td:nth-child(1):visible",
					"caseName": "#ctl00_ContentPlaceHolder1_cgvCases tr:not(.HeaderStyle) td:nth-child(2):visible",
					"party": "#ctl00_ContentPlaceHolder1_cgvCases tr:not(.HeaderStyle) td:nth-child(3):visible",
					"typeOfCase": "#ctl00_ContentPlaceHolder1_cgvCases tr:not(.HeaderStyle) td:nth-child(4):visible",
					"fillingDate": "#ctl00_ContentPlaceHolder1_cgvCases tr:not(.HeaderStyle) td:nth-child(5):visible",
					"county": "#ctl00_ContentPlaceHolder1_cgvCases tr:not(.HeaderStyle) td:nth-child(6):visible",
					"appointmentDate": "#ctl00_ContentPlaceHolder1_cgvCases tr:not(.HeaderStyle) td:nth-child(7):visible",
					"creditorClaimDue": "#ctl00_ContentPlaceHolder1_cgvCases tr:not(.HeaderStyle) td:nth-child(8):visible",
					"caseStatus": "#ctl00_ContentPlaceHolder1_cgvCases tr:not(.HeaderStyle) td:nth-child(9):visible",
				}
			},
			{
				"type": "click"
			}
		  ]
	   },
	   {
		  "name": "base",
		  "where":{
		  },
		  "what":[
			 {
				"type":"goto",
				"params": "https://www.southcarolinaprobate.net/search/"
			 },
			 {
				"type":"waitForLoadState"
			 },
			 {
				"type":"waitForTimeout",
				"params": 1000
			 },
			 {
				"type":"selectOption",
				"params": ["select",{"$param": "county"}]
			 },
			 {
				"type":"fill",
				"params": ["#ctl00_ContentPlaceHolder1_tbFirstName",{"$param": "firstName"}]
			 },
			 {
				"type":"fill",
				"params": ["#ctl00_ContentPlaceHolder1_tbLastName",{"$param": "lastName"}]
			 },
			 {
				"type":"keyboard.press",
				"params": "Enter"
			 },
			 {
				"type":"waitForLoadState"
			 }
		  ]
	   }
	]
};

(
	async () => {
		const interpret = new Interpret(SouthCarolinaProbate, {serializableCallback: console.log});
		
		const browser = await chromium.launch({headless: false});
		const ctx = await browser.newContext();
		const page = await ctx.newPage();
		
		await interpret.run(page, {
			"county": "Aiken",
			"firstName": "John",
			"lastName": "Smith",
		});

		await browser.close();
	}
)();