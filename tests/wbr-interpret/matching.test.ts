/**
 * Series of unit tests testing the interpreter's pattern matching and logic.
 */

import Interpret, { Preprocessor, WorkflowFile } from "@wbr-project/wbr-interpret";

type Where = WorkflowFile['workflow'][number]['where'];

const context = {
	url: 'https://apify.com',
	cookies: {
	  hello: 'cookie',
	  extra: 'superfluous',
	},
	selectors: ['abc', 'efg', 'hij'],
  };

type ConditionArray = {cond : Where, state?: string[], res: boolean }[];

describe('Basic matching (inclusion)', () => {
	const interpret = new Interpret({workflow:[]});

	test('Basic, positive', () => {
		const conditions = [{
			url: 'https://apify.com',
		},
		{
			selectors: ['hij', 'abc'] // inverted order shouldn't be a problem
		},
		{
			url: 'https://apify.com',
			selectors: ['efg'],
			cookies: {
				extra: 'superfluous',
				hello: 'cookie',
			}
		},
		{
			...context
		},
	];
	
		conditions.forEach(condition => expect(interpret['applicable'](condition, context)).toBeTruthy());
	});
	
	test('Basic, negative', () => {
		const conditions = [{
			url: 'https://jindrich.bar',
		},
		{
			cookies: {
				hello: 'cookie',
				nonexisting: 'cookie',
			},
		},
		{
			...context,
			extraKey: 'causingTrouble'
		},
		{
			selectors: ['hij', 'abc', 'this_one_is_not_there']
		}
		];
	
		conditions.forEach(condition => expect(interpret['applicable'](condition, context)).toBeFalsy());
	});
});

describe('Advanced matching (logic, state)', () => {

	const interpret = new Interpret({workflow:[]});

	test('Basic Logic Operators', () => {
		const conditions : ConditionArray = [
			{
				cond: {
					$or: [
						{url: 'https://jindrich.bar'},
						{url: 'https://apify.com'},
					]
				},
				res: true
			},
			{
				cond: {
					$or: [
						{url: 'https://jindrich.bar'},
						{selectors: ['abc', 'efg']}
					]
				},
				res: true
			},
			{
				cond: {
					$and: [
						{url: 'https://jindrich.bar'},
						{url: 'https://apify.com'},
					]
				},
				res: false
			},	
			{
				cond: {
					$not: {
						$or: [
							{url: 'https://apify.com'},
							{cookies: {
								hello: 'not_expected_value'
							}},
						]
					}
				},
				res: false
			},			
		];
		
		conditions.forEach(({cond, res}) => 
		expect(interpret['applicable'](cond, context)).toBe(res));

	});

	test('Nested Logic Operators', () => {
		let condition : Where = {
			$or: [
				{url: 'https://jindrich.bar'},
				{
					$and: [
						{url: 'https://apify.com'},
						{cookies: {
							hello: 'cookie',
						}}
					]
				}
			]
		};
		expect(interpret['applicable'](condition, context)).toBeTruthy();
		
		condition = {
			$and: [
				{
					$or: [{
						url: 'https://jindrich.bar', // this does not match
					},
					{
						cookies: {
							hello: 'cookie', // this does
						}
					}]
				},
				{
					$or: [{
						selectors: ['abc', 'efg', 'not_in_the_current_context'],
					},
					{
						$not: { // this rule gets matched ($not($and(X))) means "Match if there is at least one failing match in X"
							$and: [{
								...context,
								url: "https://abcd.xyz"
							}]
						}
					}]
				}
			]
		};
		expect(interpret['applicable'](condition, context)).toBeTruthy();
	});

	test('State (before/after)', () => {
		const conditions : ConditionArray = [
		{
			cond: {
				$after: 'login',
				$before: 'logout'
			},
			state: ['login'],
			res: true
		},
		{
			cond: {
				$before: 'signup',
				$after: 'login'
			},
			state: ['signup'],
			res: false
		},
		{
			cond: {
				$or: [
					{
						url: 'https://jindrich.bar', // this does not match
					},
					{
						cookies: {
							hello: 'nonexistent', // this doesn't either
						}
					},
					{
						$before: 'signup' // this does
					}
				]
			},
			state: ['signup'],
			res: true
		}
		];
	
		conditions.forEach(({cond, state, res}) => 
			expect(interpret['applicable'](cond, context, state)).toBe(res));
	});	
	
	test('RegEx', () => {
		const conditions : ConditionArray = [
			{
				cond: {
					url: {$regex: "^https://.*$"}
				},
				res: true
			},
			{
				cond: {
					url: {$regex: "falsefalsefalse"}
				},
				res: false
			},
			{
				cond: {
					url: {$regex: "https?://a.*"},
					cookies: {
						hello: {$regex: "(cookie|COOKIE)"}	
					},
				},
				res: true
			},
			{
				cond: {
					url: {$regex: "https?://a.*"},
					cookies: {
						hello: {$regex: ".*"},
						extra: {$regex: "(super|hyper|extra)fluous"}
					},
				},
				res: true
			},
			{
				cond: {
					url: {$regex: "https?://a.*"},
					cookies: {
						hello: {$regex: ".*"},
						extra: {$regex: "(super|hyper|extra)fluous"}
					},
				},
				res: true
			},
			{
				cond: {
					$after: {$regex: "cookieDismiss"},
					$before: {$regex: "login\\d+"}
				},
				res: false,
				state: ["cookieDismiss", "login123"]
			},
			{
				cond: {
					$after: {$regex: "^[a-zA-Z]+\@[a-zA-Z]+\\.(cz|sk|uk)"}, // a (not so beefy) email regex
				},
				res: true,
				state: ["regexTest@seznam.cz"]
			},
		];
	
		conditions.forEach(({cond, res, state}) => {
			const initializedCond = Preprocessor.initWorkflow(<any>cond);
			expect(interpret['applicable'](initializedCond, context, state)).toBe(res);
		})
	});	
});