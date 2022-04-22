import { Preprocessor, WorkflowFile } from "@wbr-project/wbr-interpret";

type Where = WorkflowFile['workflow'][number]['where'];

const randString = () => Math.random().toString(36).substring(Math.floor(Math.random() * 7) + 2);

const randomValues = [
    "sdfsdfg",
    "adfghj",
    "123465",
    "qwertyuio",
    "123sdfg4d;'\\[p"
]

const hideInRandomStructure = (objectToHide: any, depth: number) : Record<string,any> | any => {
    if(depth == 0){
        return {[randString()]: objectToHide};
    };

    const neigh = randomValues.slice(Math.floor((Math.random()*randomValues.length)+1));
    
    return {
        ...neigh.reduce((p: Record<string,any>,v: any) => ({...p, 
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
                        url: { $param: "url" },
                    },
                    what: [
                        {
                            type: "waitForTimeout",
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
            Preprocessor.getParams(<any>workflow))
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
            workflow: params.reduce((p: Where[], x: string) => [...p, hideInRandomStructure({$param: x}, DEPTH)], [])
        };

        return {
            parameters: params,
            object: object
        }
    }

    test('Exhaustive dynamic param extraction', () => {
        const TEST_SIZE = 50;
        const STEP_SIZE = 5;
        
        for(let i = 0; i < TEST_SIZE; i++){
            const {parameters, object} = generateRandomObject(i*STEP_SIZE);

            expect(Preprocessor.getParams(<any>object)).toEqual(parameters);
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
            Preprocessor.extractSelectors(<any>workflow.workflow))
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
            Preprocessor.extractSelectors(<any>workflow.workflow))
                .toEqual(["test_selector", "test_selector_2", "test_selector_3"]
        );
	});
});