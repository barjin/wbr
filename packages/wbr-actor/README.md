# `wbr-actor`

Wrapper code for the wbr-interpret package to allow for seamless integration with the Apify platform.

## Usage

Using this actor, the waw (web automation workflow) format can be truly (A/a)pified.
Simply start this actor via Apify Platform using the web environment or a POST request with the workflow file.

## Input
This actor receives a JSON object with the workflow itself and optionally a list of parameter values. 

### Example
```json
{
	"workflow": {
		"meta": {
			"name": "Scrape anything!",
			"desc": "The name speaks for itself.",
		},
		"workflow": [
			{
				"name": "acceptCookies",
				"where":{
					"selectors":[
						"button:text-matches(\"(accept|agree|allow)\", \"i\")"
					]
				},
				"what":[
					{
						"action":"click",
						"args":[
							"button:text-matches(\"(accept|agree|allow)\", \"i\")"
						]
					}
				]
			}
	   		...
		]
	},
	"params": {
		"url": "https://apify.com",
		"selector": "a.list_item"
	}
}
```
## Output
The output of this actor depends on the workflow given - all output data are stored in the current run dataset and key-value store.