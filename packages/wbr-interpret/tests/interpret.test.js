const Interpret = require('../build/interpret').default;

class MockPage {
    constructor({ url, cookies, selectors }){
        this._url = url ?? "";
        this._cookies = cookies ?? {};
        this._selectors = selectors ?? [];
    }

    url(){
        return this._url;
    }

    context(){
        return {
            cookies: (_) => Object.entries(this._cookies)
                .map((cookie) => ({name: cookie[0], value: cookie[1]}))
        }
    }

    isEnabled(selector){
        return this._selectors.includes(selector);
    }
    
    isVisible(selector){
        return this._selectors.includes(selector);
    }
}

const interpret = new Interpret({});

describe('State extraction', () => {
    test('Simple state extraction', () => {
        const workflow = {
            workflow: [
                {
                    where: {
                        selectors: ["button.blue"]
                    },
                    what: []
                }
            ]
        }

        const pageSettings = {
            url: "https://google.com",
            cookies: {
                "logged_in": "true"
            },
            selectors: ["button.blue"]
        };

        const mockPage = new MockPage(pageSettings);

        interpret.getState(mockPage, workflow.workflow).then((state) => {
            expect(state).toEqual(pageSettings);
            }
        );
    });
    
    test('Inclusive state extraction', () => {
        const workflow = [
                {
                    where: {
                        selectors: ["button.blue", "button.yellow"]
                    },
                    what: []
                },
                {
                    where: {
                        url: "https://whatever.co",
                        selectors: ["button.green"]
                    },
                    what: []
                }
        ];

        let pageSettings = {
            url: "https://google.com",
            cookies: {
                "logged_in": "true"
            },
            selectors: ["button.blue"]
        };

        let mockPage = new MockPage(pageSettings);

        interpret.getState(mockPage, workflow).then((state) => {
            expect(state).toEqual(pageSettings);
        });
    });
    
    test('Inclusive state extraction v2', () => {
        const workflow = [
                {
                    where: {
                        selectors: ["button.blue", "button.yellow"]
                    },
                    what: []
                },
                {
                    where: {
                        url: "https://whatever.co",
                        selectors: ["button.green"]
                    },
                    what: []
                }
        ];

        let pageSettings = {
            url: "https://google.com",
            cookies: {
                "logged_in": "true"
            },
            selectors: ["button.blue", "button.green", "button.purple"]
        };

        let mockPage = new MockPage(pageSettings);

        interpret.getState(mockPage, workflow).then((state) => {
            expect(state).toEqual({...pageSettings, selectors:["button.blue","button.green"]});
        });
    });
});