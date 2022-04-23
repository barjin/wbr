import { WorkflowFile } from "@wbr-project/wbr-interpret";
import { PORT_NUMBER } from "./config";

export const simpleWorkflow : WorkflowFile = {
    'meta': {
        'name': 'Advanced testing workflow.',
        'desc': 'Testing workflow with advanced constructs.',
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
                    'args': ['input[type=email]', {"$param": "username"}],
                },
                {
                    'action': 'fill',
                    'args': ['input[type=password]', {"$param": "password"}],
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
                    'action': 'scrapeSchema',
                    'args': [{
                        'user': 'p.username',
                        'password': 'p.password',
                    }],
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