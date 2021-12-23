const Interpret = require('@wbr-project/wbr-interpret').default;
const {chromium} = require('playwright');

const sauto_workflow = {
	"meta":{
	   "params":[],
	   "name": "SAuto scraper",
	   "desc": "Scraper for the sauto.cz online car dealership. It shows pagination as well as the scraping capabilities."
	},
	"workflow":[
	   {
		  "name": "closePopups",
		  "where":{
			"selectors":[
				"[class*=popup] button[class*=close]"
			]
		  },
		  "what":[
			 {
				"type":"click",
				"params": "[class*=popup] button[class*=close]"
			 },
			 {
				 "type": "waitForLoadState"
			 },
			 {}
		  ]
	   },
	   {
		  "name": "scrapeInfoPage",
		  "where":{
			"selectors":[
				".c-a-basic-info"
			]
		  },
		  "what":[
			 {
				"type":"waitForLoadState"
			 },
			 {
				 "type": "scrapeSchema",
				 "params": {
					 "name": ".c-item-title",
					 "price": ".c-a-basic-info__price",
					 "vin": ".c-vin-info__vin",
					 "desc": ".c-car-properties__text"
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
			"selectors": [":text-matches(\"Další stránka\")"]
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
						document.querySelectorAll('a.c-item__link.sds-surface--clickable')\
					).map(a => a.href);\
				});\
				\
				for(let link of links){\
					await new Promise(res => setTimeout(res, 100));\
					await page.context().newPage().then(page => page.goto(link))\
				}\
				"
			},
			{
				"type":"click",
				"params": ":text-matches(\"Další stránka\")"
			},
			{
				"type":"waitForTimeout",
				"params": "3000"
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
				"params": "https://www.sauto.cz/inzerce/osobni"
			 },
			 {
				"type":"waitForLoadState"
			 },
			 {
				"type":"waitForTimeout",
				"params": 3000
			 }
		  ]
	   }
	]
};

const steam_workflow = {
	"meta":{
	   "params":[],
	   "name": "Steam Specials Scraper",
	   "desc": "Scraper for Steam Specials. Shows usage of customized autoscraper."
	},
	"workflow":[
	   {
		  "name": "acceptCookies",
		  "where":{
			 "selectors":[
				"button:text-matches(\"(accept|agree|souhlasím|allow|přijmout)\", \"i\")"
			 ]
		  },
		  "what":[
			 {
				"type":"click",
				"params":[
				   "button:text-matches(\"(accept|agree|souhlasím|allow|přijmout)\", \"i\")"
				]
			 }
		  ]
	   },
	   {
		"name": "waitForAsyncLoad",
		"where":{
			"selectors": [
				":text-matches(\"(searching|loading)\",\"i\")"
			]
		},
		"what": [
			{
				"type": "waitForTimeout",
				"params": [
					2000
				]
			}
		]
	   },
	   {
		"name": "Scrape",
		  "where":{
			 "selectors":[
				"#TopSellers_btn_next"
			 ]
		  },
		  "what":[
			 {
				"type": "scrapeSchema",
				"params": {
					"name": ".peeking_carousel .tab_item_name:visible",
					"percentage": ".peeking_carousel .discount_pct:visible",
					"original": ".peeking_carousel .discount_original_price:visible",
					"discount": ".peeking_carousel .discount_final_price:visible",
				}
			 },
			 {
				"type": "click",
				"params":"#TopSellers_btn_next"
			 },
			 {
				"type":"waitForLoadState"
			 },
			 {
				"type":"waitForTimeout",
				"params":[
				   1000
				]
			 }
		  ]
	   },
	   {
		  "name": "navigateToPage",
		  "where":{
			 "url": "about:blank"
		  },
		  "what":[
			 {
				"type":"goto",
				"params":"https://store.steampowered.com/specials/#p=0&tab=TopSellers"
			 },
			 {
				"type":"waitForLoadState"
			 },
			 {
				"type":"waitForTimeout",
				"params":[
				   3000
				]
			 }
		  ]
	   }
	]
 };

(
	async () => {
		const interpret = new Interpret(sauto_workflow, {serializableCallback: console.log});
		
		const browser = await chromium.launch({headless: false});
		const ctx = await browser.newContext();
		const page = await ctx.newPage();
		
		await interpret.run(page);

		await browser.close();
	}
)();