import './App.css';
import Workflow from './Workflow';

import Screen from './components/tiny/Player';

const sauto : any = {
	"meta":{
	   "name": "SAuto scraper",
	   "desc": "Scraper for the sauto.cz online car dealership. It shows pagination as well as the scraping capabilities."
	},
	"workflow":[
	   {
		  "id": "closePopups",
		  "where":{
			"selectors":[
				"[class*=popup] button[class*=close]"
			]
		  },
		  "what":[
			 {
				"action":"click",
				"args": ["[class*=popup] button[class*=close]"]
			 },
			 {
				 "action": "waitForLoadState"
			 }
		  ]
	   },
	   {
		"id": "paginateAndScrape",
		"where":{
			"selectors": [":text-matches(\"Další stránka\")"]
		},
		"what":[
			{
				"action": "waitForLoadState"
			},
			{
				"action": "scrape"
			},
			{
				"action":"click",
				"args": [":text-matches(\"Další stránka\")"]
			},
			{
				"action": "waitForLoadState"
			},
			{
				"action":"waitForTimeout",
				"args": [5000]
			}
		  ]
	   },
	   {
		  "id": "base",
		  "where":{
		  },
		  "what":[
			 {
				"action":"goto",
				"args": ["https://www.sauto.cz/"]
			 },
			 {
				"action":"waitForLoadState"
			 },
			 {
				"action":"waitForTimeout",
				"args": [3000]
			 },
			 {
				"action":"click",
				"args": ["a :text-matches(\"Zobrazit\",\"i\")"]
			 },
			 {
				"action":"waitForLoadState"
			 },
			 {
				"action":"waitForTimeout",
				"args": [7000]
			 }
		  ]
	   }
	]
 };

const workflow : any = 
{
  meta:{
    name: "Test workflow",
    desc: "Test workflow description."
  },
  workflow: [
   {
     id:"first",
     where:{
       $and: [
         {
           url: 'https://jindrich.bar/'
         },
       ]
     },
     what: [
       {
         "action":"goto",
         "args": ["https://example.org/"]
       }
     ]
   },
   {
     id:"second",
     where:{
     },
     what: [
       {
         "action": "goto",
         "args": ["https://jindrich.bar/"]
       }
     ]
   }
 ]
};

const nehnutelnosti = {
  "meta": {
      "name": "Nehnutelnosti.sk scraper (tech demo)",
      "desc": "Scraper for the nehnutelnosti.sk, Slovak real estate online marketplace."
  },
  "workflow": [
      {
          "id": "closePopups",
          "where": {
              "selectors": [
                  "[title=\"SP Consent Message\"]"
              ]
          },
          "what": [
              {
                  "action": "script",
                  "args": ["\t\t\t\tconst frame = page.frameLocator(\"[title='SP Consent Message']\");\t\t\t\tawait frame.locator(\"[title='Prijať všetko']\").click();\t\t\t\t"]
              },
              {
                  "action": "waitForLoadState"
              }
          ]
      },
      {
          "id": "scrapeInfoPage",
          "where": {
              "selectors": [
                  ".price--main.paramNo0"
              ]
          },
          "what": [
              {
                  "action": "waitForLoadState"
              },
              {
                  "action": "scrapeSchema",
                  "args": [{
                      "id": ".parameter--info :text(\"ID inzerátu\") strong",
                      "title": "h1",
                      "date": ".date",
                      "price": ".price--main.paramNo0",
                      "offerType": ".parameter--info :text(\"Typ\") strong",
                      "action": ".parameter--info :text(\"Druh\") strong",
                      "condition": ".parameter--info :text(\"Stav\") strong",
                      "roomNo": ".additional-features--item :text(\"izieb\") strong:visible",
                      "floorNo": ".additional-features--item :text(\"podlaží\") strong:visible",
                      "utilityArea": ".parameter--info :text(\"Úžit. plocha\") strong",
                      "builtArea": ".parameter--info :text(\"Zast. plocha\") strong",
                      "landArea": ".parameter--info :text(\"Plocha pozemku\") strong",
                      "location": ".top--info-location",
                      "desc": ".text-inner",
                      "broker": ".broker-name",
                      "brokerAddress": ".info--address"
                  }]
              },
              {
                  "action": "close"
              }
          ]
      },
      {
          "id": "openDetailsInNewTabs",
          "where": {
              "selectors": [
                  "li + li .component-pagination__arrow-color"
              ]
          },
          "what": [
              {
                  "action": "waitForLoadState"
              },
              {
                  "action": "enqueueLinks",
                  "args": ["a.advertisement-item--content__title"]
              },
              {
                  "action": "close"
              }
          ]
      },
      {
          "id": "scrape_basic",
          "where": {
              "selectors": [
                  "li + li .component-pagination__arrow-color"
              ]
          },
          "what": [
              {
                  "action": "waitForLoadState"
              },
              {
                  "action": "scrape"
              },
              {
                  "action": "click",
                  "args": ["li + li .component-pagination__arrow-color"]
              },
              {
                  "action": "waitForTimeout",
                  "args": [2000]
              }
          ]
      },
      {
          "id": "base",
          "where": {},
          "what": [
              {
                  "action": "goto",
                  "args": ["https://www.nehnutelnosti.sk/bratislava/"]
              },
              {
                  "action": "waitForLoadState"
              },
              {
                  "action": "waitForTimeout",
                  "args": [1000]
              }
          ]
      }
  ]
}

const test = {
    "meta": {
    },
    "workflow": [
        {
            "id": "1",
            "where": {},
            "what": [],
        },
        {
            "id": "2",
            "where": {},
            "what": []
        },
        {
            "id": "3",
            "where": {},
            "what": [],
        },
        {
            "id": "4",
            "where": {},
            "what": []
        },
    ],
}

function App() {
  return (
    <div className="App">
        <Workflow workflow={nehnutelnosti as any}/>
        <Screen />
    </div>
  );
}

export default App;
