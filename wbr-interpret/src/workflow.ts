// Example Smart Workflow file
// So far, this file is .ts to allow for simple imports etc.

const parameters = {
  login: 'test@gmail.com',
  password: 'secretpassword',
  url: 'https://console.apify.com/sign-in',
};

const cookieAccept = [
  {
    where: {
      selectors: ['button:text-matches("(accept|agree|souhlasím|allow)", "i")'],
    },
    what: [
      {
        type: 'click',
        params: [
          'button:text-matches("(accept|agree|souhlasím|allow)", "i")',
        ],
      },
    ],
  },
];
const loginer = [
  {
    where: {
      selectors: [
        'input[type=text], input[type=email], input[class*=login]',
        'input[type=password]',
      ],
    },
    what: [
      {
        type: 'fill',
        params: [
          'input[type=text],input[type=email], input[class*=login]',
          parameters.login,
        ],
      },
      {
        type: 'fill',
        params: [
          'input[type=password]',
          parameters.password,
        ],
      },
      {
        type: 'press',
        params: [
          'input[type=password]',
          'Enter',
        ],
      },
      {
        type: 'waitForTimeout',
        params: [
          2000,
        ],
      },
    ],
  },
];
const workflow = [
  ...cookieAccept,
  ...loginer,
  {
    where: {
    },
    what: [
      {
        type: 'goto',
        params: [
          parameters.url,
        ],
      },
      {
        type: 'waitForLoadState',
        params: [
        ],
      },
      {
        type: 'waitForTimeout',
        params: [
          3000,
        ],
      },
    ],
  },
];

export default workflow;
