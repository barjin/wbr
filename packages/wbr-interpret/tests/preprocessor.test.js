const Preprocessor = require('../build/preprocessor.js').default;

/**
 * All the preprocessor methods are static, there is no internal 
 * state of the Preprocessor class instance, which could get damaged between the tests.
 */

const preproc = new Preprocessor();

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
            preproc.getParams(workflow))
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

        /** An array of generated parameter names (should be the final output of the `preprocessor.getParams()` method) */
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

            expect(preproc.getParams(object)).toEqual(parameters);
        }
    })
});