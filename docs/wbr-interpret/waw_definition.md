# WAW (Web Automation Workflow) format definition

The following document is considered the official definition of the Web Automation Workflow (waw) format.

For more information about how to run the workflow from your code, please see the [main readme page](../README.md)

**Table of content:**
- [General overview](#general)
- [Meta Header](#meta-header)
- [Workflow](#workflow)
- [Where conditions](#the-where-clause)
	- [Basics](#where-conditions---the-basics)
	- [Boolean logic, syntactic sugar](#where-format---boolean-logic)
	- [State persistence](#metaprogramming-state-persistence)
- [What actions](#the-what-clause)
	- [Custom functions](#custom-functions)

## General

The `.waw`  *(not to be confused with .wav)* file is a textual format used for quick, safe and declarative definition of web automation workflows.

Syntax wise, `.waw` should always be a valid `.json` file. If you are unsure what `.json` is, refer to the [official documentation](https://www.json.org). 

*Note: From now on, the .waw file will be considered a valid JSON file and all the terminology (object, array) will be used in this context.*

On the top level, the workflow file contains an object with two properties - `"meta"` - an object with the [workflow's metadata](#meta-header) (accepted parameters etc.) and `"workflow"` - a **single array** of so-called "knowledge bits". These knowledge-bits contain three properties with keys "name", "where", and "what". 

The "name" property is solely for referencing and can be omitted.

Here follows a top-level view of the Workflow file:

```javascript
{
	"meta" : {
		...
	}
	"workflow": [
		{
			"name": "login",
			"where": {...},
			"what": [...]
		},
		...
	]
]
```

## Meta Header 
As of now (27.12.2021), the `meta` header of the file contains three fields: 
- "name" - `string` - optional, name of the workflow (for easier management)
- "desc" - `string` - optional, text description of the workflow.
- "params" - `string[]` - optional, list of the used workflow's parameter names.
Even though all the metadata is optional, developers are strongly advised to use them for clarity and easier management of the workflows. 
In a parametrized workflow is it mandatory to define the parameters beforehand.

### Example
```json
{
	"name": "Google Maps Scraper",
	"desc": "A blazing fast scraper for Google Maps search results.",
	"params": ["searchquery", "login", "password"]
}
```
## Workflow
The "workflow" part of the workflow object is a single **array** consisting of "rule" objects - where-what pairs describing desired behaviour in different situations. 

For example, let's say we want to click on a button with text "hello" everytime we get on the page "https://example.com/". This behaviour is described with the following snippet:

```json
{
	"where": { "url": "https://example.com" },
	"what": [
		{
			"type": "click",
			"params": "button:text('hello')"
		}
	]
}
```

Now, let's say we want to type "Hello world!" into an input field, whenever we see an input field on the "https://example.com" website:

```json
{
	"where": { 
		"url": "https://example.com",
		"selectors": "input"
	},
	"what": [
		{
			"type": "type",
			"params": [
				"input",
				"Hello world!"
			]
		}
	]
}
```

This should be enough to give you some basic understanding of the WAW Smart Workflow format. In the following sections there are more details about the format and its certain features. 

## The Where Clause
The Where clause describes a condition required for the respective What clause to be executed. 

In the basic version without the  "state/metaprogramming" part (more later), we can count with the Markov assumption, i.e. the Where clause always depends only on the current browser state and its "applicability" can be evaluated statically, knowing only the browser's state at the given point. For this reason, the workflow can be executed on different tabs in parallel (any popup window open from the first passed page is processed as well).

### Where conditions - The Basics
The `where` clause is an object with various keys. As of now (22.11.2021), only three keys are recognized:
- URL *(string)*
- cookies *(object with string keys/values)*
- selectors *(array of CSS/[Playwright](https://playwright.dev/docs/selectors/) selectors - all of the targetted elements must be present in the page to match this clause)*

An example of a full (simple, flat) where clause:

```javascript
	"where": {
		"url": "https://jindrich.bar/",
		"cookies": {
			"uid": "123456"
		},
		"selectors": [
			":text('My Profile')",
			"button.logout"
		]
	}
```

**Important!** Please note that the ordering of the rules in the file is important, as always only the first matched rule gets executed. For this reason, you always want to put the more specific rules in front of the general ones.

### Where conditions - (Boolean) Logic
For a system operating with conditions, is it crucial to have a simple way to work with formal logic.
The WAW format is taking inspiration from from the [MongoDB query operators](https://docs.mongodb.com/manual/reference/operator/query/), as shown in the example below:

```javascript
	"where": {
		"$and": {
			"url": "https://jindrich.bar/",
			"$or": {
				"cookies": {
					"uid": "123456"
				},
				"selectors": [
					":text('My Profile')",
					"button.logout"
				]
			}
		}
	}
```
This notation describes a condition where the URL is `https://jindrich.bar/` **and** there is **either** the `uid` cookie set with the specified value, **or** there are the selectors present. Please note that the top-level `$and` condition is redundant, as the conjunction of the conditions is the implicit operation.

### Metaprogramming (state persistence)
As mentioned earlier, the interpreter also has an internal "memory", which allows for more specific conditions. Some of those could be e.g.
```javascript
where: {
	"$after": "login" // login being a "name" of another knowledge bit
}
```
```javascript
where: {
	"$before": "signup"
}
```
As of now (29.11.2021), the metatags `$before` and `$after` are supported. The meaning behind those is to allow an action to be run only after (or before) another action has been executed.

**[Hacker Tip]** : The `$before` condition specifically can be used to run an action only once (`"name": "self", ..., "$before" : "self"`).

## The What Clause
In the most basic version, the What clause should contain a sequence of actions, which should be carried out in case the respective Where condition is satisfied.

### What actions - The Basics
The `what` clause is an array of "function" objects. These objects consist of the `type` field, describing a function called and `params` - an optional property, scalar or array, providing parameters for the specified function.
```JSON
"what":[
	{
		"type":"goto",
		"params": "https://jindrich.bar"
	},
	{
		"type":"waitForLoadState",
	},
	{
		"type":"waitForTimeout",
		"params": 1000
	}
]
```
As of now (29.11.2021), these actions correspond to the Playwright's [Page class methods](https://playwright.dev/docs/api/class-page/). On top of this, users can use dot notation to access the `Page`'s properties and call their methods (e.g. `page.keyboard.press` etc.) All parameters passed must be JSON's native types, i.e. scalars, arrays or objects (no functions etc.)

### What Clause - Custom functions 

On top of the Playwright's native methods/functions, user can also use some **Interpreter-defined** functions. 

As of now (27.12.2021) these are:
- `screenshot` - this is overriding Playwright's `page.screenshot` method and saves the screenshot using the interpreter's *binary output callback*.
- `scrape` - using a heuristic algorithm, the interpreter tries to find the most important items on the webpage, parses those into a table and pushes the table into the *serializable callback*.
	- user can also specify the item from the webpage to be scraped (using a [Playwright-style selector](https://playwright.dev/docs/selectors)).
- `scrapeSchema` - getting a "row schema definition" with column names and selectors, the interpreter scrapes the data from a webpage into a "curated" table.
	- Example:
	```javascript
	{
		"type": "scrapeSchema",
		"params": {
			"name": ".c-item-title",
			"price": ".c-a-basic-info__price",
			"vin": ".c-vin-info__vin",
			"desc": ".c-car-properties__text"
		}
	}
	```
- `scroll` - scrolls down the webpage for given number of times (default = 1).
- `script` - allows the user to run an arbitrary asynchronous function in the interpreter. The function's body is read as a string from the `params` field and evaluated on the server side (as opposed to the browser side). The function accepts one parameter named `page`, being the current Playwright Page instance.
	- Example:
	```javascript
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
	```
	The example runs a server-side script opening all links on the current page in new tabs with 100 ms delay.
	- Even though it is possible to write the whole workflow using one `script` field, we do not endorse it. The WAW format should allow the developers to write comprehensible, easy to maintain workflow definitions.