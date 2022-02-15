const Preprocessor = require('../build/preprocessor.js').default;

describe('Basic tests', () => {
    test('Minimum working example', () => {
        const workflowFile = {
            workflow: []
        }

        expect(Preprocessor.validateWorkflow(workflowFile)).toBeUndefined();
    });

    test('Small workflow', () => {
        const workflowFile = {
            meta: {
                name: "Example workflow",
                desc: "This is an example worklflow"
            },
            workflow: [
                {
                    where: {
                        url: "https://example.org"
                    },
                    what: [
                        {
                            type: "goto",
                            params: "https://jindrich.bar"
                        }
                    ]
                }
            ]
        }

        expect(Preprocessor.validateWorkflow(workflowFile)).toBeUndefined();
    });

    test('Invalid workflow', () => {
        const workflowFile = {
            meta: {
                name: "Example workflow",
                desc: "This is an example worklflow"
            },
            workflow: [
                {
                    where: {
                        url: "https://example.org",
                        cookies: {
                            1: 456
                        }
                    },
                    what: [
                    ]
                }
            ]
        }

        expect(Preprocessor.validateWorkflow(workflowFile)).toBeTruthy();
    });
});

describe('Nesting tests', () => {
    test('Nesting logic - valid', () => {
        const workflowFile = {
            meta: {
                name: "Example workflow",
                desc: "This is an example worklflow"
            },
            workflow: [
                {
                    where: {
                        url: "https://example.org",
                        $and: [
                            {
                                $or: [
                                    {
                                        url: "https://jindrich.bar"
                                    },
                                    {
                                        url: "https://wikipedia.org"
                                    }
                                ]
                            },
                            {
                                $not:
                                    {
                                        url: "https://jindrich.bar"
                                    }
                            },
                        ]
                    },
                    what: [
                    ]
                }
            ]
        }

        expect(Preprocessor.validateWorkflow(workflowFile)).toBeUndefined();
    });

    test('Nesting logic - old (invalid)', () => {
        const workflowFile = {
            meta: {
                name: "Example workflow",
                desc: "This is an example worklflow"
            },
            workflow: [
                {
                    where: {
                        url: "https://example.org",
                        $and: {
                            $or: [
                                    {
                                        url: "https://jindrich.bar"
                                    },
                                    {
                                        url: "https://wikipedia.org"
                                    }
                                ],
                            $not:
                                {
                                    url: "https://jindrich.bar"
                                }
                            },
                    },
                    what: [
                    ]
                }
            ]
        }

        expect(Preprocessor.validateWorkflow(workflowFile)).toBeTruthy();
    });
});