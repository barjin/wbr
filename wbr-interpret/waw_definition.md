
# WAW (Web Automation Workflow) format definition

The following document is considered the official definition of the Web Automation Workflow (waw) format.

**Table of content:**
- [General overview](#general)
- [Where conditions](#the-where-clause)
	- [Basics](#where-conditions---the-basics)
	- [Boolean logic, syntactic sugar](#where-format---boolean-logic)
	- [State persistence](#metaprogramming-state-persistence)
- [What actions](#the-what-clause)
## General

The `.waw`  *(not to be confused with .wav)* file is a textual format used for quick, safe and declarative definition of web automation workflows.

Syntax wise, `.waw` should always be a valid `.json` file. If you are not sure what `.json` is, refer to the [official documentation](https://www.json.org). 

*Note: From now on, the .waw file will be considered a valid JSON file and all the terminology (object, array) will be used in this context.*

On the top level, the workflow file contains a **single array** of so-called "knowledge bits".  These knowledge-bits contain three properties with keys "name", "where", and "what". 

The "name" property is solely for referencing and can be omitted.

Here follows a top-level view of the Workflow file:
```JSON
[
	{
		"name": "login",
		"where": {...},
		"what": [...],
	},
	{
		"where": {...},
		"what": [...],
	},
	{
		...
	},
	...
]
```

## The Where clause
The Where clause should always describe a condition required for the respective What clause to be executed. 

In the basic version without the  "state/metaprogramming" part (more later), we can count with the Markov assumption, i.e. the Where clause always depends only on the current browser state and its "applicability" can be evaluated statically, knowing only the browser's state at the given point.

### Where conditions - The Basics
The `where` clause is an object with various keys. As of now (22.11.2021), only three keys are recognized:
- URL *(string)*
- cookies *(object with string keys/values)*
- selectors *(array of CSS/[Playwright](https://playwright.dev/docs/selectors/) selectors - all of the targetted elements must be present in the page to match this clause)*

An example of a full where clause:
```JSON
		...
		"name": "logout",
		"where": {
			"url": "https://jindrich.bar/",
			"cookies": {
				"uid": "123456"
			},
			"selectors": [
				":text('My Profile')",
				"button.logout"
			]
		},
		...
	},
```

___

*Questions for the readers:*
- Let's say we want to use regex/wildcards for the string values (e.g. URL being `"https://jindrich\.bar/.*"` i.e. any path on the given domain). How to achieve this when the JSON format doesn't support RegEx? Should we try to encode regex into strings somehow?
	- This problem is somewhere solved by using different wildcarding engines (e.g. CSS selectors with their own combining logic, Playwright selectors with their specific *regex enabling* CSS pseudo-classes). This complicates the problem even more, as the final format will most likely have several wildcard syntaxes for different fields. How to address this?
- How to keep track of different value types for different keys? 
	- One solution would be to add Typescript type annotation defining the format of the fields - but how to export TS code to JSON then?
- What if we want to write more complex conditions, i.e. "URL is `abc.xyz` and there is either selector `.login` or  `.signup`"?

## Where format - (Boolean) Logic
The last question from the block above could be addressed more formally, as some kind of formal logic is crucial for a system operating with conditions.
For example, we could take inspiration from the [MongoDB query operators](https://docs.mongodb.com/manual/reference/operator/query/), as shown in the example below:
```JSON
		...
		"where": {
			"$and": [
				"url": "https://jindrich.bar/",
				"$or": [
					"cookies": {
						"uid": "123456"
					},
					"selectors": [
						":text('My Profile')",
						"button.logout"
					]
				]
			]
		},
		...
```
This notation describes a condition where the URL is `"https://jindrich.bar/"` **and** there is **either** the `uid` cookie set on the specified value, **or** there are the selectors present. Please note that the top-level `$and` condition is redundant, as the conjunction of the conditions is the implicit operation.

At this moment, the boolean operators (dollar-sign keys) are allowed only on the level of the condition keys (`URL`, `cookies` etc.)
In case we would like to express something like "there is either selector `login`  **or** selector `#form` **or** `button.signup`", the condition would look something like this:
```JSON
	...
		"$or": [
			"selectors": [
				"login",
			],
			"selectors": [
				"#form",
			],
			"selectors": [
				"button.signup",
			]
		]
	...
```
Note that this might be too wordy for some users. Would it be beneficial to introduce some "right-side" (value, not key-based) shorthands, e.g.:
```JSON
...
	"selectors": {
		"$some": ["login", "#form", "button.signup"]
	},
...
```
This can be statically translated to the previous example and is arguably more readable. However, allowing for the right-side "value" operators would also enable users to recursively chain the operators:
```JSON
...
	"selectors": {
		"$some": [
			"login", 
			{"$all": [".logo:nth-child(2)", "input[type=text]"]},
			"button.signup"
		]
	},
...
```
This might make certain expressions difficult to understand again. Still, this might be a good tradeoff to support those for more experienced users (but will they really use those when they have the visual editor available?)
### Metaprogramming (state persistence)
As mentioned earlier, the interpreter could also have some kind of internal "memory", which would allow for more specific conditions. Some of those could be e.g.
```JSON
where: {
	"$after": "login" // login being a "name" of another knowledge bit
}

where: {
	"$before": "signup"
}

where: {
	"$isset": "debug" // "debug" being an user-defined flag
}
```
## The What clause
In the most basic version, the What clause should contain a sequence of actions, which should be carried out in case the respective Where condition is satisfied.

### What actions - The Basics
The `what` clause is an array of "function" objects. These objects consist of the `type` field, describing a function called and `params` array, providing parameters for the specified function.
```JSON
"what":[
	{
		"type":"goto",
		"params":[
		  "https://jindrich.bar",
		]
	},
	{
		"type":"waitForLoadState",
		"params":[]
	},
	{
		"type":"waitForTimeout",
		"params":[
		1000
		]
	}
]
```
As of now (23.11.2021), these actions correspond to the Playwright's [Page class methods](https://playwright.dev/docs/api/class-page/). All parameters passed must be JSON's native types, i.e. scalars, arrays or objects (no functions etc.).

This should be definitely addressed, as the *Page* methods can work only with the browser's context, but cannot run any code "server-side" - this would be useful, e.g. for bypassing Captcha challenges etc. As mentioned before, JSON can hold only scalars and collections and no executable code. 

Given we support the user-defined flags, the "what" action syntax must also support a way of (un)setting those. 
