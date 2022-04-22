import { WorkflowFile } from "@wbr-project/wbr-interpret";
import { PORT_NUMBER } from "./config";

export const simpleWorkflow : WorkflowFile = {
    'meta': {
        'name': 'Simple testing workflow.',
        'desc': 'Testing workflow with simple conditions.',
    },
    'workflow': [
        {
            'id': 'dismiss-cookies',
            'where': {
                'selectors': ['button.close-cookie-banner'],
            },
            'what': [
                {
                    'action': 'click',
                    'args': ['button.close-cookie-banner'],
                }
            ]
        },
        {
            'id': 'login',
            'where': {
                'selectors': ['input[type=password]', 'input[type=email]'],
            },
            'what': [
                {
                    'action': 'fill',
                    'args': ['input[type=email]', 'email@email.com'],
                },
                {
                    'action': 'fill',
                    'args': ['input[type=password]', 'password'],
                },
                {
                    'action': 'press',
                    'args': ['body','Enter'],
                },
            ]
        },
        {
            'id': 'scrapeData',
            'where': {
                'url' : { $regex: ".*/profile.*" },
            },
            'what': [
                {
                    'action': 'scrape',
                    'args': ['p.data b'],
                }
            ]
        },
        {
            'id': 'initial',
            'where': {
            },
            'what': [
                {
                    'action': 'goto',
                    'args': [`http://localhost:${PORT_NUMBER}`],
                },
            ]
        },
    ]
};