const Preprocessor = require('../build/preprocessor.js').default;

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