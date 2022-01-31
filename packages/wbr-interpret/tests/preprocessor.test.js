const Preprocessor = require('../build/preprocessor.js').default;

/**
 * All the Preprocessor methods are static, there is no internal 
 * state of the Preprocessor class instance, which could get damaged between the tests.
 */

const randString = () => Math.random().toString(36).substring(Math.floor(Math.random() * 7) + 2);

const randomValues = [
    "sdfsdfg",
    "adfghj",
    "123465",
    "qwertyuio",
    "123sdfg4d;'\\[p"
]

const hideInRandomStructure = (objectToHide, depth) => {
    if(depth == 0){
        return {[randString()]: objectToHide};
    };

    const neigh = randomValues.slice(Math.floor((Math.random()*randomValues.length)+1));
    
    return {
        ...neigh.reduce((p,v) => ({...p, 
            [v]: hideInRandomStructure(v, depth - 1)
        }), {}),
        [randString()]: hideInRandomStructure(objectToHide, depth - 1)
    }
};

describe('Preprocessor parameter extraction', () => {
	test('Basic param extraction test', () => {
        const workflow = {
            meta: {},
            workflow:[
                {
                    where: {
                        url: {
                            $param: 'url'
                        }
                    },
                    what: [
                        {
                            type: "abc",
                            params: [
                                { $param: "firstParam" },
                                { $param: "sndParam" }
                            ]
                        }
                    ]
                }
            ]
        }

        expect(
            Preprocessor.getParams(workflow))
                .toEqual(['url', 'firstParam', 'sndParam']
        );
	});

    /**
     * Generates a random structure with embedded `{$param: parameter}` objects
     * @returns A randomized object with "parameters"
    */
    const generateRandomObject = (numParameters = 10) => {
        /**
         * Generates a random alphanumeric string.
         * @returns A random alphanumeric string.
         */

        /** An array of generated parameter names (should be the final output of the `Preprocessor.getParams()` method) */
        let params = [];
        for(let i = 0; i < numParameters; i++){
            params.push(randString());
        }

        const DEPTH = 3

        const object = {
            workflow: params.reduce((p,x) => [...p, hideInRandomStructure({$param: x}, DEPTH)], [])
        };

        return {
            parameters: params,
            object: object
        }
    }

    test('Exhaustive dynamic param extraction', () => {
        TEST_SIZE = 50;
        STEP_SIZE = 5;
        
        for(let i = 0; i < TEST_SIZE; i++){
            const {parameters, object} = generateRandomObject(i*STEP_SIZE);

            expect(Preprocessor.getParams(object)).toEqual(parameters);
        }
    })
});

describe('Selector extraction', () => {
	test('Single selector extraction', () => {
        const workflow = {
            meta: {},
            workflow:[
                {
                    where: {
                        selectors: "test_selector"
                    },
                    what: [
                        {
                            selectors: ["not_this_one!"]
                        },
                        {
                            selectors: "nor_this_one"
                        }
                    ]
                },
                {
                    where: {
                        selectors: "test_selector"
                    },
                    what: [
                        {
                            selectors: ["not_this_one!"]
                        },
                        {
                            selectors: "nor_this_one"
                        }
                    ]
                }
            ]
        }

        expect(
            Preprocessor.extractSelectors(workflow.workflow))
                .toEqual(['test_selector']
        );
	});

	test('Selector array extraction', () => {
        const workflow = {
            meta: {},
            workflow:[
                {
                    where: {
                        selectors: ["test_selector", "test_selector_2"]
                    },
                    what: [
                    ]
                }
            ]
        }

        expect(
            Preprocessor.extractSelectors(workflow.workflow))
                .toEqual(["test_selector", "test_selector_2"]
        );
	});

    test('(Nested) logic selector extraction', () => {
        const workflow = {
            meta: {},
            workflow:[
                {
                    where: {
                        $or: {
                            url: "https://example.org",
                            selectors: ["test_selector", "test_selector_2"],
                            $none: {
                                selectors: ["test_selector_3"],
                                cookies: {
                                    "selectors": "notthisone"
                                }
                            }
                        }
                    },
                    what: [
                    ]
                },
                {
                    where: {
                        $or: {
                            url: "https://example.org",
                            selectors: ["test_selector", "test_selector_2"],
                            $and: {
                                selectors: ["test_selector_3"],
                                cookies: {
                                    "selectors": "notthisone"
                                }
                            }
                        }
                    },
                    what: [
                    ]
                }
            ]
        }

        expect(
            Preprocessor.extractSelectors(workflow.workflow))
                .toEqual(["test_selector", "test_selector_2", "test_selector_3"]
        );
	});
});

describe('Parameter initialization', () => {
	test('Simple parameter initialization', () => {
        const workflow = {
            meta: {},
            workflow:[
                {
                    where: {
                        url: {
                            $param: "first_parameter"
                        },
                        cookies : {
                            $param: "object_parameter"
                        },
                        $or: {
                            $none:{
                                $and: {
                                    selectors: { $param: "array_parameter" }
                                }
                            }
                        }
                    },
                },
            ]
        }

        expect(
            Preprocessor.initWorkflow(workflow.workflow, {
                "first_parameter": 123, 
                "object_parameter": {"cookie": "xyz"}, 
                "array_parameter": [1,2,3]
            })).toEqual([
                {
                    where: {
                        url: 123,
                        cookies: {cookie: "xyz"},
                        $or: {
                            $none:{
                                $and: {
                                    selectors: [1,2,3]
                                }
                            }
                        }
                    },
                }
            ]);
	});

    test('Workflow persistence', () => {
        const workflow = {
            meta: {},
            workflow:[
                {
                    where: {
                        url: {
                            $param: "first_parameter"
                        },
                        cookies : {
                            $param: "object_parameter"
                        },
                        $or: {
                            $none:{
                                $and: {
                                    selectors: { $param: "array_parameter" }
                                }
                            }
                        }
                    },
                },
            ]
        }

        Preprocessor.initWorkflow(workflow.workflow, {
            "first_parameter": 123, 
            "object_parameter": {"cookie": "xyz"}, 
            "array_parameter": [1,2,3]
        });

        expect(workflow).toEqual({
            meta: {},
            workflow:[
                {
                    where: {
                        url: {
                            $param: "first_parameter"
                        },
                        cookies : {
                            $param: "object_parameter"
                        },
                        $or: {
                            $none:{
                                $and: {
                                    selectors: { $param: "array_parameter" }
                                }
                            }
                        }
                    },
                },
            ]
        });
    });
})

describe('Regex initialization', () => {
	test('Simple regex initialization', () => {
        const workflow = {
            meta: {},
            workflow:[
                {
                    where: {
                        url: {
                            $regex: "^https://.*"
                        }
                    },
                },
            ]
        }

        const initializedWorkflow = Preprocessor.initWorkflow(workflow.workflow);

        expect(
            initializedWorkflow[0].where.url.test("https://jindrich.bar")
        ).toBeTruthy();
        
        expect(
            initializedWorkflow[0].where.url.test("http://example.org")
        ).toBeFalsy();
	});

    test('Workflow persistence', () => {
        const workflow = {
            meta: {},
            workflow:[
                {
                    where: {
                        url: {
                            $param: "first_parameter"
                        },
                        cookies : {
                            $param: "object_parameter"
                        },
                        $or: {
                            $none:{
                                $and: {
                                    selectors: { $param: "array_parameter" }
                                }
                            }
                        }
                    },
                },
            ]
        }

        Preprocessor.initWorkflow(workflow.workflow, {
            "first_parameter": 123, 
            "object_parameter": {"cookie": "xyz"}, 
            "array_parameter": [1,2,3]
        });

        expect(workflow).toEqual({
            meta: {},
            workflow:[
                {
                    where: {
                        url: {
                            $param: "first_parameter"
                        },
                        cookies : {
                            $param: "object_parameter"
                        },
                        $or: {
                            $none:{
                                $and: {
                                    selectors: { $param: "array_parameter" }
                                }
                            }
                        }
                    },
                },
            ]
        });
    });
})