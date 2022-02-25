import { Preprocessor } from '@wbr-project/wbr-interpret';

describe('Basic tests', () => {
    test('Minimum working example', () => {
        const workflowFile = {
            workflow: []
        }

        expect(Preprocessor.validateWorkflow(<any>workflowFile)).toBeUndefined();
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
                            action: "goto",
                            args: ["https://jindrich.bar"]
                        }
                    ]
                }
            ]
        }

        expect(Preprocessor.validateWorkflow(<any>workflowFile)).toBeUndefined();
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

        expect(Preprocessor.validateWorkflow(<any>workflowFile)).toBeTruthy();
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

        expect(Preprocessor.validateWorkflow(<any>workflowFile)).toBeUndefined();
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

        expect(Preprocessor.validateWorkflow(<any>workflowFile)).toBeTruthy();
    });
});