/**
 * Series of unit tests testing the interpreter's pattern matching and logic.
 */

const Interpreter = require('../build/index').default;
const Preprocessor = require('../build/preprocessor').default;

const context = {
	url: 'https://apify.com',
	cookies: {
	  hello: 'cookie',
	  extra: 'superfluous',
	},
	selectors: ['abc', 'efg', 'hij'],
  };

describe('Basic matching (inclusion)', () => {
	const interpret = new Interpreter({});

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
	
		conditions.forEach(condition => expect(interpret.applicable(condition, context)).toBeTruthy());
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
	
		conditions.forEach(condition => expect(interpret.applicable(condition, context)).toBeFalsy());
	});
});

describe('Advanced matching (logic, state)', () => {
	const interpret = new Interpreter({});

	test('Basic Logic Operators', () => {
		const conditions = [
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
					$or: {
						url: 'https://jindrich.bar',
						selectors: ['abc', 'efg']
					}
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
					$none: {
						url: 'https://jindrich.bar',
						selectors: ['123', 'efg']
					}
				},
				res: true
			},			
			{
				cond: {
					$none: {
						url: 'https://apify.com',
						cookies: {
							hello: 'not_expected_value'
						}
					}
				},
				res: false
			},			
		];
		
		conditions.forEach(({cond, res}) => 
		expect(interpret.applicable(cond, context)).toBe(res));

	});

	test('Nested Logic Operators', () => {
		condition = {
			$or: {
				url: 'https://jindrich.bar',
				$and: {
					url: 'https://apify.com',
					cookies: {
						hello: 'cookie',
					}
				}
			}
		};
		expect(interpret.applicable(condition, context)).toBeTruthy();
		
		condition = {
			$and: [
				{
					$or: {
						url: 'https://jindrich.bar', // this does not match
						cookies: {
							hello: 'cookie', // this does
						}
					}
				},
				{
					$or: {
						selectors: ['abc', 'efg', 'not_in_the_current_context'],
						$none: { // this rule gets matched ($none($and(X))) means "Match if there is at least one failing match in X"
							$and: {
								...context,
								url: "https://abcd.xyz"
							}
						}
					}
				}
			]
		};
		expect(interpret.applicable(condition, context)).toBeTruthy();
	});

	test('State (before/after)', () => {
		const conditions = [
		{
			cond: {
				$after: 'login',
				$before: 'logout'
			},
			state: ['login'],
			result: true
		},
		{
			cond: {
				$after: 'signup',
				$after: 'login'
			},
			state: ['signup'],
			result: false
		},
		{
			cond: {
				$or: {
					url: 'https://jindrich.bar', // this does not match
					cookies: {
						hello: 'nonexistent', // this doesn't either
					},
					$before: 'signup' // this does
				}
			},
			state: ['signup'],
			result: true
		}
		];
	
		conditions.forEach(({cond, state, result}) => 
			expect(interpret.applicable(cond, context, state)).toBe(result));
	});	
	
	test('RegEx', () => {
		const conditions = [
			{
				cond: {
					url: {$regex: "^https://.*$"}
				},
				result: true
			},
			{
				cond: {
					url: {$regex: "falsefalsefalse"}
				},
				result: false
			},
			{
				cond: {
					url: {$regex: "https?://a.*"},
					cookies: {
						hello: {$regex: "(cookie|COOKIE)"}	
					},
				},
				result: true
			},
			{
				cond: {
					url: {$regex: "https?://a.*"},
					cookies: {
						hello: {$regex: ".*"},
						extra: {$regex: "(super|hyper|extra)fluous"}
					},
				},
				result: true
			},
			{
				cond: {
					url: {$regex: "https?://a.*"},
					cookies: {
						hello: {$regex: ".*"},
						extra: {$regex: "(super|hyper|extra)fluous"}
					},
				},
				result: true
			},
			{
				cond: {
					$after: {$regex: "cookieDismiss"},
					$before: {$regex: "login\\d+"}
				},
				result: false,
				state: ["cookieDismiss", "login123"]
			},
			{
				cond: {
					$after: {$regex: "^[a-zA-Z]+\@[a-zA-Z]+\\.(cz|sk|uk)"}, // a (not so beefy) email regex
				},
				result: true,
				state: ["regexTest@seznam.cz"]
			},
		];
	
		conditions.forEach(({cond, result, state}) => {
			cond = Preprocessor.initWorkflow(cond);
			expect(interpret.applicable(cond, context, state)).toBe(result);
		})
	});	
});