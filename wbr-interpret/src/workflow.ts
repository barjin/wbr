// Example Smart Workflow file
// So far, this file is .js to allow for simple imports etc.

const cookieAccept = [
  {
    where: {
      selectors: { 'button:text-matches("(accept|agree|souhlasím)", "i")': [] },
    },
    what: [
      {
        type: 'click',
        params: [
          'button:text-matches("(accept|agree|souhlasím)", "i")',
        ],
      },
    ],
  },
];
const loginer = [
  {
    where: {
      selectors: {
        'input[type=text], input[type=email], input[class*=login]': [],
        'input[type=password]': [],
      },
    },
    what: [
      {
        type: 'fill',
        params: [
          'input[type=text],input[type=email], input[class*=login]',
          ['loginwithoutzavinac', 'login2', 'invalidmail@mail.mailmail'],
        ],
      },
      {
        type: 'fill',
        params: [
          'input[type=password]',
          ['heslo1', 'heslo2', 'heslo3'],
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
          1000,
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
          ['https://www.netflix.com/cz/login', 'https://console.apify.com/sign-in', 'https://instagram.com', 'https://seznam.cz'],
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
          1000,
        ],
      },
    ],
  },
];
export default workflow;
