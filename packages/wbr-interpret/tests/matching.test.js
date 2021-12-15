const interpret = require('../build/interpret.js');

const context = {
	url: 'https://apify.com',
	cookies: {
	  hello: 'cookie',
	  extra: 'superfluous',
	},
	selectors: ['abc', 'efg', 'hij'],
  };

test('Pattern matching - Basic, positive', () => {
	let condition = {
		url: 'https://apify.com',
	};
	expect(interpret.applicable(condition, context)).toBeTruthy();
	
	condition = {
		cookies: {
			hello: 'cookie'
		}
	};
	expect(interpret.applicable(condition, context)).toBeTruthy();

	condition = {
		selectors: ['hij', 'abc'] // inverted order shouldn't be a problem
	};
	expect(interpret.applicable(condition, context)).toBeTruthy();
	
	condition = {
		url: 'https://apify.com',
		selectors: ['efg'],
		cookies: {
			extra: 'superfluous',
			hello: 'cookie',
		}
	};
	expect(interpret.applicable(condition, context)).toBeTruthy();
});

test('Pattern matching - Basic, negative', () => {
	let condition = {
		url: 'https://jindrich.bar',
	};
	expect(interpret.applicable(condition, context)).toBeFalsy();
	
	condition = {
		cookies: {
			hello: 'cookie',
			nonexisting: 'cookie',
		},
	};
	expect(interpret.applicable(condition, context)).toBeFalsy();

	condition = {
		selectors: ['hij', 'abc', 'this_one_is_not_there']
	};
	expect(interpret.applicable(condition, context)).toBeFalsy();
	
	condition = {
		url: 'https://apify.com',
		selectors: ['efg'],
		cookies: {
			extra: 'superfluous',
			hello: 'cookie',
		},
		extraKey: 'causingTrouble'
	};
	expect(interpret.applicable(condition, context)).toBeFalsy();
});

test('Pattern matching - Logic', () => {
	let condition = {
		$or: [
			{url: 'https://jindrich.bar'},
			{url: 'https://apify.com'},
		]
	};
	expect(interpret.applicable(condition, context)).toBeTruthy();

	condition = {
		$or: {
			url: 'https://jindrich.bar',
			selectors: ['abc', 'efg']
		}
	};
	expect(interpret.applicable(condition, context)).toBeTruthy();
	
	condition = {
		$and: [
			{url: 'https://jindrich.bar'},
			{url: 'https://apify.com'},
		]
	};
	expect(interpret.applicable(condition, context)).toBeFalsy();
	
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
})